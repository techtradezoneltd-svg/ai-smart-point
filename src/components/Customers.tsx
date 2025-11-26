import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useCurrency } from "@/hooks/useCurrency";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { 
  Users, 
  Search, 
  Brain, 
  Star, 
  TrendingUp,
  Mail,
  Phone,
  Calendar,
  ShoppingBag,
  Gift,
  Target
} from "lucide-react";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  totalSpent: number;
  visits: number;
  lastVisit: string;
  loyaltyPoints: number;
  tier: "bronze" | "silver" | "gold" | "platinum";
  aiInsights: string[];
  predictedValue: number;
  riskLevel: "low" | "medium" | "high";
}

const Customers = () => {
  const { formatCurrency } = useCurrency();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);

  const customersData: Customer[] = [
    {
      id: "1",
      name: "Sarah Johnson",
      email: "sarah.j@email.com",
      phone: "+1 (555) 123-4567",
      totalSpent: 2456.80,
      visits: 23,
      lastVisit: "2024-01-23",
      loyaltyPoints: 890,
      tier: "gold",
      aiInsights: [
        "High-value customer - prefers premium electronics",
        "Responds well to weekend promotions",
        "Likely to purchase accessories with main items"
      ],
      predictedValue: 3200,
      riskLevel: "low"
    },
    {
      id: "2",
      name: "Mike Chen",
      email: "mike.chen@email.com",
      phone: "+1 (555) 987-6543",
      totalSpent: 1234.50,
      visits: 15,
      lastVisit: "2024-01-20",
      loyaltyPoints: 450,
      tier: "silver",
      aiInsights: [
        "Price-sensitive customer",
        "Purchases during sales events",
        "Potential for loyalty program engagement"
      ],
      predictedValue: 1800,
      riskLevel: "medium"
    },
    {
      id: "3",
      name: "Emily Rodriguez",
      email: "emily.r@email.com",
      phone: "+1 (555) 456-7890",
      totalSpent: 789.99,
      visits: 8,
      lastVisit: "2024-01-15",
      loyaltyPoints: 234,
      tier: "bronze",
      aiInsights: [
        "New customer with growth potential",
        "Interested in mobile accessories",
        "At risk of churn - needs engagement"
      ],
      predictedValue: 1200,
      riskLevel: "high"
    },
    {
      id: "4",
      name: "David Thompson",
      email: "david.t@email.com",
      phone: "+1 (555) 321-9876",
      totalSpent: 4567.89,
      visits: 34,
      lastVisit: "2024-01-24",
      loyaltyPoints: 1567,
      tier: "platinum",
      aiInsights: [
        "VIP customer - early adopter of new products",
        "Refers other customers frequently",
        "Excellent lifetime value potential"
      ],
      predictedValue: 6000,
      riskLevel: "low"
    }
  ];

  const filteredCustomers = customersData.filter(customer =>
    customer.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getTierColor = (tier: string) => {
    switch (tier) {
      case "platinum": return "bg-gradient-to-r from-purple-500 to-purple-600";
      case "gold": return "bg-gradient-to-r from-yellow-500 to-yellow-600";
      case "silver": return "bg-gradient-to-r from-gray-400 to-gray-500";
      default: return "bg-gradient-to-r from-orange-500 to-orange-600";
    }
  };

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case "high": return "destructive";
      case "medium": return "warning";
      default: return "success";
    }
  };

  const totalCustomers = customersData.length;
  const totalRevenue = customersData.reduce((sum, customer) => sum + customer.totalSpent, 0);
  const avgSpendPerCustomer = totalRevenue / totalCustomers;
  const loyaltyMembers = customersData.filter(c => c.loyaltyPoints > 0).length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            AI Customer Intelligence
          </h1>
          <p className="text-muted-foreground">Smart customer insights and relationship management</p>
        </div>
        <Button className="bg-gradient-primary">
          <Users className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Customers</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">{totalCustomers}</div>
            <p className="text-xs text-muted-foreground">Active customer base</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
            <TrendingUp className="h-4 w-4 text-success" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">{formatCurrency(totalRevenue)}</div>
            <p className="text-xs text-muted-foreground">From all customers</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Spend</CardTitle>
            <ShoppingBag className="h-4 w-4 text-accent" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-accent">{formatCurrency(avgSpendPerCustomer)}</div>
            <p className="text-xs text-muted-foreground">Per customer</p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Loyalty Members</CardTitle>
            <Star className="h-4 w-4 text-warning" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-warning">{loyaltyMembers}</div>
            <p className="text-xs text-muted-foreground">Enrolled in program</p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <Card className="bg-gradient-card border-border">
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search customers by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Customers List */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Customer Database
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {filteredCustomers.map((customer) => (
              <div
                key={customer.id}
                className="p-6 border border-border rounded-lg hover:border-primary/50 transition-all bg-gradient-card"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-16 h-16">
                      <AvatarFallback className={`text-white font-bold ${getTierColor(customer.tier)}`}>
                        {customer.name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="text-lg font-semibold">{customer.name}</h3>
                        <Badge 
                          className={`${getTierColor(customer.tier)} text-white border-0 capitalize`}
                        >
                          {customer.tier}
                        </Badge>
                        <Badge 
                          variant="outline" 
                          className={`border-${getRiskColor(customer.riskLevel)} text-${getRiskColor(customer.riskLevel)}`}
                        >
                          {customer.riskLevel} risk
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-4 h-4" />
                          {customer.email}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Phone className="w-4 h-4" />
                          {customer.phone}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Calendar className="w-4 h-4" />
                          Last visit: {customer.lastVisit}
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <ShoppingBag className="w-4 h-4" />
                          {customer.visits} visits
                        </div>
                      </div>

                      {/* AI Insights */}
                      <div className="bg-accent/10 border border-accent/30 rounded-lg p-3 mb-4">
                        <div className="flex items-center gap-2 mb-2">
                          <Brain className="w-4 h-4 text-accent animate-pulse" />
                          <span className="text-sm font-medium text-accent">AI Customer Insights</span>
                        </div>
                        <div className="space-y-1">
                          {customer.aiInsights.map((insight, index) => (
                            <p key={index} className="text-xs text-muted-foreground">
                              • {insight}
                            </p>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="text-right space-y-4">
                    {/* Financial Stats */}
                    <div className="space-y-2">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Spent</p>
                        <p className="text-xl font-bold text-success">{formatCurrency(customer.totalSpent)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Predicted Value</p>
                        <p className="text-lg font-semibold text-accent">{formatCurrency(customer.predictedValue)}</p>
                      </div>
                      <div>
                        <p className="text-sm text-muted-foreground">Loyalty Points</p>
                        <div className="flex items-center gap-1">
                          <Gift className="w-4 h-4 text-warning" />
                          <span className="font-semibold text-warning">{customer.loyaltyPoints}</span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="space-y-2">
                      <Button size="sm" className="w-full bg-gradient-primary">
                        <Target className="w-4 h-4 mr-2" />
                        Send Offer
                      </Button>
                      <Button size="sm" variant="outline" className="w-full" onClick={() => setSelectedCustomer(customer)}>
                        View Profile
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* AI Customer Insights Panel */}
      <Card className="bg-gradient-card border-accent/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5 text-accent animate-pulse" />
            AI Customer Behavior Analysis
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 border border-accent/30 rounded-lg bg-accent/5">
            <h4 className="font-semibold text-accent mb-2">Churn Risk Alert</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Emily Rodriguez shows high churn risk. Last purchase was 9 days ago, which is 45% longer than her usual interval.
            </p>
            <div className="flex gap-2">
              <Button size="sm" className="bg-gradient-accent">
                Send Re-engagement Offer
              </Button>
              <Button size="sm" variant="outline">
                Schedule Call
              </Button>
            </div>
          </div>

          <div className="p-4 border border-success/30 rounded-lg bg-success/5">
            <h4 className="font-semibold text-success mb-2">Upsell Opportunity</h4>
            <p className="text-sm text-muted-foreground mb-3">
              David Thompson frequently purchases premium phones. AI suggests offering the new iPhone 15 Pro Max with a personalized discount.
            </p>
            <Button size="sm" className="bg-success text-success-foreground">
              Create Personalized Offer
            </Button>
          </div>

          <div className="p-4 border border-warning/30 rounded-lg bg-warning/5">
            <h4 className="font-semibold text-warning mb-2">Loyalty Program Recommendation</h4>
            <p className="text-sm text-muted-foreground mb-3">
              Mike Chen has accumulated enough points for Silver tier benefits but hasn't been notified. Engagement could increase retention by 23%.
            </p>
            <Button size="sm" className="bg-warning text-warning-foreground">
              Send Tier Upgrade Notice
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Customer Detail Dialog */}
      <Dialog open={!!selectedCustomer} onOpenChange={() => setSelectedCustomer(null)}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Customer Profile</DialogTitle>
          </DialogHeader>
          {selectedCustomer && (
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <Avatar className="w-20 h-20">
                  <AvatarFallback className={`text-white font-bold text-xl ${getTierColor(selectedCustomer.tier)}`}>
                    {selectedCustomer.name.split(' ').map(n => n[0]).join('')}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <h3 className="text-2xl font-bold mb-2">{selectedCustomer.name}</h3>
                  <div className="flex gap-2 mb-4">
                    <Badge className={`${getTierColor(selectedCustomer.tier)} text-white border-0 capitalize`}>
                      {selectedCustomer.tier}
                    </Badge>
                    <Badge variant="outline" className={`border-${getRiskColor(selectedCustomer.riskLevel)} text-${getRiskColor(selectedCustomer.riskLevel)}`}>
                      {selectedCustomer.riskLevel} risk
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Spent</p>
                    <p className="text-2xl font-bold text-success">{formatCurrency(selectedCustomer.totalSpent)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Predicted Value</p>
                    <p className="text-2xl font-bold text-accent">{formatCurrency(selectedCustomer.predictedValue)}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Total Visits</p>
                    <p className="text-2xl font-bold text-primary">{selectedCustomer.visits}</p>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <p className="text-sm text-muted-foreground mb-1">Loyalty Points</p>
                    <div className="flex items-center gap-2">
                      <Gift className="w-6 h-6 text-warning" />
                      <p className="text-2xl font-bold text-warning">{selectedCustomer.loyaltyPoints}</p>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-2">Contact Information</h4>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.email}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-muted-foreground" />
                      <span>{selectedCustomer.phone}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-muted-foreground" />
                      <span>Last visit: {selectedCustomer.lastVisit}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-accent/10 border border-accent/30 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Brain className="w-5 h-5 text-accent animate-pulse" />
                    <h4 className="font-semibold text-accent">AI Customer Insights</h4>
                  </div>
                  <div className="space-y-2">
                    {selectedCustomer.aiInsights.map((insight, index) => (
                      <div key={index} className="flex items-start gap-2">
                        <div className="w-1.5 h-1.5 rounded-full bg-accent mt-2" />
                        <p className="text-sm">{insight}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button variant="outline" onClick={() => setSelectedCustomer(null)}>
                  Close
                </Button>
                <Button className="bg-gradient-primary">
                  <Target className="w-4 h-4 mr-2" />
                  Send Offer
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Customers;