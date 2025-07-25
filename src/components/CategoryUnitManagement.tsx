import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { 
  Tag, 
  Plus, 
  Ruler, 
  Package, 
  Edit,
  Trash2,
  MoreHorizontal,
  Search,
  Grid
} from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

interface Category {
  id: string;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
}

interface Unit {
  id: string;
  name: string;
  symbol: string;
  type: 'kg' | 'pcs' | 'liters' | 'meters' | 'grams' | 'boxes' | 'bottles' | 'packets';
  created_at: string;
}

const CategoryUnitManagement = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [isUnitDialogOpen, setIsUnitDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingUnit, setEditingUnit] = useState<Unit | null>(null);

  // Category form states
  const [categoryName, setCategoryName] = useState("");
  const [categoryDescription, setCategoryDescription] = useState("");

  // Unit form states
  const [unitName, setUnitName] = useState("");
  const [unitSymbol, setUnitSymbol] = useState("");
  const [unitType, setUnitType] = useState<'kg' | 'pcs' | 'liters' | 'meters' | 'grams' | 'boxes' | 'bottles' | 'packets' | ''>('');

  const { toast } = useToast();

  const unitTypes = [
    { value: 'kg', label: 'Weight (kg)', icon: '⚖️' },
    { value: 'grams', label: 'Weight (g)', icon: '⚖️' },
    { value: 'pcs', label: 'Pieces', icon: '🔢' },
    { value: 'liters', label: 'Volume (L)', icon: '🪣' },
    { value: 'meters', label: 'Length (m)', icon: '📏' },
    { value: 'boxes', label: 'Boxes', icon: '📦' },
    { value: 'bottles', label: 'Bottles', icon: '🍾' },
    { value: 'packets', label: 'Packets', icon: '📋' }
  ];

  useEffect(() => {
    fetchCategories();
    fetchUnits();
  }, []);

  const fetchCategories = async () => {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name');

    if (error) {
      toast({ title: "Error", description: "Failed to fetch categories", variant: "destructive" });
    } else {
      setCategories(data || []);
    }
  };

  const fetchUnits = async () => {
    const { data, error } = await supabase
      .from('units')
      .select('*')
      .order('name');

    if (error) {
      toast({ title: "Error", description: "Failed to fetch units", variant: "destructive" });
    } else {
      setUnits(data || []);
    }
  };

  const handleCreateOrUpdateCategory = async () => {
    if (!categoryName.trim()) {
      toast({ title: "Error", description: "Please enter a category name", variant: "destructive" });
      return;
    }

    const categoryData = {
      name: categoryName.trim(),
      description: categoryDescription.trim()
    };

    let error;
    if (editingCategory) {
      const { error: updateError } = await supabase
        .from('categories')
        .update(categoryData)
        .eq('id', editingCategory.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoryData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save category", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Category ${editingCategory ? 'updated' : 'created'} successfully` });
      setIsCategoryDialogOpen(false);
      resetCategoryForm();
      fetchCategories();
    }
  };

  const handleCreateOrUpdateUnit = async () => {
    if (!unitName.trim() || !unitSymbol.trim() || !unitType) {
      toast({ title: "Error", description: "Please fill all unit fields", variant: "destructive" });
      return;
    }

    const unitData = {
      name: unitName.trim(),
      symbol: unitSymbol.trim(),
      type: unitType as any
    };

    let error;
    if (editingUnit) {
      const { error: updateError } = await supabase
        .from('units')
        .update(unitData)
        .eq('id', editingUnit.id);
      error = updateError;
    } else {
      const { error: insertError } = await supabase
        .from('units')
        .insert(unitData);
      error = insertError;
    }

    if (error) {
      toast({ title: "Error", description: "Failed to save unit", variant: "destructive" });
    } else {
      toast({ title: "Success", description: `Unit ${editingUnit ? 'updated' : 'created'} successfully` });
      setIsUnitDialogOpen(false);
      resetUnitForm();
      fetchUnits();
    }
  };

  const handleDeleteCategory = async (categoryId: string) => {
    const { error } = await supabase
      .from('categories')
      .delete()
      .eq('id', categoryId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete category", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Category deleted successfully" });
      fetchCategories();
    }
  };

  const handleDeleteUnit = async (unitId: string) => {
    const { error } = await supabase
      .from('units')
      .delete()
      .eq('id', unitId);

    if (error) {
      toast({ title: "Error", description: "Failed to delete unit", variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Unit deleted successfully" });
      fetchUnits();
    }
  };

  const resetCategoryForm = () => {
    setCategoryName("");
    setCategoryDescription("");
    setEditingCategory(null);
  };

  const resetUnitForm = () => {
    setUnitName("");
    setUnitSymbol("");
    setUnitType('');
    setEditingUnit(null);
  };

  const openCategoryEditDialog = (category: Category) => {
    setEditingCategory(category);
    setCategoryName(category.name);
    setCategoryDescription(category.description || "");
    setIsCategoryDialogOpen(true);
  };

  const openUnitEditDialog = (unit: Unit) => {
    setEditingUnit(unit);
    setUnitName(unit.name);
    setUnitSymbol(unit.symbol);
    setUnitType(unit.type);
    setIsUnitDialogOpen(true);
  };

  const openCategoryCreateDialog = () => {
    resetCategoryForm();
    setIsCategoryDialogOpen(true);
  };

  const openUnitCreateDialog = () => {
    resetUnitForm();
    setIsUnitDialogOpen(true);
  };

  const filteredCategories = categories.filter(cat =>
    cat.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    cat.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredUnits = units.filter(unit =>
    unit.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    unit.symbol.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getUnitTypeInfo = (type: string) => {
    return unitTypes.find(t => t.value === type) || { value: type, label: type, icon: '📏' };
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Category & Unit Management
          </h1>
          <p className="text-muted-foreground">Organize products by categories and measurement units</p>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Product Categories</CardTitle>
            <Tag className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
            <p className="text-xs text-muted-foreground">
              Active categories
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Measurement Units</CardTitle>
            <Ruler className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{units.length}</div>
            <p className="text-xs text-muted-foreground">
              Available units
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
        <Input
          placeholder="Search categories and units..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-10"
        />
      </div>

      <Tabs defaultValue="categories" className="space-y-4">
        <TabsList>
          <TabsTrigger value="categories">Categories</TabsTrigger>
          <TabsTrigger value="units">Units</TabsTrigger>
        </TabsList>

        <TabsContent value="categories" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Product Categories</h3>
            <Button onClick={openCategoryCreateDialog} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Add Category
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCategories.map(category => (
              <Card key={category.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Grid className="h-5 w-5 text-primary" />
                      <CardTitle className="text-base">{category.name}</CardTitle>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => openCategoryEditDialog(category)}>
                          <Edit className="mr-2 h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => handleDeleteCategory(category.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground mb-3">
                    {category.description || "No description provided"}
                  </p>
                  <div className="text-xs text-muted-foreground">
                    Created {new Date(category.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredCategories.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No categories found matching your search
            </div>
          )}
        </TabsContent>

        <TabsContent value="units" className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Measurement Units</h3>
            <Button onClick={openUnitCreateDialog} className="bg-gradient-to-r from-primary to-secondary hover:opacity-90">
              <Plus className="mr-2 h-4 w-4" />
              Add Unit
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {filteredUnits.map(unit => {
              const typeInfo = getUnitTypeInfo(unit.type);
              return (
                <Card key={unit.id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg">{typeInfo.icon}</span>
                        <CardTitle className="text-base">{unit.name}</CardTitle>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openUnitEditDialog(unit)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem 
                            onClick={() => handleDeleteUnit(unit.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Symbol:</span>
                        <Badge variant="secondary">{unit.symbol}</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-muted-foreground">Type:</span>
                        <span className="text-sm">{typeInfo.label}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredUnits.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              No units found matching your search
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Category Dialog */}
      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Add New Category'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Category Name *</Label>
              <Input
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder="Enter category name"
              />
            </div>
            
            <div>
              <Label>Description</Label>
              <Textarea
                value={categoryDescription}
                onChange={(e) => setCategoryDescription(e.target.value)}
                placeholder="Enter category description (optional)"
              />
            </div>
            
            <Button onClick={handleCreateOrUpdateCategory} className="w-full">
              {editingCategory ? 'Update Category' : 'Add Category'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Unit Dialog */}
      <Dialog open={isUnitDialogOpen} onOpenChange={setIsUnitDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingUnit ? 'Edit Unit' : 'Add New Unit'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Unit Name *</Label>
              <Input
                value={unitName}
                onChange={(e) => setUnitName(e.target.value)}
                placeholder="Enter unit name"
              />
            </div>
            
            <div>
              <Label>Symbol *</Label>
              <Input
                value={unitSymbol}
                onChange={(e) => setUnitSymbol(e.target.value)}
                placeholder="Enter unit symbol"
              />
            </div>
            
            <div>
              <Label>Unit Type *</Label>
              <Select value={unitType} onValueChange={(value: any) => setUnitType(value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select unit type" />
                </SelectTrigger>
                <SelectContent>
                  {unitTypes.map(type => (
                    <SelectItem key={type.value} value={type.value}>
                      <div className="flex items-center gap-2">
                        <span>{type.icon}</span>
                        {type.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <Button onClick={handleCreateOrUpdateUnit} className="w-full">
              {editingUnit ? 'Update Unit' : 'Add Unit'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CategoryUnitManagement;