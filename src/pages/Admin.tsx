import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Store,
  ArrowLeft,
  Plus,
  Pencil,
  Trash2,
  Package,
  Tags,
  BarChart3,
  Upload,
  X,
  Image as ImageIcon,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { products as initialProducts, categories as initialCategories } from "@/data/mockData";
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stock">("products");
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    price: "",
    image: "",
    categoryId: "",
    stock: "",
    unit: "kg",
  });

  const [categoryForm, setCategoryForm] = useState({
    name: "",
    icon: "📦",
  });

  const resetProductForm = () => {
    setProductForm({
      name: "",
      description: "",
      price: "",
      image: "",
      categoryId: "",
      stock: "",
      unit: "kg",
    });
    setEditingProduct(null);
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", icon: "📦" });
    setEditingCategory(null);
  };

  const handleProductSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingProduct) {
      setProducts(products.map(p => 
        p.id === editingProduct.id 
          ? { ...p, ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) }
          : p
      ));
      toast({ title: "Product Updated!", description: `${productForm.name} has been updated.` });
    } else {
      const newProduct: Product = {
        id: Date.now().toString(),
        name: productForm.name,
        description: productForm.description,
        price: Number(productForm.price),
        image: productForm.image || "https://images.unsplash.com/photo-1542838132-92c53300491e?w=400",
        categoryId: productForm.categoryId,
        stock: Number(productForm.stock),
        unit: productForm.unit,
      };
      setProducts([...products, newProduct]);
      toast({ title: "Product Added!", description: `${productForm.name} has been added to your store.` });
    }
    
    setIsProductDialogOpen(false);
    resetProductForm();
  };

  const handleCategorySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (editingCategory) {
      setCategories(categories.map(c => 
        c.id === editingCategory.id ? { ...c, ...categoryForm } : c
      ));
      toast({ title: "Category Updated!", description: `${categoryForm.name} has been updated.` });
    } else {
      const newCategory: Category = {
        id: Date.now().toString(),
        name: categoryForm.name,
        icon: categoryForm.icon,
      };
      setCategories([...categories, newCategory]);
      toast({ title: "Category Added!", description: `${categoryForm.name} category has been created.` });
    }
    
    setIsCategoryDialogOpen(false);
    resetCategoryForm();
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setProductForm({
      name: product.name,
      description: product.description,
      price: product.price.toString(),
      image: product.image,
      categoryId: product.categoryId,
      stock: product.stock.toString(),
      unit: product.unit,
    });
    setIsProductDialogOpen(true);
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setCategoryForm({
      name: category.name,
      icon: category.icon,
    });
    setIsCategoryDialogOpen(true);
  };

  const handleDeleteProduct = (id: string) => {
    setProducts(products.filter(p => p.id !== id));
    toast({ title: "Product Deleted", description: "The product has been removed." });
  };

  const handleDeleteCategory = (id: string) => {
    setCategories(categories.filter(c => c.id !== id));
    toast({ title: "Category Deleted", description: "The category has been removed." });
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    setProducts(products.map(p => 
      p.id === productId ? { ...p, stock: Math.max(0, newStock) } : p
    ));
  };

  const getCategoryName = (categoryId: string) => 
    categories.find(c => c.id === categoryId)?.name || "Unknown";

  const getStockColor = (stock: number) => {
    if (stock <= 5) return "text-stock-low";
    if (stock <= 20) return "text-stock-medium";
    return "text-stock-high";
  };

  const tabs = [
    { id: "products" as const, label: "Products", icon: Package, count: products.length },
    { id: "categories" as const, label: "Categories", icon: Tags, count: categories.length },
    { id: "stock" as const, label: "Stock Management", icon: BarChart3 },
  ];

  const emojiOptions = ["📦", "🥬", "🍎", "🥛", "🌾", "🌶️", "🍪", "🥩", "🍞", "🧀", "🥚", "🍯"];

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link
                to="/"
                className="flex items-center gap-2 text-muted-foreground hover:text-primary transition-colors"
              >
                <ArrowLeft className="w-5 h-5" />
              </Link>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                  <Store className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-bold text-foreground">Admin Dashboard</h1>
                  <p className="text-xs text-muted-foreground">Manage your store</p>
                </div>
              </div>
            </div>
            <Link to="/">
              <Button variant="outline" size="sm">
                View Store
              </Button>
            </Link>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Tabs */}
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap",
                activeTab === tab.id
                  ? "bg-primary text-primary-foreground shadow-glow"
                  : "bg-card text-muted-foreground hover:bg-muted border border-border"
              )}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  "px-2 py-0.5 rounded-full text-xs",
                  activeTab === tab.id ? "bg-primary-foreground/20" : "bg-muted"
                )}>
                  {tab.count}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Products Tab */}
        {activeTab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Products</h2>
              <Dialog open={isProductDialogOpen} onOpenChange={(open) => {
                setIsProductDialogOpen(open);
                if (!open) resetProductForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>
                      {editingProduct ? "Edit Product" : "Add New Product"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Product Name</Label>
                      <Input
                        id="name"
                        placeholder="Fresh Tomatoes"
                        value={productForm.name}
                        onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="description">Description</Label>
                      <Textarea
                        id="description"
                        placeholder="Describe the product..."
                        value={productForm.description}
                        onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="price">Price (₹)</Label>
                        <Input
                          id="price"
                          type="number"
                          placeholder="40"
                          value={productForm.price}
                          onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="stock">Stock</Label>
                        <Input
                          id="stock"
                          type="number"
                          placeholder="50"
                          value={productForm.stock}
                          onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                          required
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select
                          value={productForm.categoryId}
                          onValueChange={(value) => setProductForm({ ...productForm, categoryId: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            {categories.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.icon} {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="unit">Unit</Label>
                        <Select
                          value={productForm.unit}
                          onValueChange={(value) => setProductForm({ ...productForm, unit: value })}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select unit" />
                          </SelectTrigger>
                          <SelectContent className="bg-card">
                            <SelectItem value="kg">Kilogram (kg)</SelectItem>
                            <SelectItem value="g">Gram (g)</SelectItem>
                            <SelectItem value="ltr">Litre (ltr)</SelectItem>
                            <SelectItem value="ml">Millilitre (ml)</SelectItem>
                            <SelectItem value="pack">Pack</SelectItem>
                            <SelectItem value="dozen">Dozen</SelectItem>
                            <SelectItem value="piece">Piece</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="image">Image URL</Label>
                      <div className="flex gap-2">
                        <Input
                          id="image"
                          placeholder="https://example.com/image.jpg"
                          value={productForm.image}
                          onChange={(e) => setProductForm({ ...productForm, image: e.target.value })}
                        />
                        <Button type="button" variant="outline" size="icon">
                          <Upload className="w-4 h-4" />
                        </Button>
                      </div>
                      {productForm.image && (
                        <div className="relative w-20 h-20 rounded-lg overflow-hidden border border-border">
                          <img
                            src={productForm.image}
                            alt="Preview"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                            }}
                          />
                        </div>
                      )}
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsProductDialogOpen(false);
                          resetProductForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="hero">
                        {editingProduct ? "Update Product" : "Add Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid gap-4">
              {products.map((product) => (
                <div
                  key={product.id}
                  className="bg-card rounded-xl border border-border p-4 flex items-center gap-4 hover:shadow-md transition-shadow"
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="w-16 h-16 rounded-lg object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                    }}
                  />
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-foreground truncate">{product.name}</h3>
                    <p className="text-sm text-muted-foreground truncate">{product.description}</p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-sm font-medium text-primary">₹{product.price}/{product.unit}</span>
                      <span className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</span>
                      <span className={cn("text-sm font-medium", getStockColor(product.stock))}>
                        Stock: {product.stock}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="text-destructive hover:bg-destructive hover:text-destructive-foreground"
                      onClick={() => handleDeleteProduct(product.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Categories Tab */}
        {activeTab === "categories" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-foreground">Categories</h2>
              <Dialog open={isCategoryDialogOpen} onOpenChange={(open) => {
                setIsCategoryDialogOpen(open);
                if (!open) resetCategoryForm();
              }}>
                <DialogTrigger asChild>
                  <Button variant="hero" className="gap-2">
                    <Plus className="w-4 h-4" />
                    Add Category
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>
                      {editingCategory ? "Edit Category" : "Add New Category"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleCategorySubmit} className="space-y-4 mt-4">
                    <div className="space-y-2">
                      <Label htmlFor="categoryName">Category Name</Label>
                      <Input
                        id="categoryName"
                        placeholder="Vegetables"
                        value={categoryForm.name}
                        onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                        required
                      />
                    </div>

                    <div className="space-y-2">
                      <Label>Icon</Label>
                      <div className="flex flex-wrap gap-2">
                        {emojiOptions.map((emoji) => (
                          <button
                            key={emoji}
                            type="button"
                            onClick={() => setCategoryForm({ ...categoryForm, icon: emoji })}
                            className={cn(
                              "w-10 h-10 rounded-lg border-2 text-xl flex items-center justify-center transition-all",
                              categoryForm.icon === emoji
                                ? "border-primary bg-primary/10"
                                : "border-border hover:border-primary/50"
                            )}
                          >
                            {emoji}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          setIsCategoryDialogOpen(false);
                          resetCategoryForm();
                        }}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" variant="hero">
                        {editingCategory ? "Update Category" : "Add Category"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((category) => {
                const productCount = products.filter(p => p.categoryId === category.id).length;
                return (
                  <div
                    key={category.id}
                    className="bg-card rounded-xl border border-border p-6 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-4xl">{category.icon}</span>
                        <div>
                          <h3 className="font-semibold text-foreground">{category.name}</h3>
                          <p className="text-sm text-muted-foreground">{productCount} products</p>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleEditCategory(category)}
                        >
                          <Pencil className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:bg-destructive/10"
                          onClick={() => handleDeleteCategory(category.id)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Stock Management Tab */}
        {activeTab === "stock" && (
          <div>
            <h2 className="text-2xl font-bold text-foreground mb-6">Stock Management</h2>
            
            <div className="grid gap-4">
              {products
                .sort((a, b) => a.stock - b.stock)
                .map((product) => (
                  <div
                    key={product.id}
                    className="bg-card rounded-xl border border-border p-4 flex items-center gap-4"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-12 h-12 rounded-lg object-cover"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=400';
                      }}
                    />
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{product.name}</h3>
                      <p className="text-sm text-muted-foreground">{getCategoryName(product.categoryId)}</p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "px-3 py-1 rounded-full text-sm font-medium",
                        product.stock <= 5 && "bg-stock-low/10 text-stock-low",
                        product.stock > 5 && product.stock <= 20 && "bg-stock-medium/10 text-stock-medium",
                        product.stock > 20 && "bg-stock-high/10 text-stock-high"
                      )}>
                        {product.stock} {product.unit}
                      </div>
                      
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStock(product.id, product.stock - 1)}
                        >
                          -
                        </Button>
                        <Input
                          type="number"
                          value={product.stock}
                          onChange={(e) => handleUpdateStock(product.id, parseInt(e.target.value) || 0)}
                          className="w-20 text-center"
                        />
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateStock(product.id, product.stock + 1)}
                        >
                          +
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Admin;
