import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  CreditCard, 
  AlertTriangle, 
  CheckCircle, 
  Clock, 
  TrendingUp,
  TrendingDown,
  Users,
  DollarSign,
  Calendar,
  MessageSquare,
  Download,
  BarChart3,
  PieChart,
  Activity,
  Target,
  Smartphone,
  AlertCircle,
  CheckCheck,
  XCircle
} from "lucide-react";

interface LoanStats {
  total_loans: number;
  active_loans: number;
  overdue_loans: number;
  paid_loans: number;
  total_outstanding: number;
  total_collected: number;
  default_rate: number;
  avg_loan_amount: number;
}

interface CustomerRisk {
  customer_id: string;
  customer_name: string;
  customer_phone: string;
  total_loans: number;
  outstanding_amount: number;
  risk_level: 'low' | 'medium' | 'high';
  payment_history_count: number;
  on_time_rate: number;
  last_payment_date: string;
}

interface ReminderActivity {
  id: string;
  loan_id: string;
  customer_name: string;
  reminder_type: string;
  message_content: string;
  scheduled_date: string;
  sent_date: string;
  is_sent: boolean;
  whatsapp_message_id: string;
}

const LoanReports: React.FC = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  
  const [stats, setStats] = useState<LoanStats | null>(null);
  const [customerRisks, setCustomerRisks] = useState<CustomerRisk[]>([]);
  const [reminders, setReminders] = useState<ReminderActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    loadLoanData();
  }, []);

  const loadLoanData = async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadLoanStats(),
        loadCustomerRisks(),
        loadReminderActivity()
      ]);
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to load loan data: " + error.message,
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const loadLoanStats = async () => {
    const { data: loans, error } = await supabase
      .from('loans')
      .select('*');

    if (error) throw error;

    const stats: LoanStats = {
      total_loans: loans.length,
      active_loans: loans.filter(l => l.status === 'active').length,
      overdue_loans: loans.filter(l => l.status === 'overdue').length,
      paid_loans: loans.filter(l => l.status === 'paid').length,
      total_outstanding: loans.filter(l => l.status !== 'paid').reduce((sum, l) => sum + l.remaining_balance, 0),
      total_collected: loans.reduce((sum, l) => sum + l.paid_amount, 0),
      default_rate: loans.length > 0 ? (loans.filter(l => l.status === 'defaulted').length / loans.length) * 100 : 0,
      avg_loan_amount: loans.length > 0 ? loans.reduce((sum, l) => sum + l.total_amount, 0) / loans.length : 0
    };

    setStats(stats);
  };

  const loadCustomerRisks = async () => {
    const { data: customersWithLoans, error } = await supabase
      .from('customers')
      .select(`
        id,
        name,
        phone,
        repayment_behavior,
        loans!inner (
          total_amount,
          remaining_balance,
          status
        )
      `);

    if (error) throw error;

    const risks: CustomerRisk[] = customersWithLoans.map(customer => {
      const behavior = (customer.repayment_behavior as any) || {};
      const paymentHistory = (behavior.payment_history as any[]) || [];
      const onTimePayments = paymentHistory.filter((p: any) => p.on_time).length;
      const totalPayments = paymentHistory.length;
      
      const totalLoans = customer.loans.length;
      const outstandingAmount = customer.loans
        .filter((l: any) => l.status !== 'paid')
        .reduce((sum: number, l: any) => sum + l.remaining_balance, 0);

      return {
        customer_id: customer.id,
        customer_name: customer.name,
        customer_phone: customer.phone,
        total_loans: totalLoans,
        outstanding_amount: outstandingAmount,
        risk_level: ((behavior.risk_level as string) || 'low') as 'low' | 'medium' | 'high',
        payment_history_count: totalPayments,
        on_time_rate: totalPayments > 0 ? onTimePayments / totalPayments : 0,
        last_payment_date: paymentHistory.length > 0 ? paymentHistory[paymentHistory.length - 1].date : null
      };
    }).sort((a, b) => b.outstanding_amount - a.outstanding_amount);

    setCustomerRisks(risks);
  };

  const loadReminderActivity = async () => {
    const { data: reminderData, error } = await supabase
      .from('loan_reminders')
      .select(`
        *,
        loans!inner (
          customers (name)
        )
      `)
      .order('created_at', { ascending: false })
      .limit(50);

    if (error) throw error;

    const formattedReminders: ReminderActivity[] = reminderData.map(reminder => ({
      id: reminder.id,
      loan_id: reminder.loan_id,
      customer_name: reminder.loans.customers.name,
      reminder_type: reminder.reminder_type,
      message_content: reminder.message_content,
      scheduled_date: reminder.scheduled_date,
      sent_date: reminder.sent_date,
      is_sent: reminder.is_sent,
      whatsapp_message_id: reminder.whatsapp_message_id
    }));

    setReminders(formattedReminders);
  };

  const triggerLoanReminders = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('loan-reminder-scheduler');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Loan reminders processed. ${data.messagesScheduled} messages sent.`
      });
      
      // Reload reminder data
      loadReminderActivity();
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to trigger reminders: " + error.message,
        variant: "destructive"
      });
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'low': return 'bg-green-500/20 text-green-700 border-green-200';
      case 'medium': return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'high': return 'bg-red-500/20 text-red-700 border-red-200';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getReminderStatusIcon = (isReminderSent: boolean) => {
    return isReminderSent ? (
      <CheckCheck className="w-4 h-4 text-green-600" />
    ) : (
      <Clock className="w-4 h-4 text-yellow-600" />
    );
  };

  const getReminderTypeColor = (type: string) => {
    switch (type) {
      case 'before_due': return 'bg-blue-500/20 text-blue-700';
      case 'on_due': return 'bg-yellow-500/20 text-yellow-700';
      case 'overdue': return 'bg-red-500/20 text-red-700';
      default: return 'bg-gray-500/20 text-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Loan Reports & Analytics
          </h1>
          <p className="text-muted-foreground">Comprehensive loan management insights with AI-powered reminders</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={triggerLoanReminders} className="bg-gradient-primary">
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Reminders
          </Button>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Loans</p>
                  <p className="text-2xl font-bold">{stats.total_loans}</p>
                </div>
                <div className="w-12 h-12 bg-primary/20 rounded-lg flex items-center justify-center">
                  <CreditCard className="w-6 h-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Outstanding</p>
                  <p className="text-2xl font-bold">{formatCurrency(stats.total_outstanding)}</p>
                </div>
                <div className="w-12 h-12 bg-yellow-500/20 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">{stats.overdue_loans}</p>
                </div>
                <div className="w-12 h-12 bg-red-500/20 rounded-lg flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Collection Rate</p>
                  <p className="text-2xl font-bold text-green-600">
                    {((stats.total_collected / (stats.total_collected + stats.total_outstanding)) * 100).toFixed(1)}%
                  </p>
                </div>
                <div className="w-12 h-12 bg-green-500/20 rounded-lg flex items-center justify-center">
                  <TrendingUp className="w-6 h-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detailed Reports */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid grid-cols-3 w-full max-w-md">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="customers">Customers</TabsTrigger>
          <TabsTrigger value="reminders">Reminders</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="w-5 h-5" />
                Loan Performance Overview
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-semibold">Key Metrics</h3>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-gray-50/50 rounded-lg">
                        <span>Average Loan Amount</span>
                        <span className="font-medium">{formatCurrency(stats.avg_loan_amount)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 rounded-lg">
                        <span>Active Loans</span>
                        <span className="font-medium text-blue-600">{stats.active_loans}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 rounded-lg">
                        <span>Paid Loans</span>
                        <span className="font-medium text-green-600">{stats.paid_loans}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-gray-50/50 rounded-lg">
                        <span>Default Rate</span>
                        <span className="font-medium text-red-600">{stats.default_rate.toFixed(1)}%</span>
                      </div>
                    </div>
                  )}
                </div>
                
                <div className="space-y-4">
                  <h3 className="font-semibold">Collection Summary</h3>
                  {stats && (
                    <div className="space-y-3">
                      <div className="flex justify-between p-3 bg-green-50/50 rounded-lg">
                        <span>Total Collected</span>
                        <span className="font-medium text-green-600">{formatCurrency(stats.total_collected)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-yellow-50/50 rounded-lg">
                        <span>Total Outstanding</span>
                        <span className="font-medium text-yellow-600">{formatCurrency(stats.total_outstanding)}</span>
                      </div>
                      <div className="flex justify-between p-3 bg-blue-50/50 rounded-lg">
                        <span>Total Portfolio</span>
                        <span className="font-medium text-blue-600">
                          {formatCurrency(stats.total_collected + stats.total_outstanding)}
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="customers" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Customer Risk Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {customerRisks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No customer loan data found</p>
                  </div>
                ) : (
                  customerRisks.map((customer) => (
                    <div key={customer.customer_id} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{customer.customer_name}</h3>
                            <Badge className={getRiskColor(customer.risk_level)}>
                              {customer.risk_level} risk
                            </Badge>
                            <Badge variant="outline">
                              {customer.total_loans} loans
                            </Badge>
                          </div>
                          
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div>
                              <p className="text-muted-foreground">Outstanding</p>
                              <p className="font-medium text-red-600">{formatCurrency(customer.outstanding_amount)}</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Payment History</p>
                              <p className="font-medium">{customer.payment_history_count} payments</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">On-Time Rate</p>
                              <p className="font-medium text-green-600">{(customer.on_time_rate * 100).toFixed(1)}%</p>
                            </div>
                            <div>
                              <p className="text-muted-foreground">Phone</p>
                              <p className="font-medium">{customer.customer_phone}</p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="reminders" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" />
                Reminder Activity
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {reminders.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>No reminder activity found</p>
                  </div>
                ) : (
                  reminders.map((reminder) => (
                    <div key={reminder.id} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-2">
                            <h3 className="font-semibold">{reminder.customer_name}</h3>
                            <Badge className={getReminderTypeColor(reminder.reminder_type)}>
                              {reminder.reminder_type.replace('_', ' ')}
                            </Badge>
                            <div className="flex items-center gap-1">
                              {getReminderStatusIcon(reminder.is_sent)}
                              <span className="text-sm text-muted-foreground">
                                {reminder.is_sent ? 'Sent' : 'Pending'}
                              </span>
                            </div>
                          </div>
                          
                          <p className="text-sm mb-3 bg-gray-50/50 p-3 rounded-lg">
                            {reminder.message_content}
                          </p>
                          
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>Scheduled: {new Date(reminder.scheduled_date).toLocaleDateString()}</span>
                            </div>
                            {reminder.sent_date && (
                              <div className="flex items-center gap-1">
                                <Smartphone className="w-4 h-4" />
                                <span>Sent: {new Date(reminder.sent_date).toLocaleDateString()}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default LoanReports;