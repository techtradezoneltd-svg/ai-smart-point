import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.52.1';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { phone, message } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Processing WhatsApp query:', message);

    // Parse the query and determine response
    const response = await processQuery(message.toLowerCase(), supabase);
    
    // Send response back via WhatsApp
    const whatsappToken = Deno.env.get('WHATSAPP_API_TOKEN');
    
    if (whatsappToken) {
      await fetch(`https://graph.facebook.com/v17.0/YOUR_PHONE_NUMBER_ID/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${whatsappToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: phone.replace(/[^\d]/g, ''),
          type: 'text',
          text: {
            body: response
          }
        }),
      });
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        response: response 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    );

  } catch (error) {
    console.error('Error processing WhatsApp query:', error);
    
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

async function processQuery(query: string, supabase: any): Promise<string> {
  const today = new Date().toISOString().split('T')[0];
  const thisWeek = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  
  try {
    // Today's profit query
    if (query.includes('today') && (query.includes('profit') || query.includes('earnings'))) {
      const { data: sales } = await supabase
        .from('sales')
        .select('*, sale_items(*)')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      const { data: expenses } = await supabase
        .from('expenses')
        .select('amount')
        .eq('expense_date', today);
      
      const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const totalExpenses = expenses?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
      const profit = totalSales - totalExpenses;
      
      return `💰 *Today's Profit*\n\nSales: $${totalSales.toFixed(2)}\nExpenses: $${totalExpenses.toFixed(2)}\n*Net Profit: $${profit.toFixed(2)}*\n\n${profit > 0 ? '📈 Great day!' : '📉 Review expenses'}`;
    }
    
    // Weekly sales query
    if (query.includes('week') && query.includes('sales')) {
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', `${thisWeek}T00:00:00`);
      
      const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const transactionCount = sales?.length || 0;
      
      return `📊 *Weekly Sales*\n\nTotal Revenue: $${totalSales.toFixed(2)}\nTransactions: ${transactionCount}\nAvg per day: $${(totalSales / 7).toFixed(2)}\n\n📈 Keep it up!`;
    }
    
    // Top products query
    if (query.includes('top') && (query.includes('product') || query.includes('item'))) {
      const { data: sales } = await supabase
        .from('sales')
        .select(`
          sale_items (
            quantity,
            total_price,
            products (name)
          )
        `)
        .gte('created_at', `${thisWeek}T00:00:00`);
      
      const productSales = {};
      sales?.forEach(sale => {
        sale.sale_items?.forEach(item => {
          const name = item.products?.name || 'Unknown';
          productSales[name] = (productSales[name] || 0) + Number(item.total_price);
        });
      });
      
      const topProducts = Object.entries(productSales)
        .sort(([,a], [,b]) => b - a)
        .slice(0, 5)
        .map(([name, revenue], index) => `${index + 1}. ${name}: $${revenue.toFixed(2)}`)
        .join('\n');
      
      return `🏆 *Top 5 Products (This Week)*\n\n${topProducts}\n\n🎯 Focus on these bestsellers!`;
    }
    
    // Low stock query
    if (query.includes('stock') || query.includes('inventory')) {
      const { data: lowStock } = await supabase
        .from('products')
        .select('name, current_stock, min_stock_level')
        .lt('current_stock', 'min_stock_level')
        .eq('is_active', true);
      
      if (!lowStock || lowStock.length === 0) {
        return `✅ *Stock Status*\n\nAll items are well stocked!\n\n📦 No reorders needed`;
      }
      
      const stockList = lowStock
        .slice(0, 5)
        .map(item => `• ${item.name}: ${item.current_stock} left`)
        .join('\n');
      
      return `⚠️ *Low Stock Alert*\n\n${stockList}\n\n📋 ${lowStock.length} items need restocking`;
    }
    
    // General status query
    if (query.includes('status') || query.includes('summary') || query.includes('overview')) {
      const { data: sales } = await supabase
        .from('sales')
        .select('total_amount')
        .gte('created_at', `${today}T00:00:00`)
        .lt('created_at', `${today}T23:59:59`);
      
      const { data: lowStock } = await supabase
        .from('products')
        .select('id')
        .lt('current_stock', 'min_stock_level')
        .eq('is_active', true);
      
      const totalSales = sales?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
      const transactionCount = sales?.length || 0;
      const lowStockCount = lowStock?.length || 0;
      
      return `📋 *Business Status*\n\n💰 Today's Sales: $${totalSales.toFixed(2)}\n🛒 Transactions: ${transactionCount}\n📦 Low Stock: ${lowStockCount} items\n\n${totalSales > 0 ? '✅ Active' : '⏸️ Quiet day'}`;
    }
    
    // Help/commands query
    if (query.includes('help') || query.includes('command')) {
      return `🤖 *AI Assistant Commands*\n\n• "Today's profit?" - Daily earnings\n• "Weekly sales?" - 7-day revenue\n• "Top products?" - Best sellers\n• "Stock status?" - Inventory alerts\n• "Business summary?" - Quick overview\n\n💬 Just ask naturally!`;
    }
    
    // Default response for unrecognized queries
    return `🤖 I didn't understand that query.\n\nTry asking:\n• "Today's profit?"\n• "Weekly sales?"\n• "Top 5 products?"\n• "Stock status?"\n• "Help" for more commands\n\n💡 Ask me anything about your business!`;
    
  } catch (error) {
    console.error('Error processing query:', error);
    return `❌ Sorry, I couldn't process that request right now. Please try again later.`;
  }
}