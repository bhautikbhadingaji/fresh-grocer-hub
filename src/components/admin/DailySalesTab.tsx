import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
import { Save, Search, History, CalendarDays, Pencil, Trash2, Calendar as CalendarIcon, Plus, Clock, User, CreditCard } from "lucide-react";
import { Product } from "@/types";
import { SaleRecord, GroupedSales } from "@/types/admin";
import { handleKeyRestriction } from "@/utils/validation";

interface DailySalesTabProps {
  products: Product[];
  groupedSales: GroupedSales;
  onCreateSale: (payload: any) => Promise<any>;
  onUpdateSale: (saleId: string, payload: any) => Promise<any>;
  onDeleteSale: (saleId: string) => void;
  onProductUpdated: (product: Product) => void;
}

export const DailySalesTab = ({ 
  products, 
  groupedSales, 
  onCreateSale, 
  onUpdateSale, 
  onDeleteSale,
  onProductUpdated
}: DailySalesTabProps) => {
  const [selectedSalesProduct, setSelectedSalesProduct] = useState<string>("");
  const [salesQuantity, setSalesQuantity] = useState<string>("");
  const [salesSearch, setSalesSearch] = useState("");
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [isSaleEditDialogOpen, setIsSaleEditDialogOpen] = useState(false);

  // --- NEW: Customer and Payment Status ---
  const [customerName, setCustomerName] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");

  // --- DRAFT SALES STATE ---
  const [draftSales, setDraftSales] = useState<any[]>([]);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);

  // --- DATE FILTER LOGIC ---
  const todayDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [rawDateValue, setRawDateValue] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD for input

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setRawDateValue(val);
    if (val) {
      const d = new Date(val);
      setSelectedDate(d.toLocaleDateString('en-GB'));
    }
  };

  const displaySales = groupedSales[selectedDate];

  // Get current product and check stock
  const currentProduct = products.find(p => p.id === selectedSalesProduct);
  const enteredQuantity = parseFloat(salesQuantity) || 0;
  const isQuantityValid = enteredQuantity > 0 && (!currentProduct || enteredQuantity <= currentProduct.stock);

  // Validation for unpaid status requiring customer name
  const isCustomerNameRequired = paymentStatus === "unpaid";
  const canAddToDraft = selectedSalesProduct && 
                        salesQuantity && 
                        isQuantityValid &&
                        (!isCustomerNameRequired || (customerName && customerName.trim() !== ""));

  // Add or Update Draft
  const addOrUpdateDraft = () => {
    const product = products.find(p => p.id === selectedSalesProduct);
    if (!product || !salesQuantity || !isQuantityValid) return;

    const draftItem = {
      tempId: editingDraftIndex !== null ? draftSales[editingDraftIndex].tempId : Date.now().toString(),
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: parseFloat(salesQuantity),
      unitPrice: product.price,
      total: product.price * parseFloat(salesQuantity)
    };

    if (editingDraftIndex !== null) {
      // Update existing draft
      const updated = [...draftSales];
      updated[editingDraftIndex] = draftItem;
      setDraftSales(updated);
      setEditingDraftIndex(null);
    } else {
      // Add new draft
      setDraftSales([...draftSales, draftItem]);
    }

    // Reset form
    setSelectedSalesProduct("");
    setSalesQuantity("");
    setSalesSearch("");
  };

  // Edit Draft Item
  const editDraftItem = (index: number) => {
    const item = draftSales[index];
    setSelectedSalesProduct(item.productId);
    setSalesQuantity(item.quantity.toString());
    setEditingDraftIndex(index);
  };

  // Delete Draft Item
  const deleteDraftItem = (tempId: string) => {
    setDraftSales(draftSales.filter(d => d.tempId !== tempId));
    if (editingDraftIndex !== null) {
      setEditingDraftIndex(null);
      setSelectedSalesProduct("");
      setSalesQuantity("");
      setSalesSearch("");
    }
  };

  // Final Save All Items
  const handleFinalSave = async () => {
    if (draftSales.length === 0) return;
    
    // Validate customer name if payment is unpaid
    if (paymentStatus === "unpaid" && (!customerName || customerName.trim() === "")) {
      alert("Customer name is required when payment status is unpaid");
      return;
    }

    try {
      for (const sale of draftSales) {
        const payload = {
          productId: sale.productId,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice,
          customerName: customerName.trim(),
          paymentStatus: paymentStatus
        };
        const data = await onCreateSale(payload);
        if (data.product) {
          onProductUpdated({ ...data.product, id: data.product._id });
        }
      }
      setDraftSales([]);
      setCustomerName("");
      setPaymentStatus("paid");
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveSale = async () => {
    const product = products.find(p => 
      p.id === (editingSale ? (editingSale.productId as any)._id : selectedSalesProduct)
    );
    
    if (!product || !salesQuantity) return;
    const qty = parseFloat(salesQuantity);
    if (qty <= 0) return;

    try {
      const payload = {
        productId: product.id,
        quantity: qty,
        unitPrice: product.price,
        customerName: customerName.trim(),
        paymentStatus: paymentStatus
      };

      const data = editingSale 
        ? await onUpdateSale(editingSale._id, payload)
        : await onCreateSale(payload);

      if (data.product) {
        onProductUpdated({ ...data.product, id: data.product._id });
      }

      if (editingSale) {
        setIsSaleEditDialogOpen(false);
        setEditingSale(null);
      } else {
        setSelectedSalesProduct("");
        setSalesSearch("");
      }
      setSalesQuantity("");
      setCustomerName("");
      setPaymentStatus("paid");
    } catch (err) {
      console.error(err);
    }
  };

  const currentSaleProduct = products.find(p => 
    p.id === (editingSale ? (editingSale.productId as any)._id : selectedSalesProduct)
  );
  
  const totalSaleAmount = currentSaleProduct && salesQuantity 
    ? (currentSaleProduct.price * parseFloat(salesQuantity)).toFixed(2) 
    : "0.00";

  // Calculate paid and unpaid revenue
  const calculateRevenue = () => {
    if (!displaySales) return { paid: 0, unpaid: 0, total: 0 };
    
    let paidRevenue = 0;
    let unpaidRevenue = 0;
    
    displaySales.items.forEach((sale: any) => {
      if (sale.paymentStatus === 'unpaid') {
        unpaidRevenue += sale.total;
      } else {
        paidRevenue += sale.total;
      }
    });
    
    return {
      paid: paidRevenue,
      unpaid: unpaidRevenue,
      total: paidRevenue + unpaidRevenue
    };
  };

  const revenue = calculateRevenue();

  return (
    <div className="space-y-10">
      {/* Record Sale Form */}
      <div className="max-w-3xl mx-auto space-y-6">
        <h2 className="text-2xl font-bold">Record Daily Sale</h2>
        <div className="bg-card p-6 rounded-xl border space-y-4 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                      .map(p => (
                        <SelectItem key={p.id} value={p.id}>
                          {p.name} (Stock: {p.stock} {p.unit})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Quantity</Label>
              <div className="flex gap-2">
                <div className="flex-1">
                  <Input 
                    type="number" 
                    step="any" 
                    min="0"
                    onKeyDown={(e) => handleKeyRestriction(e)} 
                    value={salesQuantity} 
                    onChange={(e) => {
                      const val = e.target.value;
                      // Prevent negative values
                      if (val === '' || parseFloat(val) >= 0) {
                        setSalesQuantity(val);
                      }
                    }}
                    placeholder="0.00"
                    className={`font-bold ${
                      salesQuantity && currentProduct && parseFloat(salesQuantity) > currentProduct.stock 
                        ? 'border-destructive border-2' 
                        : ''
                    }`}
                  />
                  {salesQuantity && currentProduct && parseFloat(salesQuantity) > currentProduct.stock && (
                    <p className="text-xs text-destructive mt-1">
                      Exceeds available stock ({currentProduct.stock} {currentProduct.unit})
                    </p>
                  )}
                </div>
                {selectedSalesProduct && (
                  <div className="flex items-center px-3 bg-muted rounded-md text-sm font-medium border animate-in fade-in duration-200">
                    {products.find(p => p.id === selectedSalesProduct)?.unit}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2">
            <div className="text-sm font-bold text-primary">
              Total: ₹ {totalSaleAmount}
            </div>
            <Button 
              variant="outline" 
              className="border-dashed border-2 hover:bg-primary/5"
              onClick={addOrUpdateDraft}
              disabled={!canAddToDraft}
            >
              <Plus className="w-4 h-4 mr-2" /> 
              {editingDraftIndex !== null ? "Update Item" : "Add to List"}
            </Button>
          </div>

          {/* DRAFT LIST TABLE */}
          {draftSales.length > 0 && (
            <div className="mt-4 border rounded-lg overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted text-[10px] font-bold uppercase">
                  <tr>
                    <th className="p-2 text-left pl-4">Product</th>
                    <th className="p-2 text-center">Qty</th>
                    <th className="p-2 text-right pr-4">Total</th>
                    <th className="p-2 text-center w-20">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {draftSales.map((sale, index) => (
                    <tr key={sale.tempId} className={`bg-white ${editingDraftIndex === index ? 'bg-blue-50' : ''}`}>
                      <td className="p-2 pl-4 font-medium">{sale.name}</td>
                      <td className="p-2 text-center">{sale.quantity} {sale.unit}</td>
                      <td className="p-2 text-right pr-4 font-bold">₹{sale.total.toFixed(2)}</td>
                      <td className="p-2">
                        <div className="flex justify-center gap-1">
                          <button 
                            onClick={() => editDraftItem(index)}
                            className="p-1 hover:bg-blue-100 rounded"
                          >
                            <Pencil className="w-3 h-3 text-blue-600" />
                          </button>
                          <button 
                            onClick={() => deleteDraftItem(sale.tempId)}
                            className="p-1 hover:bg-red-100 rounded"
                          >
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              
              {/* Customer Name and Payment Status Section */}
              <div className="p-4 bg-muted/30 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Name {isCustomerNameRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      placeholder={isCustomerNameRequired ? "Required for unpaid sales" : "Optional"}
                      value={customerName}
                      onChange={(e) => setCustomerName(e.target.value)}
                      className={isCustomerNameRequired && (!customerName || customerName.trim() === '') ? 'border-destructive' : ''}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label className="flex items-center gap-2">
                      <CreditCard className="w-4 h-4" />
                      Payment Status
                    </Label>
                    <Select value={paymentStatus} onValueChange={(val: "paid" | "unpaid") => setPaymentStatus(val)}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-card">
                        <SelectItem value="paid">Paid</SelectItem>
                        <SelectItem value="unpaid">Unpaid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex justify-end">
                  <Button variant="hero" size="sm" onClick={handleFinalSave}>
                    <Save className="w-4 h-4 mr-2" /> Save All Items
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Sales History with Filter */}
      <div className="space-y-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <History className="w-5 h-5 text-primary" />
            <h3 className="text-xl font-bold">Sales History</h3>
          </div>

          <div className="flex items-center gap-3 bg-card p-2 rounded-lg border shadow-sm">
            <CalendarIcon className="w-4 h-4 text-muted-foreground ml-2" />
            <Input 
              type="date" 
              className="w-44 h-9 border-none focus-visible:ring-0 cursor-pointer font-medium"
              value={rawDateValue}
              onChange={handleDateChange}
            />
          </div>
        </div>

        <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border border-primary/10">
          <div className="flex items-center gap-2 font-bold text-primary">
            <CalendarDays className="w-4 h-4" /> 
            {selectedDate === todayDate ? "Today's Sales" : `Records for ${selectedDate}`}
          </div>
          {displaySales && (
            <div className="flex gap-4 text-sm font-bold">
              <span className="bg-white/50 px-3 py-1 rounded border">Total Qty: {displaySales.totalQty.toFixed(2)}</span>
              <span className="bg-green-100 text-green-700 px-3 py-1 rounded border border-green-200">Paid: ₹{revenue.paid.toFixed(2)}</span>
              <span className="bg-red-100 text-red-700 px-3 py-1 rounded border border-red-200">Unpaid: ₹{revenue.unpaid.toFixed(2)}</span>
              <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded border border-blue-200">Total: ₹{revenue.total.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {displaySales ? (
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-xs font-bold uppercase">
                  <tr>
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Product</th>
                    <th className="p-3">Customer</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Status</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displaySales.items.map((sale: any) => {
                    const dateObj = new Date(sale.createdAt);
                    const isUnpaid = sale.paymentStatus === 'unpaid';
                    
                    return (
                      <tr 
                        key={sale._id} 
                        className={`text-sm hover:bg-muted/10 transition-colors ${isUnpaid ? 'bg-red-50' : ''}`}
                      >
                        <td className="p-3">
                          <div className="flex flex-col">
                            <span className="font-medium">{dateObj.toLocaleDateString('en-GB')}</span>
                            <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <Clock className="w-3 h-3" />
                              {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                            </span>
                          </div>
                        </td>
                        <td className="p-3 font-medium">
                          {(sale.productId as any)?.name || 'Deleted Product'}
                        </td>
                        <td className="p-3">
                          <div className="flex items-center gap-1">
                            <User className="w-3 h-3 text-muted-foreground" />
                            {sale.customerName || '-'}
                          </div>
                        </td>
                        <td className="p-3 text-center font-bold">
                          {sale.quantity} {(sale.productId as any)?.unit}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">₹{sale.unitPrice}</td>
                        <td className="p-3 text-right font-bold text-primary">₹{sale.total}</td>
                        <td className="p-3 text-center">
                          <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${
                            isUnpaid 
                              ? 'bg-red-100 text-red-700 border border-red-200' 
                              : 'bg-green-100 text-green-700 border border-green-200'
                          }`}>
                            <CreditCard className="w-3 h-3" />
                            {isUnpaid ? 'Unpaid' : 'Paid'}
                          </span>
                        </td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setEditingSale(sale);
                                setSalesQuantity(sale.quantity.toString());
                                setCustomerName(sale.customerName || '');
                                setPaymentStatus(sale.paymentStatus || 'paid');
                                setIsSaleEditDialogOpen(true);
                              }}
                            >
                              <Pencil className="w-3 h-3" />
                            </Button>
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-destructive hover:bg-destructive/10"
                              onClick={() => onDeleteSale(sale._id)}
                            >
                              <Trash2 className="w-3 h-3" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="text-center p-12 bg-card border rounded-xl text-muted-foreground">
            No sales records found for {selectedDate}.
          </div>
        )}
      </div>

      {/* Sale Edit Dialog */}
      <Dialog 
        open={isSaleEditDialogOpen} 
        onOpenChange={(open) => { 
          setIsSaleEditDialogOpen(open); 
          if(!open) { 
            setEditingSale(null); 
            setSalesQuantity(""); 
            setCustomerName("");
            setPaymentStatus("paid");
          } 
        }}
      >
        <DialogContent className="bg-card">
          <DialogHeader>
            <DialogTitle>Edit Sale Record</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Product</Label>
              <div className="p-2 bg-muted rounded-md font-medium">
                {(editingSale?.productId as any)?.name}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Quantity</Label>
              <Input 
                type="number" 
                step="any"
                min="0"
                onKeyDown={(e) => handleKeyRestriction(e)} 
                value={salesQuantity} 
                onChange={(e) => {
                  const val = e.target.value;
                  // Prevent negative values
                  if (val === '' || parseFloat(val) >= 0) {
                    setSalesQuantity(val);
                  }
                }}
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name {paymentStatus === "unpaid" && <span className="text-destructive">*</span>}
              </Label>
              <Input 
                placeholder={paymentStatus === "unpaid" ? "Required for unpaid sales" : "Optional"}
                value={customerName}
                onChange={(e) => setCustomerName(e.target.value)}
                className={paymentStatus === "unpaid" && (!customerName || customerName.trim() === '') ? 'border-destructive' : ''}
              />
            </div>
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <CreditCard className="w-4 h-4" />
                Payment Status
              </Label>
              <Select value={paymentStatus} onValueChange={(val: "paid" | "unpaid") => setPaymentStatus(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="paid">Paid</SelectItem>
                  <SelectItem value="unpaid">Unpaid</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Updated Total</Label>
              <div className="h-10 flex items-center px-3 bg-primary/5 rounded-md border-2 border-primary/20 text-lg font-bold text-primary">
                ₹ {totalSaleAmount}
              </div>
            </div>
            <Button 
              className="w-full" 
              variant="hero" 
              onClick={handleSaveSale}
              disabled={paymentStatus === "unpaid" && (!customerName || customerName.trim() === '')}
            >
              Update Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};