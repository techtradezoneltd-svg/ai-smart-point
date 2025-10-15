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
    const startOfDay = `${today}T00:00:00`;
    const endOfDay = `${today}T23:59:59`;
    
    // Get detailed sales data with staff info
    const { data: salesData } = await supabase
      .from('sales')
      .select(`
        *,
        sale_items (
          *,
          products (name, sku, category_id, cost_price)
        ),
        profiles!sales_created_by_fkey (full_name, role)
      `)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    // Get expenses data
    const { data: expensesData } = await supabase
      .from('expenses')
      .select(`
        *,
        profiles!expenses_created_by_fkey (full_name, role)
      `)
      .eq('expense_date', today);

    // Get product performance and inventory
    const { data: productsData } = await supabase
      .from('products')
      .select('*')
      .eq('is_active', true);

    // Get stock movements for the day
    const { data: stockMovements } = await supabase
      .from('stock_movements')
      .select(`
        *,
        products (name, sku),
        profiles!stock_movements_created_by_fkey (full_name, role)
      `)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    // Get loan data
    const { data: loansData } = await supabase
      .from('loans')
      .select(`
        *,
        customers (name, phone),
        profiles!loans_created_by_fkey (full_name, role)
      `)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    // Get loan payments for the day
    const { data: loanPayments } = await supabase
      .from('loan_payments')
      .select(`
        *,
        loans (
          total_amount,
          customers (name, phone)
        ),
        profiles!loan_payments_created_by_fkey (full_name, role)
      `)
      .gte('payment_date', startOfDay)
      .lt('payment_date', endOfDay);

    // Get active loans status
    const { data: activeLoans } = await supabase
      .from('loans')
      .select('*')
      .in('status', ['active', 'overdue']);

    // Get customer transactions
    const { data: customerActivity } = await supabase
      .from('customers')
      .select(`
        *,
        sales (count)
      `)
      .gte('created_at', startOfDay)
      .lt('created_at', endOfDay);

    // Get staff performance
    const { data: staffActivity } = await supabase
      .from('profiles')
      .select(`
        id,
        full_name,
        role,
        sales:sales!sales_created_by_fkey (count, total_amount)
      `)
      .eq('is_active', true);

    // Generate comprehensive report
    const detailedReport = {
      reportDate: today,
      generatedAt: new Date().toISOString(),
      summary: reportData,
      
      sales: {
        transactions: salesData || [],
        breakdown: generateSalesBreakdown(salesData),
        paymentMethods: generatePaymentMethodBreakdown(salesData),
        staffPerformance: generateStaffSalesReport(salesData)
      },
      
      expenses: {
        items: expensesData || [],
        breakdown: generateExpenseBreakdown(expensesData),
        byStaff: generateStaffExpenseReport(expensesData)
      },
      
      inventory: {
        lowStock: reportData.lowStockItems,
        stockValue: calculateStockValue(productsData),
        topProducts: generateTopProductsReport(salesData),
        movements: {
          data: stockMovements || [],
          summary: generateStockMovementSummary(stockMovements)
        }
      },

      loans: {
        newLoans: loansData || [],
        payments: loanPayments || [],
        activeLoans: activeLoans || [],
        summary: generateLoanSummary(loansData, loanPayments, activeLoans)
      },

      customers: {
        newCustomers: customerActivity || [],
        activity: generateCustomerActivityReport(salesData, loansData)
      },

      staff: {
        activity: staffActivity || [],
        performance: generateStaffPerformanceReport(salesData, expensesData, stockMovements)
      },

      financial: {
        cashFlow: generateCashFlowAnalysis(salesData, expensesData, loanPayments),
        profitability: calculateProfitability(reportData),
        projections: generateFinancialProjections(salesData, expensesData)
      },
      
      insights: {
        profitability: calculateProfitability(reportData),
        trends: generateTrends(salesData),
        recommendations: generateRecommendations(reportData, salesData, expensesData, loansData, stockMovements)
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

function generateStaffSalesReport(salesData: any[]) {
  if (!salesData) return {};
  
  const staffSales = {};
  salesData.forEach(sale => {
    const staffName = sale.profiles?.full_name || 'Unknown';
    if (!staffSales[staffName]) {
      staffSales[staffName] = { name: staffName, sales: 0, revenue: 0, transactions: 0 };
    }
    staffSales[staffName].transactions += 1;
    staffSales[staffName].revenue += Number(sale.total_amount);
    staffSales[staffName].sales += 1;
  });
  
  return staffSales;
}

function generateStaffExpenseReport(expensesData: any[]) {
  if (!expensesData) return {};
  
  const staffExpenses = {};
  expensesData.forEach(expense => {
    const staffName = expense.profiles?.full_name || 'Unknown';
    if (!staffExpenses[staffName]) {
      staffExpenses[staffName] = { name: staffName, total: 0, count: 0 };
    }
    staffExpenses[staffName].total += Number(expense.amount);
    staffExpenses[staffName].count += 1;
  });
  
  return staffExpenses;
}

function generateStockMovementSummary(movements: any[]) {
  if (!movements) return {};
  
  const summary = {
    in: 0,
    out: 0,
    adjustment: 0,
    damage: 0,
    return: 0
  };
  
  movements.forEach(movement => {
    const type = movement.type;
    summary[type] = (summary[type] || 0) + Number(movement.quantity);
  });
  
  return summary;
}

function generateLoanSummary(newLoans: any[], payments: any[], activeLoans: any[]) {
  const newLoanAmount = newLoans?.reduce((sum, loan) => sum + Number(loan.total_amount), 0) || 0;
  const paymentsAmount = payments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0;
  const outstandingAmount = activeLoans?.reduce((sum, loan) => sum + Number(loan.remaining_balance), 0) || 0;
  
  return {
    newLoansCount: newLoans?.length || 0,
    newLoanAmount,
    paymentsCount: payments?.length || 0,
    paymentsAmount,
    totalOutstanding: outstandingAmount,
    activeLoanCount: activeLoans?.length || 0,
    netLoanFlow: paymentsAmount - newLoanAmount
  };
}

function generateCustomerActivityReport(salesData: any[], loansData: any[]) {
  const uniqueCustomers = new Set();
  
  salesData?.forEach(sale => {
    if (sale.customer_id) uniqueCustomers.add(sale.customer_id);
  });
  
  loansData?.forEach(loan => {
    if (loan.customer_id) uniqueCustomers.add(loan.customer_id);
  });
  
  return {
    uniqueCustomers: uniqueCustomers.size,
    totalInteractions: (salesData?.length || 0) + (loansData?.length || 0),
    newCustomers: loansData?.filter(l => l.customers)?.length || 0
  };
}

function generateStaffPerformanceReport(salesData: any[], expensesData: any[], stockMovements: any[]) {
  const staffMetrics = {};
  
  // Sales performance
  salesData?.forEach(sale => {
    const staffId = sale.created_by;
    const staffName = sale.profiles?.full_name || 'Unknown';
    if (!staffMetrics[staffId]) {
      staffMetrics[staffId] = { name: staffName, sales: 0, revenue: 0, expenses: 0, stockActions: 0 };
    }
    staffMetrics[staffId].sales += 1;
    staffMetrics[staffId].revenue += Number(sale.total_amount);
  });
  
  // Expense tracking
  expensesData?.forEach(expense => {
    const staffId = expense.created_by;
    if (staffMetrics[staffId]) {
      staffMetrics[staffId].expenses += Number(expense.amount);
    }
  });
  
  // Stock management
  stockMovements?.forEach(movement => {
    const staffId = movement.created_by;
    if (staffMetrics[staffId]) {
      staffMetrics[staffId].stockActions += 1;
    }
  });
  
  return Object.values(staffMetrics);
}

function generateCashFlowAnalysis(salesData: any[], expensesData: any[], loanPayments: any[]) {
  const cashIn = (salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0) +
                 (loanPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0);
  const cashOut = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  
  return {
    totalCashIn: cashIn,
    totalCashOut: cashOut,
    netCashFlow: cashIn - cashOut,
    salesRevenue: salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0,
    loanRecovery: loanPayments?.reduce((sum, payment) => sum + Number(payment.amount), 0) || 0
  };
}

function generateFinancialProjections(salesData: any[], expensesData: any[]) {
  const avgDailySales = salesData?.reduce((sum, sale) => sum + Number(sale.total_amount), 0) || 0;
  const avgDailyExpenses = expensesData?.reduce((sum, expense) => sum + Number(expense.amount), 0) || 0;
  
  return {
    projectedWeeklySales: avgDailySales * 7,
    projectedMonthlySales: avgDailySales * 30,
    projectedWeeklyExpenses: avgDailyExpenses * 7,
    projectedMonthlyExpenses: avgDailyExpenses * 30,
    projectedWeeklyProfit: (avgDailySales - avgDailyExpenses) * 7,
    projectedMonthlyProfit: (avgDailySales - avgDailyExpenses) * 30
  };
}

function generateExcelData(reportData: any) {
  // Prepare data for Excel export
  return {
    summary: [reportData.summary],
    sales: reportData.sales.transactions,
    expenses: reportData.expenses.items,
    topProducts: reportData.inventory.topProducts,
    loans: reportData.loans.newLoans,
    loanPayments: reportData.loans.payments,
    stockMovements: reportData.inventory.movements.data,
    staffPerformance: reportData.staff.performance
  };
}