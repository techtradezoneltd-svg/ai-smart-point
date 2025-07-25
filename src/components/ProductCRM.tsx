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
  Package,
  BarChart3,
  TrendingUp,
  TrendingDown,
  Star,
  AlertTriangle,
  Eye,
  Tag,
  DollarSign,
  Calendar,
  Image
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  sku: string;
  barcode: string;
  category: string;
  brand: string;
  description: string;
  costPrice: number;
  sellingPrice: number;
  currentStock: number;
  minStock: number;
  maxStock: number;
  supplier: string;
  location: string;
  expiryDate?: string;
  status: "active" | "inactive" | "discontinued";
  tags: string[];
  images: string[];
  salesVelocity: number;
  profitMargin: number;
  lastSold: string;
  totalSold: number;
  createdDate: string;
}

const ProductCRM = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [selectedStatus, setSelectedStatus] = useState("all");

  const products: Product[] = [
    {
      id: "1",
      name: "Wireless Bluetooth Headphones",
      sku: "WBH-001",
      barcode: "1234567890123",
      category: "Electronics",
      brand: "TechSound",
      description: "Premium noise-cancelling wireless headphones with 30-hour battery life",
      costPrice: 75.00,
      sellingPrice: 129.99,
      currentStock: 45,
      minStock: 10,
      maxStock: 100,
      supplier: "TechSound Corp",
      location: "A1-B2",
      status: "active",
      tags: ["wireless", "bluetooth", "noise-cancelling", "premium"],
      images: ["/placeholder.svg"],
      salesVelocity: 8.5,
      profitMargin: 42.3,
      lastSold: "2024-01-25",
      totalSold: 156,
      createdDate: "2024-01-01"
    },
    {
      id: "2",
      name: "Smartphone Case Premium",
      sku: "SCP-002",
      barcode: "1234567890124",
      category: "Accessories",
      brand: "ProCase",
      description: "Durable protection case with shock absorption technology",
      costPrice: 8.50,
      sellingPrice: 24.99,
      currentStock: 120,
      minStock: 20,
      maxStock: 200,
      supplier: "ProCase Ltd",
      location: "C3-D1",
      status: "active",
      tags: ["protection", "durable", "shock-resistant"],
      images: ["/placeholder.svg"],
      salesVelocity: 12.3,
      profitMargin: 66.0,
      lastSold: "2024-01-25",
      totalSold: 289,
      createdDate: "2024-01-05"
    },
    {
      id: "3",
      name: "Gaming Mouse RGB",
      sku: "GMR-003",
      barcode: "1234567890125",
      category: "Computer",
      brand: "GamePro",
      description: "High-precision gaming mouse with customizable RGB lighting",
      costPrice: 35.00,
      sellingPrice: 79.99,
      currentStock: 8,
      minStock: 15,
      maxStock: 50,
      supplier: "GamePro Inc",
      location: "B2-A3",
      status: "active",
      tags: ["gaming", "rgb", "precision", "customizable"],
      images: ["/placeholder.svg"],
      salesVelocity: 6.2,
      profitMargin: 56.3,
      lastSold: "2024-01-24",
      totalSold: 78,
      createdDate: "2024-01-10"
    }
  ];

  const categories = ["All", "Electronics", "Accessories", "Computer", "Mobile"];
  const statuses = ["All", "Active", "Inactive", "Discontinued"];

  const getStockStatus = (current: number, min: number) => {
    if (current <= min) return { status: "low", color: "destructive" };
    if (current <= min * 1.5) return { status: "medium", color: "warning" };
    return { status: "good", color: "success" };
  };

  const getVelocityTrend = (velocity: number) => {
    if (velocity >= 10) return { icon: <TrendingUp className="w-4 h-4" />, color: "success" };
    if (velocity >= 5) return { icon: <BarChart3 className="w-4 h-4" />, color: "warning" };
    return { icon: <TrendingDown className="w-4 h-4" />, color: "destructive" };
  };

  const totalProducts = products.length;
  const lowStockCount = products.filter(p => p.currentStock <= p.minStock).length;
  const totalValue = products.reduce((sum, p) => sum + (p.currentStock * p.costPrice), 0);
  const avgProfitMargin = products.reduce((sum, p) => sum + p.profitMargin, 0) / products.length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Product CRM
          </h1>
          <p className="text-muted-foreground">Comprehensive product management and analytics</p>
        </div>
        <div className="flex items-center gap-3">
          <Button variant="outline">
            <Package className="w-4 h-4 mr-2" />
            Import
          </Button>
          <Button className="bg-gradient-primary">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-card border-primary/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Products</p>
                <p className="text-2xl font-bold text-primary">{totalProducts}</p>
              </div>
              <div className="p-3 bg-primary/10 rounded-lg">
                <Package className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-destructive/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Low Stock Items</p>
                <p className="text-2xl font-bold text-destructive">{lowStockCount}</p>
              </div>
              <div className="p-3 bg-destructive/10 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-success/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Inventory Value</p>
                <p className="text-2xl font-bold text-success">${totalValue.toFixed(0)}</p>
              </div>
              <div className="p-3 bg-success/10 rounded-lg">
                <DollarSign className="w-6 h-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-card border-accent/20">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Avg Profit Margin</p>
                <p className="text-2xl font-bold text-accent">{avgProfitMargin.toFixed(1)}%</p>
              </div>
              <div className="p-3 bg-accent/10 rounded-lg">
                <TrendingUp className="w-6 h-6 text-accent" />
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
            Search & Filter Products
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <Input 
                  placeholder="Search by name, SKU, barcode, or brand..." 
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

      {/* Products Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        {products.map((product) => {
          const stockStatus = getStockStatus(product.currentStock, product.minStock);
          const velocityTrend = getVelocityTrend(product.salesVelocity);

          return (
            <Card key={product.id} className="bg-gradient-card border-border hover:border-primary/50 transition-all">
              <CardHeader className="pb-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold text-lg">{product.name}</h3>
                      <Badge variant="outline" className={`border-${stockStatus.color} text-${stockStatus.color}`}>
                        {stockStatus.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">{product.description}</p>
                    <div className="flex items-center gap-4 text-xs text-muted-foreground">
                      <span>SKU: {product.sku}</span>
                      <span>Brand: {product.brand}</span>
                    </div>
                  </div>
                  <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center">
                    <Image className="w-8 h-8 text-muted-foreground" />
                  </div>
                </div>
              </CardHeader>

              <CardContent className="space-y-4">
                {/* Pricing */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Cost Price</p>
                    <p className="font-semibold">${product.costPrice.toFixed(2)}</p>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Selling Price</p>
                    <p className="font-semibold text-success">${product.sellingPrice.toFixed(2)}</p>
                  </div>
                </div>

                {/* Stock Info */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Stock Level</span>
                    <span className="font-semibold">{product.currentStock} units</span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div 
                      className={`h-2 rounded-full bg-${stockStatus.color}`}
                      style={{ width: `${Math.min((product.currentStock / product.maxStock) * 100, 100)}%` }}
                    />
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Min: {product.minStock}</span>
                    <span>Max: {product.maxStock}</span>
                  </div>
                </div>

                {/* Performance Metrics */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-muted-foreground">Sales Velocity</p>
                    <div className="flex items-center gap-1">
                      <span className={`text-${velocityTrend.color}`}>{velocityTrend.icon}</span>
                      <span className="font-semibold">{product.salesVelocity}/week</span>
                    </div>
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground">Profit Margin</p>
                    <p className="font-semibold text-accent">{product.profitMargin.toFixed(1)}%</p>
                  </div>
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-1">
                  {product.tags.slice(0, 3).map((tag) => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                  {product.tags.length > 3 && (
                    <Badge variant="secondary" className="text-xs">
                      +{product.tags.length - 3}
                    </Badge>
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2 pt-2">
                  <Button size="sm" variant="outline" className="flex-1">
                    <Eye className="w-3 h-3 mr-1" />
                    View
                  </Button>
                  <Button size="sm" variant="outline" className="flex-1">
                    <Edit className="w-3 h-3 mr-1" />
                    Edit
                  </Button>
                  <Button size="sm" variant="outline" className="px-3">
                    <BarChart3 className="w-3 h-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default ProductCRM;