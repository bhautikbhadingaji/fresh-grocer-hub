import { useState } from "react";
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
import { Plus, Pencil, Trash2, Search, ChevronLeft, ChevronRight, Upload, X } from "lucide-react";
import { Product, Category } from "@/types";
import { ProductFormData } from "@/types/admin";
import { productSchema, getBorderClass, handleKeyRestriction } from "@/utils/validation";
import { cn } from "@/lib/utils";

const DEFAULT_IMAGE = "https://s3.stroi-news.ru/img/bakaleya-kartinki-52.png";

interface ProductsTabProps {
  products: Product[];
  categories: Category[];
  onCreateProduct: (payload: any) => Promise<any>;
  onUpdateProduct: (id: string, payload: any) => Promise<any>;
  onDeleteProduct: (id: string) => void;
}

export const ProductsTab = ({ 
  products, 
  categories, 
  onCreateProduct, 
  onUpdateProduct, 
  onDeleteProduct 
}: ProductsTabProps) => {
  const [isProductDialogOpen, setIsProductDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [formErrors, setFormErrors] = useState<{ [key: string]: string }>({});
  const itemsPerPage = 6;

  const [productForm, setProductForm] = useState<ProductFormData>({
    name: "", description: "", price: "", image: "", categoryId: "", stock: "", unit: "kg", expiryDate: "", batchNo: "",
  });

  const resetProductForm = () => {
    setProductForm({ name: "", description: "", price: "", image: "", categoryId: "", stock: "", unit: "kg", expiryDate: "", batchNo: "" });
    setEditingProduct(null);
    setFormErrors({});
  };

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

  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormErrors({});
    
    const isDuplicate = products.some(p => 
        p.name.toLowerCase().trim() === productForm.name.toLowerCase().trim() && 
        Number(p.price) === Number(productForm.price) &&
        p.id !== editingProduct?.id 
    );

    if (isDuplicate) { 
      setFormErrors({ 
        name: "A product with this same name and price already exists.",
        price: "Already exists." 
      }); 
      return; 
    }

    try {
      await productSchema.validate(productForm, { abortEarly: false });
      const payload: any = { 
        ...productForm, 
        price: Number(productForm.price), 
        stock: Number(productForm.stock),
        image: productForm.image || DEFAULT_IMAGE
      };

      if (editingProduct) {
        await onUpdateProduct(editingProduct.id, payload);
      } else {
        await onCreateProduct(payload);
      }

      setIsProductDialogOpen(false);
      resetProductForm();
    } catch (err: any) {
      const errors: any = {};
      err.inner?.forEach((e: any) => { if (e.path) errors[e.path] = e.message; });
      setFormErrors(errors);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(productSearch.toLowerCase())
  );

  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage);
  const currentProducts = filteredProducts.slice(
    (currentPage - 1) * itemsPerPage, 
    currentPage * itemsPerPage
  );

  return (
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
          <Button 
            variant="hero" 
            onClick={() => { resetProductForm(); setIsProductDialogOpen(true); }}
          >
            <Plus className="mr-2 h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-4 font-semibold text-sm">Image</th>
                <th className="p-4 font-semibold text-sm">Name</th>
                <th className="p-4 font-semibold text-sm">Batch & Expiry</th>
                <th className="p-4 font-semibold text-sm">Category</th>
                <th className="p-4 font-semibold text-sm">Price</th>
                <th className="p-4 font-semibold text-sm">Stock</th>
                <th className="p-4 font-semibold text-sm text-center">Actions</th>
              </tr>
            </thead>
            <tbody>
              {currentProducts.map((product) => (
                <tr key={product.id} className="border-b border-border hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <img src={product.image || DEFAULT_IMAGE} className="w-12 h-12 rounded-lg object-cover" />
                  </td>
                  <td className="p-4 font-medium">{product.name}</td>
                  <td className="p-4 text-xs">
                    <div className="flex flex-col">
                      <span className="font-semibold text-muted-foreground">Batch: {product.batchNo || "N/A"}</span>
                      <span className={`font-medium ${
                        product.expiryDate && new Date(product.expiryDate) < new Date() 
                          ? "text-destructive" 
                          : "text-green-600"
                      }`}>
                        Exp: {product.expiryDate ? new Date(product.expiryDate).toLocaleDateString() : "N/A"}
                      </span>
                    </div>
                  </td>
                  <td className="p-4 text-sm text-muted-foreground">
                    {categories.find(c => c.id === product.categoryId)?.name || 'N/A'}
                  </td>
                  <td className="p-4 font-semibold text-primary">₹{product.price}</td>
                  <td className="p-4 text-sm">{product.stock} {product.unit}</td>
                  <td className="p-4 text-center">
                    <div className="flex justify-center gap-2">
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8" 
                        onClick={() => {
                          setEditingProduct(product);
                          setProductForm({
                            name: product.name,
                            description: product.description,
                            price: product.price.toString(),
                            image: product.image,
                            categoryId: product.categoryId,
                            stock: product.stock.toString(),
                            unit: product.unit,
                            expiryDate: product.expiryDate ? new Date(product.expiryDate).toISOString().split('T')[0] : "",
                            batchNo: product.batchNo || ""
                          });
                          setIsProductDialogOpen(true);
                        }}
                      >
                        <Pencil className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="icon" 
                        className="h-8 w-8 text-destructive" 
                        onClick={() => onDeleteProduct(product.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
              {currentProducts.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No products found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        
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

      <Dialog 
        open={isProductDialogOpen} 
        onOpenChange={(open) => { 
          setIsProductDialogOpen(open); 
          if(!open) resetProductForm(); 
        }}
      >
        <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto bg-card">
          <DialogHeader>
            <DialogTitle>{editingProduct ? "Edit Product" : "Add New Product"}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleProductSubmit} className="space-y-4 pt-4">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input 
                className={getBorderClass("name", productForm.name, formErrors)} 
                value={productForm.name} 
                onChange={e => { 
                  setProductForm({...productForm, name: e.target.value}); 
                  setFormErrors(prev => {const n = {...prev}; delete n.name; return n;}); 
                }} 
              />
              {formErrors.name && <p className="text-[10px] text-destructive font-medium">{formErrors.name}</p>}
            </div>

            <div className="space-y-1">
              <Label>Description</Label>
              <Textarea 
                className={getBorderClass("description", productForm.description, formErrors)} 
                value={productForm.description} 
                onChange={e => { 
                  setProductForm({...productForm, description: e.target.value}); 
                  setFormErrors(prev => {const n = {...prev}; delete n.description; return n;}); 
                }} 
              />
              {formErrors.description && <p className="text-[10px] text-destructive">{formErrors.description}</p>}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Price (₹)</Label>
                <Input 
                  type="number" 
                  onKeyDown={(e) => handleKeyRestriction(e)} 
                  className={cn(
                    getBorderClass("price", productForm.price, formErrors), 
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )} 
                  value={productForm.price} 
                  onChange={e => { 
                    setProductForm({...productForm, price: e.target.value}); 
                    setFormErrors(prev => {const n = {...prev}; delete n.price; return n;}); 
                  }} 
                />
                {formErrors.price && <p className="text-[10px] text-destructive">{formErrors.price}</p>}
              </div>

              <div className="space-y-1">
                <Label>Stock</Label>
                <Input 
                  type="number" 
                  step="any" 
                  onKeyDown={(e) => handleKeyRestriction(e)} 
                  className={cn(
                    getBorderClass("stock", productForm.stock, formErrors), 
                    "[appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  )} 
                  value={productForm.stock} 
                  onChange={e => { 
                    setProductForm({...productForm, stock: e.target.value}); 
                    setFormErrors(prev => {const n = {...prev}; delete n.stock; return n;}); 
                  }} 
                />
                {formErrors.stock && <p className="text-[10px] text-destructive">{formErrors.stock}</p>}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Category</Label>
                <Select 
                  value={productForm.categoryId} 
                  onValueChange={v => { 
                    setProductForm({...productForm, categoryId: v}); 
                    setFormErrors(prev => {const n = {...prev}; delete n.categoryId; return n;}); 
                  }}
                >
                  <SelectTrigger className={getBorderClass("categoryId", productForm.categoryId, formErrors)}>
                    <SelectValue placeholder="Select Category" />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {categories.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.icon} {c.name}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {formErrors.categoryId && <p className="text-[10px] text-destructive">{formErrors.categoryId}</p>}
              </div>

              <div className="space-y-1">
                <Label>Unit</Label>
                <Select 
                  value={productForm.unit} 
                  onValueChange={v => setProductForm({...productForm, unit: v})}
                >
                  <SelectTrigger className="border-green-500 border-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-card">
                    {["kg", "g", "ltr", "ml", "piece", "packet", "box", "dozen", "bundle"].map(u => (
                      <SelectItem key={u} value={u}>{u}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1">
                <Label>Expiry Date</Label>
                <Input 
                  type="date" 
                  className={getBorderClass("expiryDate", productForm.expiryDate, formErrors)} 
                  value={productForm.expiryDate} 
                  onChange={e => { 
                    setProductForm({...productForm, expiryDate: e.target.value}); 
                    setFormErrors(prev => {const n = {...prev}; delete n.expiryDate; return n;}); 
                  }} 
                />
                {formErrors.expiryDate && <p className="text-[10px] text-destructive">{formErrors.expiryDate}</p>}
              </div>

              <div className="space-y-1">
                <Label>Batch No.</Label>
                <Input 
                  className={getBorderClass("batchNo", productForm.batchNo, formErrors)} 
                  value={productForm.batchNo} 
                  onChange={e => { 
                    setProductForm({...productForm, batchNo: e.target.value}); 
                    setFormErrors(prev => {const n = {...prev}; delete n.batchNo; return n;}); 
                  }} 
                />
                {formErrors.batchNo && <p className="text-[10px] text-destructive">{formErrors.batchNo}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label>Image (Optional)</Label>
              <div className="flex gap-2 items-center">
                <Input 
                  id="img-up" 
                  type="file" 
                  className="hidden" 
                  onChange={handleImageUpload} 
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  className={cn(
                    "w-full border-dashed", 
                    productForm.image ? "border-green-500 border-2" : ""
                  )} 
                  onClick={() => document.getElementById('img-up')?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" /> {productForm.image ? "Change Image" : "Upload Image (Optional)"}
                </Button>
                {productForm.image && (
                  <div className="relative w-12 h-12 shrink-0">
                    <img src={productForm.image} className="w-full h-full object-cover rounded" />
                    <Button 
                      onClick={() => setProductForm({...productForm, image: ""})} 
                      type="button" 
                      variant="destructive" 
                      className="absolute -top-2 -right-2 h-5 w-5 rounded-full p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                )}
              </div>
              {!productForm.image && (
                <p className="text-xs text-muted-foreground">
                  No image? Default image will be used automatically.
                </p>
              )}
            </div>

            <Button type="submit" className="w-full" variant="hero">
              {editingProduct ? "Update Product" : "Save Product"}
            </Button>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};