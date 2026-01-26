import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Store, ArrowLeft, Package, Tags, BarChart3, Users } from "lucide-react";
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
import { CustomersTab } from "@/components/admin/CustomersTab";

const Admin = () => {
  const [activeTab, setActiveTab] = useState<"products" | "categories" | "stock" | "sales" | "customers">("products");
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
    salesHistory,
    createSale,
    updateSale,
    deleteSale,
    recordPayment,
    groupSalesByDate,
    fetchSales
  } = useSales();

  const updateCustomer = async (customerName: string, updates: { name: string; address?: string; phone?: string }) => {
    const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const response = await fetch(`${API}/api/customers/${encodeURIComponent(customerName)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    });
    
    const data = await response.json();
    if (!response.ok) {
      throw new Error(data.message || 'Failed to update customer');
    }
    
    // Refresh sales data to reflect customer name changes
    await fetchSales();
    
    return data;
  };

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

  // Count customers with unpaid balance
  const customersWithUnpaid = new Set(
    salesHistory
      .filter(s => s.paymentStatus === 'unpaid' || s.paymentStatus === 'partial')
      .map(s => s.customerName)
      .filter(Boolean)
  ).size;

  const tabs = [
    { id: "products" as const, label: "Products", icon: Package, count: products.length },
    { id: "categories" as const, label: "Categories", icon: Tags, count: categories.length },
    { id: "stock" as const, label: "Stock Management", icon: BarChart3 },
    { id: "sales" as const, label: "Daily Sales", icon: Store },
    { id: "customers" as const, label: "Customers", icon: Users, badge: customersWithUnpaid },
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

      <div className="container mx-auto px-2 sm:px-4 py-4 sm:py-8">
        <div className="flex gap-1 sm:gap-2 mb-4 sm:mb-8 overflow-x-auto pb-2 scrollbar-hide">
          {tabs.map((tab) => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)} 
              className={cn(
                "flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-2 rounded-lg font-medium transition-all whitespace-nowrap relative text-xs sm:text-sm", 
                activeTab === tab.id 
                  ? "bg-primary text-primary-foreground shadow-glow" 
                  : "bg-card text-muted-foreground border border-border"
              )}
            >
              <tab.icon className="w-3 h-3 sm:w-4 sm:h-4" /> 
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              {tab.count !== undefined && (
                <span className="ml-1 opacity-70 text-[10px] sm:text-xs">({tab.count})</span>
              )}
              {tab.badge !== undefined && tab.badge > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] sm:text-xs rounded-full w-4 h-4 sm:w-5 sm:h-5 flex items-center justify-center font-bold">
                  {tab.badge}
                </span>
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

        {activeTab === "customers" && (
          <CustomersTab
            salesHistory={salesHistory}
            onPaymentUpdate={recordPayment}
            onCustomerUpdate={updateCustomer}
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