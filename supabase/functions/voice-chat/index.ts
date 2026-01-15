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
    console.log('Received message:', message);
    
    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      console.error('LOVABLE_API_KEY is not configured');
      return new Response(
        JSON.stringify({ 
          response: "I'm having trouble connecting to the AI service. Please try again later.",
          error: 'AI service not configured'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }
    console.log('LOVABLE_API_KEY is configured');

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
    const lowStockItems = productsData.data?.filter(p => (p.current_stock || 0) <= (p.min_stock_level || 0)).length || 0;
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

    console.log('Calling Lovable AI Gateway...');
    
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-3-flash-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message }
        ],
        temperature: 0.7,
        max_tokens: 500
      }),
    });

    console.log('Lovable AI Gateway response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Lovable AI Gateway error:', errorText);
      
      // Check for rate limit errors
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ 
            response: "I'm receiving too many requests right now. Please wait a moment and try again.",
            error: 'Rate limit exceeded'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Check for payment required
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ 
            response: "The AI service requires additional credits. Please check your workspace settings.",
            error: 'Payment required'
          }),
          { 
            status: 200,
            headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
          }
        );
      }
      
      // Return a graceful fallback response
      return new Response(
        JSON.stringify({ 
          response: "I'm having trouble processing your request. Please try again.",
          error: `AI service error: ${response.status}`
        }),
        { 
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
        }
      );
    }

    const data = await response.json();
    console.log('AI response received successfully');
    
    const aiResponse = data.choices?.[0]?.message?.content || "I couldn't process that command. Please try again.";

    return new Response(
      JSON.stringify({ response: aiResponse }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error in voice-chat function:', error);
    return new Response(
      JSON.stringify({ 
        response: "I encountered an error processing your request. Please try again.",
        error: error.message 
      }),
      { 
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    );
  }
});
