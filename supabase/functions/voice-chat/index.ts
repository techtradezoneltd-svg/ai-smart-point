import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { message } = await req.json();
    const OPENAI_API_KEY = Deno.env.get('OPENAI_API_KEY');
    
    if (!OPENAI_API_KEY) {
      throw new Error('OPENAI_API_KEY is not configured');
    }

    // Initialize Supabase client to get context
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Get current business context
    const today = new Date().toISOString().split('T')[0];
    
    const [salesData, productsData, customersData, loansData] = await Promise.all([
      supabase.from('sales').select('total_amount, status').gte('created_at', today),
      supabase.from('products').select('name, current_stock, min_stock_level').eq('is_active', true),
      supabase.from('customers').select('name, phone').eq('is_active', true),
      supabase.from('loans').select('status, remaining_balance').in('status', ['active', 'overdue'])
    ]);

    const totalSalesToday = salesData.data?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
    const lowStockItems = productsData.data?.filter(p => p.current_stock <= p.min_stock_level).length || 0;
    const activeLoans = loansData.data?.length || 0;
    const totalLoanAmount = loansData.data?.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0) || 0;

    const systemPrompt = `You are an AI assistant for a Point of Sale (POS) system. You can help with:

CURRENT BUSINESS STATUS (as of today):
- Total sales today: ${totalSalesToday.toFixed(2)}
- Total sales count: ${salesData.data?.length || 0}
- Low stock items: ${lowStockItems}
- Total products: ${productsData.data?.length || 0}
- Active customers: ${customersData.data?.length || 0}
- Active loans: ${activeLoans}
- Total loan amount outstanding: ${totalLoanAmount.toFixed(2)}

VOICE COMMANDS YOU CAN EXECUTE:
- "show sales" / "open sales" - Navigate to sales history
- "show products" / "open products" - Navigate to product management
- "show inventory" / "open inventory" - Navigate to stock management
- "show customers" / "open customers" - Navigate to customer management
- "show reports" / "open reports" - Navigate to reports
- "show dashboard" / "open dashboard" - Navigate to dashboard
- "add product" - Start adding a new product
- "new sale" - Start a new sale transaction
- "check stock" - Show current stock status
- "low stock" - Show items with low stock

When users ask about the business, provide insights based on the current data above. When they give voice commands, respond with confirmation and the command will be executed. Answer any general questions like a helpful AI assistant.

Be conversational, helpful, and concise in your responses.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('OpenAI API error:', error);
      throw new Error('Failed to get AI response');
    }

    const data = await response.json();
    const aiResponse = data.choices[0].message.content;

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-chat function:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
