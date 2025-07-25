import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Plus,
  Edit,
  Trash2,
  Phone,
  Mail,
  MapPin,
  Package,
  DollarSign,
  Calendar,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Clock,
  Truck,
  Star,
  FileText,
  Eye
} from "lucide-react";

interface Supplier {
  id: string;
  name: string;
  contactPerson: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  category: string;
  status: "active" | "inactive" | "pending";
  rating: number;
  totalOrders: number;
  totalValue: number;
  lastOrderDate: string;
  paymentTerms: string;
  leadTime: number;
  products: string[];
  reliability: number;
  notes: string;
  joinedDate: string;
}

const Suppliers = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const suppliers: Supplier[] = [
    {
      id: "1",
      name: "TechSound Corporation",
      contactPerson: "John Smith",
      email: "john@techsound.com",
      phone: "+1-234-567-8900",
      address: "123 Tech Avenue",
      city: "San Francisco",
      country: "USA",
      category: "Electronics",
      status: "active",
      rating: 4.8,
      totalOrders: 45,
      totalValue: 125000,
      lastOrderDate: "2024-01-22",
      paymentTerms: "Net 30",
      leadTime: 7,
      products: ["Headphones", "Speakers", "Audio Accessories"],
      reliability: 96,
      notes: "Excellent quality products with fast delivery",
      joinedDate: "2023-05-15"
    },
    {
      id: "2", 
      name: "ProCase Manufacturing",
      contactPerson: "Sarah Johnson",
      email: "sarah@procasemfg.com",
      phone: "+1-234-567-8901",
      address: "456 Industrial Blvd",
      city: "Austin",
      country: "USA",
      category: "Accessories",
      status: "active",
      rating: 4.6,
      totalOrders: 78,
      totalValue: 89500,
      lastOrderDate: "2024-01-25",
      paymentTerms: "Net 15",
      leadTime: 5,
      products: ["Phone Cases", "Screen Protectors", "Cables"],
      reliability: 94,
      notes: "Competitive pricing and good customer service",
      joinedDate: "2023-03-20"
    },
    {
      id: "3",
      name: "GamePro Devices Ltd",
      contactPerson: "Mike Chen",
      email: "mike@gameprodevices.com", 
      phone: "+1-234-567-8902",
      address: "789 Gaming Street",
      city: "Seattle",
      country: "USA",
      category: "Gaming",
      status: "active",
      rating: 4.9,
      totalOrders: 32,
      totalValue: 98750,
      lastOrderDate: "2024-01-20",
      paymentTerms: "Net 30",
      leadTime: 10,
      products: ["Gaming Mice", "Keyboards", "Controllers"],
      reliability: 98,
      notes: "Premium gaming products, slightly higher prices",
      joinedDate: "2023-08-10"
    },
    {
      id: "4",
      name: "Global Parts Supply",
      contactPerson: "Lisa Wang",
      email: "lisa@globalparts.com",
      phone: "+1-234-567-8903", 
      address: "321 Commerce Way",
      city: "Los Angeles",
      country: "USA",
      category: "Components",
      status: "pending",
      rating: 4.2,
      totalOrders: 12,
      totalValue: 24500,
      lastOrderDate: "2024-01-10",
      paymentTerms: "Net 45",
      leadTime: 14,
      products: ["Electronic Components", "Cables", "Adapters"],
      reliability: 87,
      notes: "New supplier, still evaluating performance",
      joinedDate: "2023-12-01"
    }
  ];

  const categories = ["All", "Electronics", "Accessories", "Gaming", "Components"];
  const statuses = ["All", "Active", "Inactive", "Pending"];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "success";
      case "pending": return "warning";
      case "inactive": return "destructive";
      default: return "secondary";
    }
  };

  const getReliabilityColor = (reliability: number) => {
    if (reliability >= 95) return "success";
    if (reliability >= 85) return "warning";
    return "destructive";
  };

  const getRatingStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star 
        key={i} 
        className={`w-4 h-4 ${i < rating ? 'text-warning fill-warning' : 'text-muted-foreground'}`} 
      />
    ));
  };

  const totalSuppliers = suppliers.length;
  const activeSuppliers = suppliers.filter(s => s.status === "active").length;
  const totalOrderValue = suppliers.reduce((sum, s) => sum + s.totalValue, 0);
  const avgRating = suppliers.reduce((sum, s) => sum + s.rating, 0) / suppliers.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Supplier Management
          </h1>
          <p className="text-muted-foreground">Manage vendor relationships and procurement</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <FileText className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Supplier
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Suppliers</p>
                <p className="text-2xl font-bold text-primary">{totalSuppliers}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Active Suppliers</p>
                <p className="text-2xl font-bold text-success">{activeSuppliers}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <CheckCircle className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Order Value</p>
                <p className="text-2xl font-bold text-accent">${totalOrderValue.toLocaleString()}</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-accent" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-warning/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Average Rating</p>
                <p className="text-2xl font-bold text-warning">{avgRating.toFixed(1)}</p>
              </div>
              <div className="p-3 bg-warning/10 rounded-lg">
                <Star className="w-6 h-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="bg-gradient-card border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="w-5 h-5 text-primary" />
            Search & Filter Suppliers
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, contact person, or email..." 
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
            </div>
            <div className="flex gap-2">
              {categories.map((category) => (
                <Button 
                  key={category}
                  variant={selectedCategory === category.toLowerCase() ? "default" : "outline"} 
                  size="sm"
                  onClick={() => setSelectedCategory(category.toLowerCase())}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Suppliers List */}
      <div className="space-y-4">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="bg-gradient-card border-border hover:border-primary/50 transition-all">
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-start gap-4">
                  <div className="p-3 bg-primary/10 rounded-lg">
                    <Package className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-xl font-semibold">{supplier.name}</h3>
                      <Badge 
                        variant="outline" 
                        className={`border-${getStatusColor(supplier.status)} text-${getStatusColor(supplier.status)} capitalize`}
                      >
                        {supplier.status}
                      </Badge>
                      <Badge variant="outline" className="capitalize">
                        {supplier.category}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">Contact: {supplier.contactPerson}</p>
                    <div className="flex items-center gap-1 mb-2">
                      {getRatingStars(supplier.rating)}
                      <span className="text-sm text-muted-foreground ml-2">({supplier.rating}/5)</span>
                    </div>
                  </div>
                </div>

                <div className="text-right">
                  <p className="text-2xl font-bold">${supplier.totalValue.toLocaleString()}</p>
                  <p className="text-sm text-muted-foreground">{supplier.totalOrders} orders</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-4">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Contact Info</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="w-3 h-3 text-muted-foreground" />
                      <span>{supplier.email}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Phone className="w-3 h-3 text-muted-foreground" />
                      <span>{supplier.phone}</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Location</p>
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="w-3 h-3 text-muted-foreground" />
                    <span>{supplier.city}, {supplier.country}</span>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Terms</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="w-3 h-3 text-muted-foreground" />
                      <span>{supplier.paymentTerms}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Truck className="w-3 h-3 text-muted-foreground" />
                      <span>{supplier.leadTime} days</span>
                    </div>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Performance</p>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm">Reliability:</span>
                      <Badge 
                        variant="outline" 
                        className={`border-${getReliabilityColor(supplier.reliability)} text-${getReliabilityColor(supplier.reliability)}`}
                      >
                        {supplier.reliability}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">Last order: {supplier.lastOrderDate}</p>
                  </div>
                </div>

                <div>
                  <p className="text-sm text-muted-foreground mb-1">Products</p>
                  <div className="flex flex-wrap gap-1">
                    {supplier.products.slice(0, 2).map((product, index) => (
                      <Badge key={index} variant="secondary" className="text-xs">
                        {product}
                      </Badge>
                    ))}
                    {supplier.products.length > 2 && (
                      <Badge variant="secondary" className="text-xs">
                        +{supplier.products.length - 2}
                      </Badge>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span>Joined: {supplier.joinedDate}</span>
                  {supplier.notes && (
                    <span className="max-w-xs truncate">Notes: {supplier.notes}</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline">
                    <Mail className="w-3 h-3 mr-1" />
                    Contact
                  </Button>
                  <Button size="sm" className="bg-gradient-primary">
                    <Plus className="w-3 h-3 mr-1" />
                    Order
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default Suppliers;