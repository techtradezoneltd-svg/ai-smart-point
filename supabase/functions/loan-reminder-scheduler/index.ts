import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    console.log('Starting loan reminder scheduler...');

    // Get all active and overdue loans
    const { data: loans, error: loansError } = await supabase
      .from('loans')
      .select(`
        *,
        customers (name, phone, repayment_behavior)
      `)
      .in('status', ['active', 'overdue']);

    if (loansError) {
      console.error('Error fetching loans:', loansError);
      throw loansError;
    }

    console.log(`Found ${loans?.length || 0} loans to process`);

    let remindersGenerated = 0;
    let messagesScheduled = 0;

    for (const loan of loans || []) {
      const customer = loan.customers;
      const today = new Date();
      const dueDate = new Date(loan.due_date);
      const daysDiff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

      console.log(`Processing loan ${loan.id} for ${customer.name}, due in ${daysDiff} days`);

      // Determine if we need to send a reminder
      let shouldSendReminder = false;
      let reminderType = '';
      let messageContent = '';

      if (daysDiff === 2) {
        // 2 days before due date
        shouldSendReminder = true;
        reminderType = 'before_due';
        messageContent = await generatePersonalizedMessage(customer, loan, 'before_due', openaiApiKey);
      } else if (daysDiff === 0) {
        // Due today
        shouldSendReminder = true;
        reminderType = 'on_due';
        messageContent = await generatePersonalizedMessage(customer, loan, 'on_due', openaiApiKey);
      } else if (daysDiff < 0) {
        // Overdue
        shouldSendReminder = true;
        reminderType = 'overdue';
        messageContent = await generatePersonalizedMessage(customer, loan, 'overdue', openaiApiKey);
        
        // Update loan status to overdue
        await supabase
          .from('loans')
          .update({ status: 'overdue' })
          .eq('id', loan.id);
      }

      if (shouldSendReminder) {
        // Check if we already sent this type of reminder today
        const { data: existingReminder } = await supabase
          .from('loan_reminders')
          .select('id')
          .eq('loan_id', loan.id)
          .eq('reminder_type', reminderType)
          .gte('created_at', new Date().toISOString().split('T')[0])
          .limit(1);

        if (!existingReminder || existingReminder.length === 0) {
          // Generate AI risk assessment
          const aiPersonalization = await generateAIPersonalization(customer, loan, openaiApiKey);

          // Create reminder record
          const { data: reminderData, error: reminderError } = await supabase
            .from('loan_reminders')
            .insert({
              loan_id: loan.id,
              reminder_type: reminderType,
              message_content: messageContent,
              scheduled_date: new Date().toISOString(),
              ai_personalization: aiPersonalization
            })
            .select()
            .single();

          if (reminderError) {
            console.error('Error creating reminder:', reminderError);
            continue;
          }

          remindersGenerated++;

          // Send WhatsApp message
          try {
            const whatsappResponse = await supabase.functions.invoke('whatsapp-notification', {
              body: {
                phone: customer.phone,
                title: getMessageTitle(reminderType),
                message: messageContent,
                type: 'alert'
              }
            });

            if (whatsappResponse.error) {
              console.error('WhatsApp sending failed:', whatsappResponse.error);
            } else {
              // Mark reminder as sent
              await supabase
                .from('loan_reminders')
                .update({ 
                  is_sent: true, 
                  sent_date: new Date().toISOString(),
                  whatsapp_message_id: whatsappResponse.data?.messageId
                })
                .eq('id', reminderData.id);

              messagesScheduled++;
              console.log(`Reminder sent to ${customer.name} for loan ${loan.id}`);
            }
          } catch (whatsappError) {
            console.error('Error sending WhatsApp:', whatsappError);
          }
        } else {
          console.log(`Reminder already sent today for loan ${loan.id}`);
        }
      }
    }

    // Generate loan insights and analytics
    await updateLoanAnalytics(supabase, openaiApiKey);

    console.log(`Loan reminder scheduler completed. Reminders generated: ${remindersGenerated}, Messages sent: ${messagesScheduled}`);

    return new Response(
      JSON.stringify({ 
        success: true, 
        remindersGenerated,
        messagesScheduled,
        loansProcessed: loans?.length || 0
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error in loan reminder scheduler:', error);
    
    return new Response(
      JSON.stringify({ 
        success: false, 
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500 
      }
    );
  }
});

async function generatePersonalizedMessage(customer: any, loan: any, reminderType: string, openaiApiKey?: string): Promise<string> {
  const behavior = customer.repayment_behavior || {};
  const riskLevel = behavior.risk_level || 'low';
  const paymentHistory = behavior.payment_history || [];
  
  // Default messages if OpenAI is not available
  const defaultMessages = {
    'before_due': `Dear ${customer.name}, your loan balance of $${loan.remaining_balance} is due on ${new Date(loan.due_date).toLocaleDateString()}. Please prepare to pay. Thank you!`,
    'on_due': `Reminder: Your loan balance of $${loan.remaining_balance} is due today. Please settle at your earliest convenience.`,
    'overdue': `Your loan balance of $${loan.remaining_balance} is overdue since ${new Date(loan.due_date).toLocaleDateString()}. Please settle soon to avoid restrictions.`
  };

  if (!openaiApiKey) {
    return defaultMessages[reminderType as keyof typeof defaultMessages] || defaultMessages['on_due'];
  }

  try {
    const prompt = `Generate a personalized WhatsApp loan reminder message for a customer with the following details:
    - Name: ${customer.name}
    - Loan Amount: $${loan.remaining_balance}
    - Due Date: ${loan.due_date}
    - Risk Level: ${riskLevel}
    - Payment History: ${paymentHistory.length} previous payments
    - Reminder Type: ${reminderType}
    
    The message should be:
    - Professional but friendly
    - Personalized based on their payment history
    - Appropriate for the reminder type (before due, on due, or overdue)
    - Include specific amount and date
    - End with "🤖 AI POS System"
    - Keep under 160 characters
    
    ${riskLevel === 'high' ? 'Use slightly more urgent tone.' : ''}
    ${paymentHistory.length > 3 ? 'Reference their good payment history.' : ''}`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are a helpful assistant that generates personalized loan reminder messages.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 150,
        temperature: 0.7
      }),
    });

    const data = await response.json();
    return data.choices[0].message.content || defaultMessages[reminderType as keyof typeof defaultMessages];
  } catch (error) {
    console.error('Error generating personalized message:', error);
    return defaultMessages[reminderType as keyof typeof defaultMessages] || defaultMessages['on_due'];
  }
}

