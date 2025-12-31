import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, Package, Tags, BarChart3 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import ConfirmDeleteDialog from "@/components/ui/ConfirmDeleteDialog";
import { cn } from "@/lib/utils";

// Hooks
import { useProducts } from "@/hooks/useProducts";
import { useCategories } from "@/hooks/useCategories";
import { useSales } from "@/hooks/useSales";

// Tab Components
import { ProductsTab } from "@/components/admin/ProductsTab";
import { CategoriesTab } from "@/components/admin/CategoriesTab";
import { StockManagementTab } from "@/components/admin/StockManagementTab";
import { DailySalesTab } from "@/components/admin/DailySalesTab";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stock" | "sales">("products");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteType, setDeleteType] = useState<"product" | "category" | "sale" | null>(null);
  
  const { toast } = useToast();
  
  // Custom hooks
  const {
    products,
    setProducts,
    tempStocks,
    setTempStocks,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock
  } = useProducts();

  const {
    categories,
    createCategory,
    updateCategory,
    deleteCategory
  } = useCategories();

  const {
    createSale,
    updateSale,
    deleteSale,
    groupSalesByDate
  } = useSales();

  const handleDeleteRequest = (id: string, type: "product" | "category" | "sale") => {
    if (type === "category") {
      const hasProducts = products.some(p => String(p.categoryId) === String(id));
      if (hasProducts) {
        toast({ 
          title: "Action Forbidden", 
          description: "Cannot delete category while it contains products.", 
          variant: "destructive" 
        });
        return;
      }
    }
    setDeleteId(id);
    setDeleteType(type);
  };

  const confirmDelete = async () => {
    if (!deleteId || !deleteType) return;

    try {
      if (deleteType === "product") {
        await deleteProduct(deleteId);
      } else if (deleteType === "category") {
        await deleteCategory(deleteId);
      } else {
        const res = await deleteSale(deleteId);
        if (res.product) {
          setProducts(products.map(p => 
            String(p.id) === String(res.product._id) 
              ? { ...res.product, id: res.product._id } 
              : p
          ));
        }
      }
    } finally {
      setDeleteId(null);
      setDeleteType(null);
    }
  };

  const handleProductUpdate = (product: any) => {
    setProducts(products.map(p => 
      String(p.id) === String(product.id) ? product : p
    ));
  };

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
            <Link to="/" className="text-muted-foreground hover:text-primary">
              <ArrowLeft />
            </Link>
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
                <Store className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="font-bold hidden sm:block">Admin Dashboard</h1>
            </div>
          </div>
          <Link to="/">
            <Button variant="outline" size="sm">View Store</Button>
          </Link>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="flex gap-2 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={cn(
                "flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap", 
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              <tab.icon className="w-4 h-4" /> 
              {tab.label} 
              {tab.count !== undefined && (
                <span className="ml-1 opacity-70">({tab.count})</span>
              )}
            </button>
          ))}
        </div>

        {activeTab === "products" && (
          <ProductsTab
            products={products}
            categories={categories}
            onCreateProduct={createProduct}
            onUpdateProduct={updateProduct}
            onDeleteProduct={(id) => handleDeleteRequest(id, "product")}
          />
        )}

        {activeTab === "categories" && (
          <CategoriesTab
            categories={categories}
            onCreateCategory={createCategory}
            onUpdateCategory={updateCategory}
            onDeleteCategory={(id) => handleDeleteRequest(id, "category")}
          />
        )}

        {activeTab === "stock" && (
          <StockManagementTab
            products={products}
            categories={categories}
            tempStocks={tempStocks}
            onTempStockChange={setTempStocks}
            onUpdateStock={updateStock}
          />
        )}

        {activeTab === "sales" && (
          <DailySalesTab
            products={products}
            groupedSales={groupSalesByDate()}
            onCreateSale={createSale}
            onUpdateSale={updateSale}
            onDeleteSale={(id) => handleDeleteRequest(id, "sale")}
            onProductUpdated={handleProductUpdate}
          />
        )}
      </div>

      <ConfirmDeleteDialog 
        open={!!deleteId} 
        onClose={() => { setDeleteId(null); setDeleteType(null); }} 
        onConfirm={confirmDelete} 
        title={`Delete ${deleteType === "product" ? "Product" : deleteType === "category" ? "Category" : "Sale Record"}?`} 
        description="This action is permanent and cannot be undone." 
      />
    </div>
  );
};

export default Admin;