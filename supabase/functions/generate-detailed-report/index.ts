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
    const { reportData } = await req.json();
    
    // Initialize Supabase client
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    console.log('Generating detailed report for date:', reportData.date);

    // Fetch detailed data for the report
    const today = reportData.date;
    
    // Get detailed sales data
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (name, sku)
        )
      `)
      .gte('created_at', `${today}T00:00:00`)
      .lt('created_at', `${today}T23:59:59`);

    // Get expenses data
    const { data: expensesData } = await supabase
      .from('expenses')
      .select('*')
      .eq('expense_date', today);

    // Get product performance
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // Generate comprehensive report
    const detailedReport = {
      reportDate: today,
      generatedAt: new Date().toISOString(),
      summary: reportData,
      
      sales: {
        transactions: salesData || [],
        breakdown: generateSalesBreakdown(salesData),
        paymentMethods: generatePaymentMethodBreakdown(salesData)
      },
      
      expenses: {
        items: expensesData || [],
        breakdown: generateExpenseBreakdown(expensesData)
      },
      
      inventory: {
        lowStock: reportData.lowStockItems,
        stockValue: calculateStockValue(productsData),
        topProducts: generateTopProductsReport(salesData)
      },
      
      insights: {
        profitability: calculateProfitability(reportData),
        trends: generateTrends(salesData),
        recommendations: generateRecommendations(reportData, salesData, expensesData)
      }
    };

    // Convert to Excel format
    const excelData = generateExcelData(detailedReport);
    
    // In a real implementation, you would:
    // 1. Generate Excel file using a library
    // 2. Upload to storage bucket
    // 3. Return download URL
    
    // For now, return JSON structure
    return new Response(
      JSON.stringify({
        success: true,
        reportData: detailedReport,
        url: `https://your-app.com/reports/${today}.xlsx`, // Placeholder URL
        downloadReady: true
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200
      }
    );

  } catch (error) {
    console.error('Error generating detailed report:', error);
    
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

function generateSalesBreakdown(salesData: any[]) {
  if (!salesData || salesData.length === 0) return {};
  
  const breakdown = {
    totalRevenue: salesData.reduce((sum, sale) => sum + Number(sale.total_amount), 0),
    totalTransactions: salesData.length,
    averageTicket: 0,
    hourlyBreakdown: {},
    categoryBreakdown: {}
  };
  
  breakdown.averageTicket = breakdown.totalRevenue / breakdown.totalTransactions;
  
  // Generate hourly breakdown
  salesData.forEach(sale => {
    const hour = new Date(sale.created_at).getHours();
    breakdown.hourlyBreakdown[hour] = (breakdown.hourlyBreakdown[hour] || 0) + Number(sale.total_amount);
  });
  
  return breakdown;
}

function generatePaymentMethodBreakdown(salesData: any[]) {
  if (!salesData) return {};
  
  const breakdown = {};
  salesData.forEach(sale => {
    const method = sale.payment_method || 'cash';
    breakdown[method] = (breakdown[method] || 0) + Number(sale.total_amount);
  });
  
  return breakdown;
}

function generateExpenseBreakdown(expensesData: any[]) {
  if (!expensesData) return {};
  
  const breakdown = {};
  expensesData.forEach(expense => {
    const category = expense.category || 'other';
    breakdown[category] = (breakdown[category] || 0) + Number(expense.amount);
  });
  
  return breakdown;
}

function calculateStockValue(productsData: any[]) {
  if (!productsData) return 0;
  
  return productsData.reduce((total, product) => {
    return total + (Number(product.current_stock) * Number(product.cost_price));
  }, 0);
}

function generateTopProductsReport(salesData: any[]) {
  if (!salesData) return [];
  
  const productSales = {};
  
  salesData.forEach(sale => {
    if (sale.sale_items) {
      sale.sale_items.forEach(item => {
        const productName = item.products?.name || 'Unknown Product';
        if (!productSales[productName]) {
          productSales[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0
          };
        }
        productSales[productName].quantity += Number(item.quantity);
        productSales[productName].revenue += Number(item.total_price);
      });
    }
  });
  
  return Object.values(productSales)
    .sort((a: any, b: any) => b.revenue - a.revenue)
    .slice(0, 10);
}

function calculateProfitability(reportData: any) {
  const margin = reportData.totalSales > 0 ? (reportData.totalProfit / reportData.totalSales) * 100 : 0;
  const netMargin = reportData.totalSales > 0 ? (reportData.netProfit / reportData.totalSales) * 100 : 0;
  
  return {
    grossMargin: margin,
    netMargin: netMargin,
    profitPerTransaction: reportData.transactionCount > 0 ? reportData.netProfit / reportData.transactionCount : 0
  };
}

function generateTrends(salesData: any[]) {
  // Placeholder for trend analysis
  return {
    hourlyTrend: 'Peak sales between 2-4 PM',
    salesTrend: 'Steady throughout the day',
    customerTrend: 'Regular customer base'
  };
}

function generateRecommendations(reportData: any, salesData: any[], expensesData: any[]) {
  const recommendations = [];
  
  if (reportData.lowStockCount > 0) {
    recommendations.push('Restock items to avoid stockouts');
  }
  
  if (reportData.netProfit < reportData.totalSales * 0.1) {
    recommendations.push('Review pricing strategy to improve profit margins');
  }
  
  if (reportData.transactionCount < 50) {
    recommendations.push('Consider marketing initiatives to increase foot traffic');
  }
  
  return recommendations;
}

function generateExcelData(reportData: any) {
  // Prepare data for Excel export
  return {
    summary: [reportData.summary],
    sales: reportData.sales.transactions,
    expenses: reportData.expenses.items,
    topProducts: reportData.inventory.topProducts
  };
}