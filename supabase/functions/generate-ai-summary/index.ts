import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface DailyReportData {
  date: string;
  totalSales: number;
  totalProfit: number;
  totalExpenses: number;
  netProfit: number;
  transactionCount: number;
  lowStockCount: number;
  lowStockItems: any[];
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { reportData }: { reportData: DailyReportData } = await req.json();
    const openaiApiKey = Deno.env.get('OPENAI_API_KEY');

    if (!openaiApiKey) {
      throw new Error('OpenAI API key not configured');
    }

    console.log('Generating AI summary for date:', reportData.date);

    // Create prompt for AI summary with comprehensive data
    const prompt = `Analyze this comprehensive daily business report and create a detailed WhatsApp message summary:

📊 FINANCIAL OVERVIEW:
Date: ${reportData.date}
Total Sales: $${reportData.totalSales || 0}
Total Profit: $${reportData.totalProfit || 0}
Total Expenses: $${reportData.totalExpenses || 0}
Net Profit: $${reportData.netProfit || 0}

📈 SALES & TRANSACTIONS:
Total Transactions: ${reportData.transactionCount || 0}
Average Transaction Value: $${reportData.transactionCount > 0 ? (reportData.totalSales / reportData.transactionCount).toFixed(2) : 0}

💰 LOANS & CREDIT:
New Loans Issued: ${reportData.newLoansCount || 0} (${reportData.newLoanAmount || 0})
Loan Payments Received: ${reportData.loanPaymentsCount || 0} ($${reportData.loanPaymentsAmount || 0})
Outstanding Loans: ${reportData.activeLoanCount || 0} ($${reportData.totalOutstanding || 0})

📦 INVENTORY:
Low Stock Items: ${reportData.lowStockCount || 0}
Stock Movements: ${reportData.stockMovementsCount || 0}
Inventory Value: $${reportData.inventoryValue || 0}

👥 STAFF & CUSTOMERS:
Active Staff: ${reportData.activeStaffCount || 0}
Customer Interactions: ${reportData.customerInteractions || 0}
New Customers: ${reportData.newCustomers || 0}

🔄 OPERATIONAL ACTIVITY:
Stock In: ${reportData.stockIn || 0} units
Stock Out: ${reportData.stockOut || 0} units
Returns/Damages: ${reportData.stockAdjustments || 0} units

Create a comprehensive but concise summary (max 300 words) that:
1. Highlights key performance metrics with context
2. Identifies trends and patterns in sales, inventory, and loans
3. Points out concerns or unusual activities
4. Provides actionable recommendations
5. Assesses overall business health
6. Notes staff performance highlights
7. Flags financial risks or opportunities

Use emojis strategically and maintain a professional yet conversational tone suitable for a business owner receiving critical daily insights.`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openaiApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: 'You are an AI business analyst that creates concise, actionable daily business summaries for WhatsApp messages. Be professional but conversational.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        max_tokens: 300,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      const errorData = await response.text();
      console.error('OpenAI API error:', errorData);
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiSummary = data.choices[0].message.content;

    console.log('AI summary generated successfully');

    // Also generate insights and anomaly detection
    const insights = await generateInsights(reportData);

    return new Response(
      JSON.stringify({
        success: true,
        summary: aiSummary,
        insights,
        reportData
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating AI summary:', error);
    
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

async function generateInsights(reportData: DailyReportData) {
  const insights = [];

  // Profit margin analysis
  const profitMargin = reportData.totalSales > 0 ? (reportData.totalProfit / reportData.totalSales) * 100 : 0;
  if (profitMargin < 20) {
    insights.push({
      type: 'warning',
      title: 'Low Profit Margin',
      message: `Profit margin is ${profitMargin.toFixed(1)}%. Consider reviewing pricing or costs.`
    });
  }

  // Transaction analysis
  const avgTransactionValue = reportData.transactionCount > 0 ? reportData.totalSales / reportData.transactionCount : 0;
  if (avgTransactionValue < 25) {
    insights.push({
      type: 'info',
      title: 'Low Average Sale',
      message: `Average transaction is $${avgTransactionValue.toFixed(2)}. Upselling opportunities available.`
    });
  }

  // Stock alerts
  if (reportData.lowStockCount > 0) {
    insights.push({
      type: 'alert',
      title: 'Stock Alert',
      message: `${reportData.lowStockCount} items need restocking to avoid stockouts.`
    });
  }

  // Performance indicators
  if (reportData.netProfit < 0) {
    insights.push({
      type: 'critical',
      title: 'Negative Profit',
      message: 'Daily expenses exceeded profit. Review cost structure urgently.'
    });
  }

  return insights;
}