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
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
import { Product, Category } from "@/types";
import { cn } from "@/lib/utils";

// --- VALIDATION SCHEMAS ---
const productSchema = Yup.object().shape({
  name: Yup.string().trim().required("Product name is required").min(1, "Name cannot be empty"),
  description: Yup.string().trim().required("Description is required").min(1, "Description cannot be empty"),
  price: Yup.number()
    .typeError("Price must be a valid number")
    .min(1, "Price must be at least 1")
    .required("Price is required"),
  stock: Yup.number()
    .typeError("Stock must be a valid number")
    .min(0, "Stock cannot be negative")
    .required("Stock level is required"),
  categoryId: Yup.string().required("Please select a category"),
  image: Yup.string().optional(),
  unit: Yup.string().required("Unit measurement is required"),
});

const categorySchema = Yup.object().shape({
  name: Yup.string().trim().required("Category name is required").min(1, "Name cannot be empty"),
  icon: Yup.string().required("Category icon is required"),
});

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stock" | "sales">("products");
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
  const [tempStocks, setTempStocks] = useState<{ [key: string]: number }>({});
  const [selectedSalesProduct, setSelectedSalesProduct] = useState<string>("");
  const [salesQuantity, setSalesQuantity] = useState<string>("");
  
  // --- SEARCH STATES ---
  const [productSearch, setProductSearch] = useState("");
  const [categorySearch, setCategorySearch] = useState("");
  const [stockSearch, setStockSearch] = useState("");
  const [salesSearch, setSalesSearch] = useState("");

  // Pagination States
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8; // Set to 8 per your last request

  const [productForm, setProductForm] = useState({
    name: "", description: "", price: "", image: "", categoryId: "", stock: "", unit: "kg",
  });

  const [categoryForm, setCategoryForm] = useState({ name: "", icon: "📦" });

  const getBorderClass = (fieldName: string, value: any) => {
    if (formErrors[fieldName]) return "border-destructive focus-visible:ring-destructive border-2";
    if (fieldName === "price" && value !== "" && Number(value) < 1) return "border-destructive border-2";
    if ((fieldName === "name" || fieldName === "description") && value !== "" && value.trim() === "") return "border-destructive border-2";
    if (value && String(value).trim() !== "") return "border-green-500 focus-visible:ring-green-500 border-2";
    return "";
  };

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
      reader.onloadend = () => {
        setProductForm({ ...productForm, image: reader.result as string });
        setFormErrors(prev => { const n = {...prev}; delete n.image; return n; });
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePriceKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
    if (e.key === '0' && (e.currentTarget.value === "" || e.currentTarget.value === "0")) {
      e.preventDefault();
      return;
    }
    if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
      e.preventDefault();
    }
  };

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    if (!editingProduct) {
      const isDuplicate = products.some(p => p.name.toLowerCase().trim() === productForm.name.toLowerCase().trim());
      if (isDuplicate) { setFormErrors({ name: "This product name already exists." }); return; }
    }
    try {
      await productSchema.validate(productForm, { abortEarly: false });
      const payload = { ...productForm, price: Number(productForm.price), stock: Number(productForm.stock) };
      const method = editingProduct ? 'PUT' : 'POST';
      const url = editingProduct ? `${API}/api/products/${editingProduct.id}` : `${API}/api/products`;
      const response = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const res = await response.json();
      if (editingProduct) { setProducts(products.map(p => (String(p.id) === String(res._id) ? { ...res, id: res._id } : p))); }
      else { setProducts([...products, { ...res, id: res._id }]); }
      setTempStocks(prev => ({ ...prev, [res._id]: res.stock }));
      toast({ title: editingProduct ? "Product Updated Successfully" : "Product Added Successfully" });
      setIsProductDialogOpen(false); resetProductForm();
    } catch (err: any) {
      const errors: any = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFormErrors(errors);
    }
  };

  const handleCategorySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    if (!editingCategory) {
      const isDuplicate = categories.some(c => c.name.toLowerCase().trim() === categoryForm.name.toLowerCase().trim());
      if (isDuplicate) { setFormErrors({ name: "This category name already exists." }); return; }
    }
    try {
      await categorySchema.validate(categoryForm, { abortEarly: false });
      const method = editingCategory ? 'PUT' : 'POST';
      const url = editingCategory ? `${API}/api/categories/${editingCategory.id}` : `${API}/api/categories`;
      fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(categoryForm) })
        .then(r => r.json()).then((res) => {
          if (editingCategory) { setCategories(categories.map(c => (String(c.id) === String(res._id) ? { ...res, id: res._id } : c))); }
          else { setCategories([...categories, { ...res, id: res._id }]); }
          setIsCategoryDialogOpen(false); resetCategoryForm();
          toast({ title: "Category Saved Successfully" });
        });
    } catch (err: any) {
      const errors: any = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFormErrors(errors);
    }
  };

  const handleDeleteRequest = (id: string, type: "product" | "category") => {
    if (type === "category") {
      const hasProducts = products.some(p => String(p.categoryId) === String(id));
      if (hasProducts) {
        toast({ title: "Action Forbidden", description: "Cannot delete category while it contains products.", variant: "destructive" });
        return;
      }
    }
    setDeleteId(id); setDeleteType(type);
  };

  const confirmDelete = () => {
    if (!deleteId || !deleteType) return;
    const endpoint = deleteType === "product" ? "products" : "categories";
    fetch(`${API}/api/${endpoint}/${deleteId}`, { method: "DELETE" })
      .then(() => {
        if (deleteType === "product") setProducts(products.filter(p => String(p.id) !== String(deleteId)));
        else setCategories(categories.filter(c => String(c.id) !== String(deleteId)));
        toast({ title: "Item Deleted Successfully" });
      }).finally(() => { setDeleteId(null); setDeleteType(null); });
  };

  const handleUpdateStock = (productId: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    const existing = products.find(p => String(p.id) === String(productId));
    const delta = finalStock - (existing?.stock || 0);
    if (delta === 0) return;
    fetch(`${API}/api/products/${productId}/stock`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ delta }) })
    .then(r => r.json()).then((updated) => {
      setProducts(products.map(p => (String(p.id) === String(updated._id) ? { ...updated, id: updated._id } : p)));
      setTempStocks(prev => ({ ...prev, [productId]: updated.stock }));
      toast({ title: "Stock Updated" });
    });
  };

  // --- FILTERED DATA FOR SEARCH ---
  const filteredProducts = products.filter(p => p.name.toLowerCase().includes(productSearch.toLowerCase()));
  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(categorySearch.toLowerCase()));

  // Pagination logic
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const tabs = [
    { id: "products" as const, label: "Products", icon: Package, count: products.length },
    { id: "categories" as const, label: "Categories", icon: Tags, count: categories.length },
    { id: "stock" as const, label: "Stock Management", icon: BarChart3 },
    { id: "sales" as const, label: "Daily Sales", icon: Store },
  ];

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-primary"><ArrowLeft /></Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center"><Store className="w-5 h-5 text-primary-foreground" /></div>
              <h1 className="font-bold hidden sm:block">Admin Dashboard</h1>
            </div>
          </div>
          <Link to="/"><Button variant="outline" size="sm">View Store</Button></Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => {setActiveTab(tab.id); setCurrentPage(1);}} className={cn("flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap", activeTab === tab.id ? "bg-primary text-primary-foreground shadow-glow" : "bg-card text-muted-foreground border border-border")}>
              <tab.icon className="w-4 h-4" /> {tab.label} {tab.count !== undefined && <span className="ml-1 opacity-70">({tab.count})</span>}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Products</h2>
              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder="Search products..." 
                      className="pl-9" 
                      value={productSearch} 
                      onChange={(e) => {setProductSearch(e.target.value); setCurrentPage(1);}}
                   />
                </div>
                <Button variant="hero" onClick={() => { resetProductForm(); setIsProductDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Product</Button>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-4 font-semibold text-sm">Image</th>
                      <th className="p-4 font-semibold text-sm">Name</th>
                      <th className="p-4 font-semibold text-sm">Category</th>
                      <th className="p-4 font-semibold text-sm">Price</th>
                      <th className="p-4 font-semibold text-sm">Stock</th>
                      <th className="p-4 font-semibold text-sm text-center">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentProducts.map((product) => (
                      <tr key={product.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                        <td className="p-4"><img src={product.image} className="w-12 h-12 rounded-lg object-cover" /></td>
                        <td className="p-4 font-medium">{product.name}</td>
                        <td className="p-4 text-sm text-muted-foreground">{categories.find(c => c.id === product.categoryId)?.name || 'N/A'}</td>
                        <td className="p-4 font-semibold text-primary">₹{product.price}</td>
                        <td className="p-4 text-sm">{product.stock} {product.unit}</td>
                        <td className="p-4 text-center">
                          <div className="flex justify-center gap-2">
                            <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => { setEditingProduct(product); setProductForm({ name: product.name, description: product.description, price: product.price.toString(), image: product.image, categoryId: product.categoryId, stock: product.stock.toString(), unit: product.unit }); setIsProductDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                            <Button variant="outline" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDeleteRequest(product.id, "product")}><Trash2 className="w-4 h-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {currentProducts.length === 0 && (
                      <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">No products found matching your search.</td></tr>
                    )}
                  </tbody>
                </table>
              </div>
              
              {/* Pagination Controls */}
              {filteredProducts.length > itemsPerPage && (
                <div className="p-4 border-t border-border flex items-center justify-between bg-card">
                  <p className="text-sm text-muted-foreground hidden sm:block">
                    Showing {(currentPage - 1) * itemsPerPage + 1} to {Math.min(currentPage * itemsPerPage, filteredProducts.length)} of {filteredProducts.length} products
                  </p>
                  <div className="flex gap-2 w-full sm:w-auto justify-between sm:justify-end">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                    >
                      <ChevronLeft className="w-4 h-4 mr-1" /> Prev
                    </Button>
                    <div className="flex items-center gap-1">
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                        <Button
                          key={page}
                          variant={currentPage === page ? "hero" : "ghost"}
                          size="sm"
                          className="w-8 h-8 p-0"
                          onClick={() => setCurrentPage(page)}
                        >
                          {page}
                        </Button>
                      ))}
                    </div>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Next <ChevronRight className="w-4 h-4 ml-1" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === "categories" && (
           <div className="space-y-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Categories</h2>
              <div className="flex w-full sm:w-auto gap-2">
                <div className="relative flex-1 sm:w-64">
                   <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                   <Input 
                      placeholder="Search categories..." 
                      className="pl-9" 
                      value={categorySearch} 
                      onChange={(e) => setCategorySearch(e.target.value)}
                   />
                </div>
                <Button variant="hero" onClick={() => { resetCategoryForm(); setIsCategoryDialogOpen(true); }}><Plus className="mr-2 h-4 w-4" /> Add Categoy</Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredCategories.map((cat) => (
                <div key={cat.id} className="bg-card rounded-xl border p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3"><span className="text-3xl">{cat.icon}</span><span className="font-semibold">{cat.name}</span></div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon }); setIsCategoryDialogOpen(true); }}><Pencil className="w-4 h-4" /></Button>
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteRequest(cat.id, "category")}><Trash2 className="w-4 h-4" /></Button>
                  </div>
                </div>
              ))}
              {filteredCategories.length === 0 && (
                <div className="col-span-full p-8 text-center text-muted-foreground bg-card border rounded-xl">No categories found.</div>
              )}
            </div>
          </div>
        )}

        {activeTab === "stock" && (
          <div className="space-y-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <h2 className="text-2xl font-bold">Stock Management</h2>
              <div className="relative w-full sm:w-64">
                 <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                 <Input 
                    placeholder="Search product stock..." 
                    className="pl-9" 
                    value={stockSearch} 
                    onChange={(e) => setStockSearch(e.target.value)}
                 />
              </div>
            </div>
            {categories.map((category) => {
              const categoryProducts = products.filter(p => 
                p.categoryId === category.id && 
                p.name.toLowerCase().includes(stockSearch.toLowerCase())
              );
              if (categoryProducts.length === 0) return null;
              return (
                <div key={category.id} className="space-y-4">
                  <div className="flex items-center gap-2 border-b border-primary/20 pb-2"><span className="text-2xl">{category.icon}</span><h3 className="text-xl font-bold text-primary">{category.name}</h3></div>
                  <div className="grid gap-4">
                    {categoryProducts.map((p) => {
                      const currentTempStock = tempStocks[p.id] ?? p.stock;
                      const hasChanged = currentTempStock !== p.stock;
                      return (
                        <div key={p.id} className="bg-card rounded-xl border p-4 flex flex-wrap items-center gap-4">
                          <img src={p.image} className="w-14 h-14 rounded-lg object-cover" />
                          <div className="flex-1 min-w-[150px]"><h4 className="font-semibold">{p.name}</h4><p className="text-xs">Current: {p.stock} {p.unit}</p></div>
                          <div className="flex items-center gap-4">
                            <div className="flex items-center gap-2 bg-muted rounded-lg p-1.5 px-2 gap-3">
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTempStocks({ ...tempStocks, [p.id]: Math.max(0, currentTempStock - 1) })}> - </Button>
                              <Input type="number" step="any" className="w-16 h-8 text-center bg-transparent border-none font-bold" value={currentTempStock} onChange={(e) => setTempStocks({ ...tempStocks, [p.id]: parseFloat(e.target.value) || 0 })} />
                              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setTempStocks({ ...tempStocks, [p.id]: currentTempStock + 1 })}> + </Button>
                            </div>
                            {hasChanged && <Button variant="ghost" className="text-destructive" onClick={() => setTempStocks({ ...tempStocks, [p.id]: p.stock })}><RotateCcw className="w-4 h-4 mr-1" /> Cancel</Button>}
                            <Button size="sm" variant={hasChanged ? "hero" : "outline"} disabled={!hasChanged} onClick={() => handleUpdateStock(p.id, currentTempStock)} className="gap-2"><Save className="w-4 h-4" /> Save</Button>
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

        {activeTab === "sales" && (
           <div className="space-y-6 max-w-2xl mx-auto">
           <h2 className="text-2xl font-bold">Daily Sales</h2>
           <div className="bg-card p-6 rounded-xl border space-y-4">
             <div className="space-y-2">
               <Label>Select Product</Label>
               <div className="relative">
                 <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                 <Select value={selectedSalesProduct} onValueChange={setSelectedSalesProduct}>
                   <SelectTrigger className="pl-10">
                     <SelectValue placeholder="Search or Select Product" />
                   </SelectTrigger>
                   <SelectContent className="bg-card">
                     <div className="p-2 border-b border-border sticky top-0 bg-card z-10">
                        <Input 
                          placeholder="Type to filter..." 
                          className="h-8" 
                          value={salesSearch} 
                          onChange={(e) => setSalesSearch(e.target.value)} 
                          onKeyDown={(e) => e.stopPropagation()} 
                        />
                     </div>
                     {products
                       .filter(p => p.name.toLowerCase().includes(salesSearch.toLowerCase()))
                       .map(p => <SelectItem key={p.id} value={p.id}>{p.name} (Stock: {p.stock} {p.unit})</SelectItem>)
                     }
                   </SelectContent>
                 </Select>
               </div>
             </div>
             {selectedSalesProduct && (
               <div className="grid grid-cols-2 gap-4">
                 <div className="space-y-2"><Label>Quantity</Label><Input type="number" step="any" value={salesQuantity} onChange={(e) => setSalesQuantity(e.target.value)} /></div>
                 <div className="space-y-2"><Label>Unit</Label><Input readOnly value={products.find(p => p.id === selectedSalesProduct)?.unit || ""} className="bg-muted" /></div>
               </div>
             )}
             <div className="flex gap-3 pt-4">
               <Button className="flex-1" variant="hero" onClick={() => {
                  const product = products.find(p => p.id === selectedSalesProduct);
                  if (product && salesQuantity) handleUpdateStock(product.id, product.stock - Number(salesQuantity));
                  setSelectedSalesProduct(""); setSalesQuantity(""); setSalesSearch("");
               }} disabled={!selectedSalesProduct || !salesQuantity}><Save className="w-4 h-4 mr-2" /> Save Sale</Button>
               <Button variant="outline" onClick={() => { setSelectedSalesProduct(""); setSalesQuantity(""); setSalesSearch(""); }}>Cancel</Button>
             </div>
           </div>
         </div>
        )}
      </div>

      <Dialog open={isProductDialogOpen} onOpenChange={setIsProductDialogOpen}>
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader><DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle></DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input className={getBorderClass("name", productForm.name)} value={productForm.name} onChange={e => { setProductForm({...productForm, name: e.target.value}); setFormErrors(prev => {const n = {...prev}; delete n.name; return n;}); }} />
              {formErrors.name && <p className="text-[10px] text-destructive font-medium">{formErrors.name}</p>}
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea className={getBorderClass("description", productForm.description)} value={productForm.description} onChange={e => { setProductForm({...productForm, description: e.target.value}); setFormErrors(prev => {const n = {...prev}; delete n.description; return n;}); }} />
              {formErrors.description && <p className="text-[10px] text-destructive">{formErrors.description}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price (₹)</Label>
                <Input type="number" onKeyDown={handlePriceKeyPress} className={getBorderClass("price", productForm.price)} value={productForm.price} onChange={e => { setProductForm({...productForm, price: e.target.value}); setFormErrors(prev => {const n = {...prev}; delete n.price; return n;}); }} />
                {formErrors.price && <p className="text-[10px] text-destructive">{formErrors.price}</p>}
              </div>
              <div className="space-y-1">
                <Label>Stock</Label>
                <Input type="number" step="any" onKeyDown={(e) => {if(e.key==='-') e.preventDefault()}} className={getBorderClass("stock", productForm.stock)} value={productForm.stock} onChange={e => { setProductForm({...productForm, stock: e.target.value}); setFormErrors(prev => {const n = {...prev}; delete n.stock; return n;}); }} />
                {formErrors.stock && <p className="text-[10px] text-destructive">{formErrors.stock}</p>}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select value={productForm.categoryId} onValueChange={v => { setProductForm({...productForm, categoryId: v}); setFormErrors(prev => {const n = {...prev}; delete n.categoryId; return n;}); }}>
                  <SelectTrigger className={getBorderClass("categoryId", productForm.categoryId)}><SelectValue placeholder="Select Category" /></SelectTrigger>
                  <SelectContent className="bg-card">{categories.map(c => <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>)}</SelectContent>
                </Select>
                {formErrors.categoryId && <p className="text-[10px] text-destructive">{formErrors.categoryId}</p>}
              </div>
              <div className="space-y-1">
                <Label>Unit</Label>
                <Select value={productForm.unit} onValueChange={v => setProductForm({...productForm, unit: v})}>
                  <SelectTrigger className="border-green-500 border-2"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-card">
                    {["kg", "g", "ltr", "ml", "piece", "packet", "box", "dozen", "bundle"].map(u => <SelectItem key={u} value={u}>{u}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>Image</Label>
              <div className="flex gap-2 items-center">
                <Input id="img-up" type="file" className="hidden" onChange={handleImageUpload} />
                <Button type="button" variant="outline" className={cn("w-full border-dashed", productForm.image ? "border-green-500 border-2" : (formErrors.image && "border-destructive border-2"))} onClick={() => document.getElementById('img-up')?.click()}><Upload className="mr-2 h-4 w-4" /> Upload Image</Button>
                {productForm.image && <div className="relative w-12 h-12 shrink-0"><img src={productForm.image} className="w-full h-full object-cover rounded" /><Button onClick={() => setProductForm({...productForm, image: ""})} type="button" variant="destructive" className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"><X className="h-3 w-3" /></Button></div>}
              </div>
              {formErrors.image && <p className="text-[10px] text-destructive">{formErrors.image}</p>}
            </div>
            <Button type="submit" className="w-full" variant="hero">{editingProduct ? "Update Product" : "Save Product"}</Button>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={isCategoryDialogOpen} onOpenChange={setIsCategoryDialogOpen}>
        <DialogContent className="bg-card">
          <DialogHeader><DialogTitle>{editingCategory ? "Edit Category" : "Add New Category"}</DialogTitle></DialogHeader>
          <form onSubmit={handleCategorySubmit} className="space-y-4 pt-2">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input className={getBorderClass("name", categoryForm.name)} value={categoryForm.name} onChange={e => { setCategoryForm({...categoryForm, name: e.target.value}); setFormErrors(prev => {const n = {...prev}; delete n.name; return n;}); }} />
              {formErrors.name && <p className="text-xs text-destructive font-medium">{formErrors.name}</p>}
            </div>
            <div className="space-y-2">
              <Label>Icon</Label>
              <div className="flex flex-wrap gap-2">
                {["📦", "🥬", "🍎", "🥛", "🌾", "🌶️", "🍪", "🥩", "🍞"].map(emoji => (
                  <button key={emoji} type="button" onClick={() => setCategoryForm({...categoryForm, icon: emoji})} className={cn("w-10 h-10 rounded border transition-all", categoryForm.icon === emoji ? "border-primary bg-primary/10 scale-110 shadow-sm" : "border-border hover:bg-muted")}>{emoji}</button>
                ))}
              </div>
            </div>
            <Button type="submit" className="w-full" variant="hero">Save Category</Button>
          </form>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog open={!!deleteId} onClose={() => { setDeleteId(null); setDeleteType(null); }} onConfirm={confirmDelete} title={`Delete ${deleteType === "product" ? "Product" : "Category"}?`} description="This action is permanent and cannot be undone." />
    </div>
  );
};

export default Admin;