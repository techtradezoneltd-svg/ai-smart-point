import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/components/ui/use-toast";
import { useCurrency } from "@/hooks/useCurrency";
import { 
  PlayCircle, 
  Clock, 
  CheckCircle, 
  AlertTriangle, 
  Calendar,
  Smartphone,
  MessageSquare,
  RefreshCw,
  Settings,
  Users,
  CreditCard
} from "lucide-react";

interface LoanReminderTest {
  loan_id: string;
  customer_name: string;
  customer_phone: string;
  total_amount: number;
  remaining_balance: number;
  due_date: string;
  status: string;
  reminder_status: string;
  reminders_sent_today: number;
}

const LoanReminderTester: React.FC = () => {
  const { toast } = useToast();
  const { formatCurrency } = useCurrency();
  
  const [testLoans, setTestLoans] = useState<LoanReminderTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [testPhone, setTestPhone] = useState("");
  const [testMessage, setTestMessage] = useState("");

  useEffect(() => {
    loadTestData();
  }, []);

  const loadTestData = async () => {
    try {
      setLoading(true);
      
      // Get loans needing reminders using our database function
      const { data, error } = await supabase.rpc('get_loans_needing_reminders');
      
      if (error) throw error;
      
      setTestLoans(data || []);
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

  const testWhatsAppMessage = async () => {
    if (!testPhone || !testMessage) {
      toast({
        title: "Error",
        description: "Please enter phone number and message",
        variant: "destructive"
      });
      return;
    }

    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('whatsapp-notification', {
        body: {
          phone: testPhone,
          title: 'Test Message',
          message: testMessage,
          type: 'test'
        }
      });

      if (error) throw error;

      toast({
        title: "Success",
        description: "Test WhatsApp message sent successfully"
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to send test message: " + error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const triggerReminderScheduler = async () => {
    try {
      setProcessing(true);
      
      const { data, error } = await supabase.functions.invoke('loan-reminder-scheduler');
      
      if (error) throw error;
      
      toast({
        title: "Success",
        description: `Reminder scheduler completed. ${data.messagesScheduled || 0} messages sent.`
      });
      
      // Reload test data to see updates
      setTimeout(() => {
        loadTestData();
      }, 2000);
      
    } catch (error: any) {
      toast({
        title: "Error",
        description: "Failed to trigger reminder scheduler: " + error.message,
        variant: "destructive"
      });
    } finally {
      setProcessing(false);
    }
  };

  const getReminderStatusColor = (status: string) => {
    switch (status) {
      case 'due_today': return 'bg-yellow-500/20 text-yellow-700 border-yellow-200';
      case 'due_in_2_days': return 'bg-blue-500/20 text-blue-700 border-blue-200';
      case 'overdue': return 'bg-red-500/20 text-red-700 border-red-200';
      default: return 'bg-gray-500/20 text-gray-700 border-gray-200';
    }
  };

  const getReminderStatusIcon = (status: string) => {
    switch (status) {
      case 'due_today': return <AlertTriangle className="w-4 h-4" />;
      case 'due_in_2_days': return <Clock className="w-4 h-4" />;
      case 'overdue': return <AlertTriangle className="w-4 h-4" />;
      default: return <Calendar className="w-4 h-4" />;
    }
  };

  const getStatusDescription = (status: string) => {
    switch (status) {
      case 'due_today': return 'Payment due today - will receive urgent reminder';
      case 'due_in_2_days': return 'Payment due in 2 days - will receive advance reminder';
      case 'overdue': return 'Payment is overdue - will receive escalation reminder';
      default: return 'No immediate reminder needed';
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
            Loan Reminder System Tester
          </h1>
          <p className="text-muted-foreground">Test and monitor automated loan reminders with WhatsApp integration</p>
        </div>
        <div className="flex items-center gap-3">
          <Button onClick={loadTestData} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Refresh
          </Button>
          <Button 
            onClick={triggerReminderScheduler} 
            className="bg-gradient-primary"
            disabled={processing}
          >
            <PlayCircle className="w-4 h-4 mr-2" />
            {processing ? "Processing..." : "Run Reminders"}
          </Button>
        </div>
      </div>

      {/* Test WhatsApp Message */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5" />
            Test WhatsApp Messaging
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="test-phone">Phone Number</Label>
              <Input
                id="test-phone"
                placeholder="e.g. +250788123456"
                value={testPhone}
                onChange={(e) => setTestPhone(e.target.value)}
              />
            </div>
            <div>
              <Label htmlFor="test-message">Test Message</Label>
              <Input
                id="test-message"
                placeholder="Hello! This is a test message from AI POS System"
                value={testMessage}
                onChange={(e) => setTestMessage(e.target.value)}
              />
            </div>
          </div>
          <Button 
            onClick={testWhatsAppMessage}
            disabled={processing}
            className="w-full md:w-auto"
          >
            <MessageSquare className="w-4 h-4 mr-2" />
            Send Test Message
          </Button>
        </CardContent>
      </Card>

      {/* Loan Reminder Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" />
            Loans Requiring Reminders
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {testLoans.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle className="w-12 h-12 mx-auto mb-4 opacity-50 text-green-500" />
                <p className="text-lg font-medium">All caught up!</p>
                <p>No loans require immediate reminders right now.</p>
              </div>
            ) : (
              testLoans.map((loan) => (
                <div key={loan.loan_id} className="border rounded-lg p-4 hover:bg-gray-50/50 transition-colors">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <h3 className="font-semibold text-lg">{loan.customer_name}</h3>
                        <Badge className={getReminderStatusColor(loan.reminder_status)}>
                          {getReminderStatusIcon(loan.reminder_status)}
                          <span className="ml-1 capitalize">{loan.reminder_status.replace('_', ' ')}</span>
                        </Badge>
                        {loan.reminders_sent_today > 0 && (
                          <Badge variant="outline" className="bg-green-50 text-green-700">
                            {loan.reminders_sent_today} sent today
                          </Badge>
                        )}
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm mb-3">
                        <div>
                          <p className="text-muted-foreground">Total Amount</p>
                          <p className="font-medium">{formatCurrency(loan.total_amount)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Outstanding</p>
                          <p className="font-medium text-red-600">{formatCurrency(loan.remaining_balance)}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Due Date</p>
                          <p className="font-medium">{new Date(loan.due_date).toLocaleDateString()}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Status</p>
                          <p className="font-medium capitalize">{loan.status}</p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 text-sm text-muted-foreground mb-2">
                        <div className="flex items-center gap-1">
                          <Smartphone className="w-4 h-4" />
                          <span>{loan.customer_phone}</span>
                        </div>
                      </div>

                      <div className="bg-blue-50/50 p-3 rounded-lg">
                        <p className="text-sm text-blue-700">
                          <strong>AI Action:</strong> {getStatusDescription(loan.reminder_status)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>

      {/* System Info */}
      <Card className="bg-gradient-card border-primary/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5" />
            Automated System Configuration
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">Reminder Schedule</h3>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span>Daily Check (Morning):</span>
                  <span className="font-medium">9:00 AM</span>
                </div>
                <div className="flex justify-between">
                  <span>Daily Check (Evening):</span>
                  <span className="font-medium">6:00 PM</span>
                </div>
                <div className="flex justify-between">
                  <span>Advance Warning:</span>
                  <span className="font-medium">2 days before due</span>
                </div>
                <div className="flex justify-between">
                  <span>Due Date Reminder:</span>
                  <span className="font-medium">On due date</span>
                </div>
                <div className="flex justify-between">
                  <span>Overdue Follow-up:</span>
                  <span className="font-medium">Daily after due date</span>
                </div>
              </div>
            </div>
            
            <div className="space-y-3">
              <h3 className="font-semibold text-primary">AI Features</h3>
              <div className="space-y-2 text-sm">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Personalized messaging based on payment history</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Risk-based reminder frequency</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Automatic tone adjustment (polite/firm)</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>WhatsApp delivery confirmation</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-600" />
                  <span>Thank you messages after payment</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoanReminderTester;