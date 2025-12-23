import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import * as Yup from "yup";
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
  Save,
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils";

// Validation Schemas
const productSchema = Yup.object().shape({
  name: Yup.string().required("Product name is required"),
  description: Yup.string().required("Description is required"),
  price: Yup.number().typeError("Price must be a number").positive().required(),
  stock: Yup.number().typeError("Stock must be a number").min(0).required(),
  categoryId: Yup.string().required("Please select a category"),
  image: Yup.string().required("Product image is required"),
  unit: Yup.string().required("Unit is required"),
});

const categorySchema = Yup.object().shape({
  name: Yup.string().required("Category name is required"),
  icon: Yup.string().required("Icon is required"),
});

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stock">("products");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [isCategoryDialogOpen, setIsCategoryDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const { toast } = useToast();

  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"product" | "category" | null>(null);

  // Local state for stock editing to prevent multiple API calls
  const [tempStocks, setTempStocks] = useState<{ [key: string]: number }>({});

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
    setProductForm({ name: "", description: "", price: "", image: "", categoryId: "", stock: "", unit: "kg" });
    setEditingProduct(null);
    setFormErrors({});
  };

  const resetCategoryForm = () => {
    setCategoryForm({ name: "", icon: "📦" });
    setEditingCategory(null);
    setFormErrors({});
  };

  useEffect(() => {
    fetch(`${API}/api/products`).then(r => r.json()).then((data) => {
        const mapped = data.map((p: any) => ({ ...p, id: p._id }));
        setProducts(mapped);
        // Initialize temp stocks
        const initialStocks: any = {};
        mapped.forEach((p: any) => initialStocks[p.id] = p.stock);
        setTempStocks(initialStocks);
    }).catch(() => {});
    fetch(`${API}/api/categories`).then(r => r.json()).then((data) => setCategories(data.map((c: any) => ({ ...c, id: c._id })))).catch(() => {});
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setProductForm({ ...productForm, image: reader.result as string });
      reader.readAsDataURL(file);
    }
  };

  const blockInvalidChar = (e: React.KeyboardEvent) => {
    if (e.key === '-' || e.key === 'e' || e.key === 'E') e.preventDefault();
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log("THE E is -->> ",e);
    setFormErrors({});
    try {
      await productSchema.validate(productForm, { abortEarly: false });
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `${API}/api/products/${editingProduct.id}` : `${API}/api/products`;

      fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
        .then(r => r.json()).then((res) => {
          if (editingProduct) {
            setProducts(products.map(p => (String(p.id) === String(res._id) ? { ...res, id: res._id } : p)));
          } else {
            setProducts([...products, { ...res, id: res._id }]);
          }
          setTempStocks(prev => ({ ...prev, [res._id]: res.stock }));
          toast({ title: editingProduct ? "Product Updated" : "Product Added" });
          setIsProductDialogOpen(false);
          resetProductForm();
        });
    } catch (err: any) {
      const errors: any = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFormErrors(errors);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await categorySchema.validate(categoryForm, { abortEarly: false });
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${API}/api/categories/${editingCategory.id}` : `${API}/api/categories`;
      fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) })
        .then(r => r.json()).then((res) => {
          if (editingCategory) {
            setCategories(categories.map(c => (String(c.id) === String(res._id) ? { ...res, id: res._id } : c)));
          } else {
            setCategories([...categories, { ...res, id: res._id }]);
          }
          setIsCategoryDialogOpen(false);
          resetCategoryForm();
          toast({ title: "Category Saved" });
        });
    } catch (err: any) { /* set errors */ }
  };

  const confirmDelete = () => {
    if (!deleteId || !deleteType) return;
    const endpoint = deleteType === "product" ? "products" : "categories";
    fetch(`${API}/api/${endpoint}/${deleteId}`, { method: "DELETE" })
      .then(() => {
        if (deleteType === "product") setProducts(products.filter(p => String(p.id) !== String(deleteId)));
        else setCategories(categories.filter(c => String(c.id) !== String(deleteId)));
        toast({ title: "Deleted Successfully" });
      }).finally(() => { setDeleteId(null); setDeleteType(null); });
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    fetch(`${API}/api/products/${productId}`, { 
        method: 'PUT', 
        headers: { 'Content-Type': 'application/json' }, 
        body: JSON.stringify({ stock: finalStock }) 
    })
    .then(r => r.json()).then((updated) => {
      setProducts(products.map(p => (String(p.id) === String(updated._id) ? { ...updated, id: updated._id } : p)));
      toast({ title: "Stock Updated Successfully" });
    });
  };

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

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowLeft /></Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold hidden sm:block">Admin Dashboard</h1>
            </div>
          </div>
          <Link to="/"><Button variant="outline" size="sm">View Store</Button></Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground border border-border")}>
              <tab.icon className="w-4 h-4" />
              {tab.label}
              {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {/* PRODUCTS TAB */}
        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Products</h2>
              <Button variant="hero" onClick={() => { resetProductForm(); setIsProductDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
            </div>
            <div className="grid gap-4">
              {products.map((product) => (
                <div key={product.id} className="bg-card rounded-xl border p-4 flex items-center gap-4">
                  <img src={product.image} className="w-16 h-16 rounded-lg object-cover" />
                  <div className="flex-1">
                    <h3 className="font-semibold">{product.name}</h3>
                    <p className="text-sm text-primary">₹{product.price} / {product.unit}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="icon" onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, description: product.description, price: product.price.toString(), image: product.image, categoryId: product.categoryId, stock: product.stock.toString(), unit: product.unit }); setIsProductDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="outline" size="icon" className="text-destructive" onClick={() => { setDeleteId(product.id); setDeleteType("product"); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {activeTab === "categories" && (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-bold">Categories</h2>
              <Button variant="hero" onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Category</Button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map((cat) => (
                <div key={cat.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3"><span className="text-3xl">{cat.icon}</span><span className="font-semibold">{cat.name}</span></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon }); setIsCategoryDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => { setDeleteId(cat.id); setDeleteType("category"); }}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* STOCK MANAGEMENT TAB (UPDATED) */}
        {activeTab === "stock" && (
          <div className="space-y-8">
            <h2 className="text-2xl font-bold text-foreground">Stock Management</h2>
            {categories.map((category) => {
              const categoryProducts = products.filter(p => p.categoryId === category.id);
              if (categoryProducts.length === 0) return null;
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-primary/20 pb-2">
                    <span className="text-2xl">{category.icon}</span>
                    <h3 className="text-xl font-bold text-primary">{category.name}</h3>
                  </div>
                  <div className="grid gap-4">
                    {categoryProducts.map((p) => {
                      const currentTempStock = tempStocks[p.id] ?? p.stock;
                      const hasChanged = currentTempStock !== p.stock;

                      return (
                        <div key={p.id} className="bg-card rounded-xl border border-border p-4 flex flex-wrap items-center gap-4 hover:shadow-md transition-all">
                          <img src={p.image} className="w-14 h-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-[150px]">
                            <h4 className="font-semibold text-foreground">{p.name}</h4>
                            <p className={cn("text-xs font-medium", getStockColor(p.stock))}>
                              Current: {p.stock} {p.unit}
                            </p>
                          </div>
                          
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-1">
                              <Button 
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setTempStocks({ ...tempStocks, [p.id]: Math.max(0, currentTempStock - 1) })}
                              > - </Button>
                              <Input 
                                type="number" onKeyDown={blockInvalidChar}
                                className="w-16 h-8 text-center bg-transparent border-none focus-visible:ring-0"
                                value={currentTempStock}
                                onChange={(e) => setTempStocks({ ...tempStocks, [p.id]: parseInt(e.target.value) || 0 })}
                              />
                              <Button 
                                variant="ghost" size="icon" className="h-8 w-8"
                                onClick={() => setTempStocks({ ...tempStocks, [p.id]: currentTempStock + 1 })}
                              > + </Button>
                            </div>

                            <Button 
                              size="sm" 
                              variant={hasChanged ? "hero" : "outline"}
                              disabled={!hasChanged}
                              onClick={() => handleUpdateStock(p.id, currentTempStock)}
                              className="gap-2 h-9"
                            >
                              <Save className="w-4 h-4" /> Save
                            </Button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* DIALOGS FOR PRODUCT & CATEGORY */}
      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
            <div className="space-y-1"><Label>Description</Label><Textarea value={productForm.description} onChange={e => setProductForm({...productForm, description: e.target.value})} /></div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1"><Label>Price</Label><Input type="number" onKeyDown={blockInvalidChar} value={productForm.price} onChange={e => setProductForm({...productForm, price: e.target.value})} /></div>
                <div className="space-y-1"><Label>Stock</Label><Input type="number" onKeyDown={blockInvalidChar} value={productForm.stock} onChange={e => setProductForm({...productForm, stock: e.target.value})} /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <Label>Category</Label>
                    <Select value={productForm.categoryId} onValueChange={v => setProductForm({...productForm, categoryId: v})}>
                        <SelectTrigger><SelectValue placeholder="Select" /></SelectTrigger>
                        <SelectContent className="bg-card">{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
                    </Select>
                </div>
                <div className="space-y-1">
                    <Label>Unit</Label>
                    <Select value={productForm.unit} onValueChange={v => setProductForm({...productForm, unit: v})}>
                        <SelectTrigger><SelectValue /></SelectTrigger>
                        <SelectContent className="bg-card"><SelectItem value="kg">kg</SelectItem><SelectItem value="g">g</SelectItem><SelectItem value="ltr">ltr</SelectItem><SelectItem value="piece">piece</SelectItem></SelectContent>
                    </Select>
                </div>
            </div>
            <div className="space-y-2">
                <Label>Image</Label>
                <div className="flex gap-2 items-center">
                    <Input id="img-up" type="file" className="hidden" onChange={handleImageUpload} />
                    <Button type="button" variant="outline" className="w-full border-dashed" onClick={() => document.getElementById('img-up')?.click()}><Upload className="mr-2 h-4 w-4" /> Upload</Button>
                    {productForm.image && <div className="relative w-12 h-12"><img src={productForm.image} className="w-full h-full object-cover rounded" /><Button onClick={() => setProductForm({...productForm, image: ""})} type="button" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"><X className="h-3 w-3" /></Button></div>}
                </div>
            </div>
            <Button type="submit" className="w-full" variant="hero">Save Product</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>Category</DialogTitle></DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4">
            <div className="space-y-1"><Label>Name</Label><Input value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} /></div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {["📦", "🥬", "🍎", "🥛", "🌾", "🌶️", "🍪", "🥩", "🍞"].map(emoji => (
                  <button key={emoji} type="button" onClick={() => setCategoryForm({...categoryForm, icon: emoji})} className={cn("w-10 h-10 rounded border", categoryForm.icon === emoji ? "border-primary bg-primary/10" : "border-border")}>{emoji}</button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" variant="hero">Save Category</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteId}
        onClose={() => { setDeleteId(null); setDeleteType(null); }}
        onConfirm={confirmDelete}
        title={`Delete ${deleteType === "product" ? "Product" : "Category"}?`}
        description="Are you sure? This action is permanent."
      />
    </div>
  );
};

export default Admin;