async function generateAIPersonalization(customer: any, loan: any, openaiApiKey?: string): Promise<any> {
  const behavior = customer.repayment_behavior || {};
  const paymentHistory = behavior.payment_history || [];
  
  // Calculate basic metrics
  const onTimePayments = paymentHistory.filter((p: any) => p.on_time).length;
  const totalPayments = paymentHistory.length;
  const onTimeRate = totalPayments > 0 ? onTimePayments / totalPayments : 0;
  
  const basicPersonalization = {
    risk_level: onTimeRate > 0.8 ? 'low' : onTimeRate > 0.5 ? 'medium' : 'high',
    payment_history_count: totalPayments,
    on_time_rate: onTimeRate,
    usually_late: onTimeRate < 0.5,
    last_payment_date: paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1].date : null
  };

  if (!openaiApiKey) {
    return basicPersonalization;
  }

  try {
    const prompt = `Analyze this customer's loan repayment behavior and provide AI insights:
    - Payment History: ${JSON.stringify(paymentHistory.slice(-5))}
    - Current Loan: $${loan.remaining_balance}
    - Due Date: ${loan.due_date}
    - On-time Rate: ${Math.round(onTimeRate * 100)}%
    
    Provide insights as JSON with risk_level, recommended_approach, and next_action.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: 'You are an AI financial analyst. Respond only with valid JSON.' },
          { role: 'user', content: prompt }
        ],
        max_tokens: 200,
        temperature: 0.3
      }),
    });

    const data = await response.json();
    const aiInsights = JSON.parse(data.choices[0].message.content);
    
    return { ...basicPersonalization, ...aiInsights };
  } catch (error) {
    console.error('Error generating AI personalization:', error);
    return basicPersonalization;
  }
}

async function updateLoanAnalytics(supabase: any, openaiApiKey?: string) {
  try {
    // Get loan statistics
    const { data: loanStats } = await supabase
      .from('loans')
      .select('status, remaining_balance, due_date, customers(repayment_behavior)')
      .neq('status', 'paid');

    if (!loanStats || loanStats.length === 0) return;

    const totalOutstanding = loanStats.reduce((sum: number, loan: any) => sum + loan.remaining_balance, 0);
    const overdueCount = loanStats.filter((loan: any) => new Date(loan.due_date) < new Date()).length;
    const riskDistribution = loanStats.reduce((acc: any, loan: any) => {
      const risk = loan.customers?.repayment_behavior?.risk_level || 'medium';
      acc[risk] = (acc[risk] || 0) + 1;
      return acc;
    }, {});

    // Store analytics in AI recommendations
    await supabase
      .from('ai_recommendations')
      .insert({
        type: 'loan_analytics',
        title: 'Daily Loan Analytics',
        message: `Outstanding: $${totalOutstanding.toFixed(2)}, Overdue: ${overdueCount} loans`,
        priority: overdueCount > 5 ? 'high' : 'medium',
        data: {
          total_outstanding: totalOutstanding,
          overdue_count: overdueCount,
          risk_distribution: riskDistribution,
          generated_at: new Date().toISOString()
        }
      });

  } catch (error) {
    console.error('Error updating loan analytics:', error);
  }
}

function getMessageTitle(reminderType: string): string {
  switch (reminderType) {
    case 'before_due':
      return 'Loan Payment Reminder';
    case 'on_due':
      return 'Payment Due Today';
    case 'overdue':
      return 'Overdue Payment Notice';
    default:
      return 'Loan Reminder';
  }
}