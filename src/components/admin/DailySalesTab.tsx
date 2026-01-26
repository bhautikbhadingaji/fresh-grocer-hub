import { useState, useMemo, useEffect, useCallback } from "react";
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
import { 
  Save, 
  Search, 
  History, 
  CalendarDays, 
  Pencil, 
  Trash2, 
  Calendar as CalendarIcon, 
  Plus, 
  Clock, 
  User, 
  CreditCard,
  ChevronDown,
  ChevronRight
} from "lucide-react";
import { Product } from "@/types";
import { SaleRecord, GroupedSales } from "@/types/admin";
import { handleKeyRestriction } from "@/utils/validation";
import { useToast } from "@/hooks/use-toast";
import { useCustomers } from "@/hooks/useCustomers";

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
  const { toast } = useToast();
  const { customers, fetchCustomers } = useCustomers();

  const [selectedSalesProduct, setSelectedSalesProduct] = useState<string>("");
  const [salesQuantity, setSalesQuantity] = useState<string>("");
  const [salesPrice, setSalesPrice] = useState<string>("");
  const [inputMode, setInputMode] = useState<"quantity" | "price">("quantity");
  const [salesSearch, setSalesSearch] = useState("");
  const [editingSale, setEditingSale] = useState<SaleRecord | null>(null);
  const [isSaleEditDialogOpen, setIsSaleEditDialogOpen] = useState(false);

  const [customerName, setCustomerName] = useState<string>("");
  const [paymentStatus, setPaymentStatus] = useState<"paid" | "unpaid">("paid");
  const [isSubmitAttempted, setIsSubmitAttempted] = useState(false);
  
  // Customer suggestions state
  const [customerSuggestions, setCustomerSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // --- DRAFT SALES STATE ---
  const [draftSales, setDraftSales] = useState<any[]>([]);
  const [editingDraftIndex, setEditingDraftIndex] = useState<number | null>(null);

  // --- DATE FILTER LOGIC ---
  const todayDate = new Date().toLocaleDateString('en-GB'); // DD/MM/YYYY
  const [selectedDate, setSelectedDate] = useState<string>(todayDate);
  const [rawDateValue, setRawDateValue] = useState(new Date().toISOString().split('T')[0]); // YYYY-MM-DD for input

  // --- HISTORY ACCORDION STATE ---
  const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

  // Debounced customer search
  const debouncedCustomerSearch = useCallback(
    debounce((searchTerm: string) => {
      if (searchTerm.length > 0) {
        const suggestions = customers
          .map(c => c.name)
          .filter(name => name.toLowerCase().includes(searchTerm.toLowerCase()))
          .slice(0, 5);
        setCustomerSuggestions(suggestions);
        setShowSuggestions(suggestions.length > 0);
      } else {
        setShowSuggestions(false);
      }
    }, 300),
    [customers]
  );

  // Debounce utility function
  function debounce<T extends (...args: any[]) => any>(func: T, delay: number): T {
    let timeoutId: NodeJS.Timeout;
    return ((...args: any[]) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func(...args), delay);
    }) as T;
  }

  // Handle customer name input change
  const handleCustomerNameChange = (value: string) => {
    setCustomerName(value);
    debouncedCustomerSearch(value);
  };

  // Handle suggestion selection
  const selectCustomerSuggestion = (suggestion: string) => {
    setCustomerName(suggestion);
    setShowSuggestions(false);
  };

  // Fetch customers on component mount
  useEffect(() => {
    fetchCustomers();
  }, [fetchCustomers]);

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value; // YYYY-MM-DD
    setRawDateValue(val);
    if (val) {
      const d = new Date(val);
      setSelectedDate(d.toLocaleDateString('en-GB'));
    }
  };

  const displaySales = groupedSales[selectedDate];

  // Auto-calculate based on input mode
  const handleQuantityChange = (value: string) => {
    setSalesQuantity(value);
    if (currentProduct && value && inputMode === "quantity") {
      const qty = parseFloat(value);
      if (!isNaN(qty)) {
        setSalesPrice((currentProduct.price * qty).toFixed(2));
      }
    }
  };

  const handlePriceChange = (value: string) => {
    setSalesPrice(value);
    if (currentProduct && value && inputMode === "price") {
      const price = parseFloat(value);
      if (!isNaN(price) && currentProduct.price > 0) {
        setSalesQuantity((price / currentProduct.price).toFixed(2));
      }
    }
  };

  // Get current product and check stock
  const currentProduct = products.find(p => p.id === selectedSalesProduct);
  const enteredQuantity = parseFloat(salesQuantity) || 0;
  const isQuantityValid = enteredQuantity > 0 && (!currentProduct || enteredQuantity <= currentProduct.stock);

  // Validation for unpaid status requiring customer name
  const isCustomerNameRequired = paymentStatus === "unpaid";
  
  const canAddToDraft = selectedSalesProduct && 
                        salesQuantity && 
                        isQuantityValid;

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
      total: parseFloat(salesPrice) || (product.price * parseFloat(salesQuantity))
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
    setSalesPrice("");
    setSalesSearch("");
  };

  // Edit Draft Item
  const editDraftItem = (index: number) => {
    const item = draftSales[index];
    setSelectedSalesProduct(item.productId);
    setSalesQuantity(item.quantity.toString());
    setSalesPrice(item.total.toFixed(2));
    setEditingDraftIndex(index);
  };

  // Delete Draft Item
  const deleteDraftItem = (tempId: string) => {
    setDraftSales(draftSales.filter(d => d.tempId !== tempId));
    if (editingDraftIndex !== null) {
      setEditingDraftIndex(null);
      setSelectedSalesProduct("");
      setSalesQuantity("");
      setSalesPrice("");
      setSalesSearch("");
    }
  };

  // Final Save All Items
  const handleFinalSave = async () => {
    if (draftSales.length === 0) return;
    
    // Check Validation Logic
    if (paymentStatus === "unpaid" && (!customerName || customerName.trim() === "")) {
      // --- UPDATED: alert() ની બદલે Toast ---
      toast({
        title: "Validation Error",
        description: "Customer name is required when payment status is unpaid",
        variant: "destructive",
      });
      // Enable the red highlight
      setIsSubmitAttempted(true);
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
      // Reset State on Success
      setDraftSales([]);
      setCustomerName("");
      setPaymentStatus("paid");
      setIsSubmitAttempted(false); // Reset validation state
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
  
  const totalSaleAmount = salesPrice || (currentSaleProduct && salesQuantity 
    ? (currentSaleProduct.price * parseFloat(salesQuantity)).toFixed(2) 
    : "0.00");

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

  // --- Grouping Logic for History ---
  const groupedHistoryItems = useMemo(() => {
    if (!displaySales || !displaySales.items) return [];

    const items = [...displaySales.items];
    const groups: { main: SaleRecord; children: SaleRecord[] }[] = [];

    items.forEach((item) => {
      const lastGroup = groups.length > 0 ? groups[groups.length - 1] : null;
      
      const isSameBatch = lastGroup && 
        (lastGroup.main.customerName || "") === (item.customerName || "") &&
        lastGroup.main.paymentStatus === item.paymentStatus &&
        Math.abs(new Date(lastGroup.main.createdAt).getTime() - new Date(item.createdAt).getTime()) < 60000; // within 1 minute

      if (isSameBatch) {
        lastGroup.children.push(item);
      } else {
        groups.push({ main: item, children: [] });
      }
    });

    return groups;
  }, [displaySales]);

  const toggleGroup = (id: string) => {
    const newSet = new Set(expandedGroups);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedGroups(newSet);
  };

  // Helper to render a single row
  const RowItem = ({ sale, isChild = false, hasChildren = false, isExpanded = false, onToggle }: any) => {
    const dateObj = new Date(sale.createdAt);
    const isUnpaid = sale.paymentStatus === 'unpaid';

    return (
      <tr 
        className={`text-sm hover:bg-muted/10 transition-colors 
          ${isUnpaid ? 'bg-red-50' : ''} 
          ${isChild ? 'bg-muted/5' : ''}`
        }
      >
        <td className="p-3">
          <div className="flex items-start gap-2">
            {/* Arrow logic for Main Row */}
            {!isChild && (
              <div className="w-5 flex-shrink-0 pt-1">
                {hasChildren ? (
                  <button 
                    onClick={onToggle}
                    className="p-0.5 hover:bg-muted rounded-full transition-colors cursor-pointer"
                  >
                    {isExpanded ? 
                      <ChevronDown className="w-4 h-4 text-primary" /> : 
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    }
                  </button>
                ) : <div className="w-4" />}
              </div>
            )}
            
            {/* Indentation for Child Row */}
            {isChild && <div className="w-8 flex-shrink-0" />}

            <div className="flex flex-col">
              <span className="font-medium">{dateObj.toLocaleDateString('en-GB')}</span>
              <span className="text-[10px] text-muted-foreground flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {dateObj.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
              </span>
            </div>
          </div>
        </td>
        <td className="p-3 font-medium">
          <div className="flex items-center gap-2">
            {isChild && <div className="w-2 h-2 rounded-full bg-muted-foreground/30" />}
            {(sale.productId as any)?.name || 'Deleted Product'}
            {!isChild && hasChildren && (
               <span className="ml-2 text-[10px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full whitespace-nowrap">
                 +{hasChildren} more
               </span>
            )}
          </div>
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
  };

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
                          {p.name} - ₹{p.price} (Stock: {p.stock} {p.unit})
                        </SelectItem>
                      ))
                    }
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Input Mode</Label>
              <Select value={inputMode} onValueChange={(val: "quantity" | "price") => setInputMode(val)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-card">
                  <SelectItem value="quantity">By Quantity</SelectItem>
                  <SelectItem value="price">By Price</SelectItem>
                </SelectContent>
              </Select>
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
                      if (val === '' || parseFloat(val) >= 0) {
                        handleQuantityChange(val);
                      }
                    }}
                    placeholder="0.00"
                    className={`font-bold ${
                      salesQuantity && currentProduct && parseFloat(salesQuantity) > currentProduct.stock 
                        ? 'border-destructive border-2' 
                        : ''
                    }`}
                    disabled={inputMode === "price"}
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Price (₹)</Label>
              <Input 
                type="number" 
                step="any" 
                min="0"
                onKeyDown={(e) => handleKeyRestriction(e)} 
                value={salesPrice} 
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === '' || parseFloat(val) >= 0) {
                    handlePriceChange(val);
                  }
                }}
                placeholder="0.00"
                className="font-bold"
                disabled={inputMode === "quantity"}
              />
            </div>

            <div className="space-y-2">
              <Label>Rate per {currentProduct?.unit || 'unit'}</Label>
              <div className="flex items-center px-3 bg-muted rounded-md text-sm font-medium border h-10">
                ₹{currentProduct?.price || 0}
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
                  <div className="space-y-2 relative">
                    <Label className="flex items-center gap-2">
                      <User className="w-4 h-4" />
                      Customer Name {isCustomerNameRequired && <span className="text-destructive">*</span>}
                    </Label>
                    <Input 
                      placeholder={isCustomerNameRequired ? "Required for unpaid sales" : "Optional"}
                      value={customerName}
                      onChange={(e) => handleCustomerNameChange(e.target.value)}
                      onFocus={() => customerName && setShowSuggestions(customerSuggestions.length > 0)}
                      onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      className={
                        isCustomerNameRequired && isSubmitAttempted && (!customerName || customerName.trim() === '') 
                          ? 'border-destructive border-2' 
                          : ''
                      }
                    />
                    {showSuggestions && (
                      <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                        {customerSuggestions.map((suggestion, index) => (
                          <div
                            key={index}
                            className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                            onClick={() => selectCustomerSuggestion(suggestion)}
                          >
                            {suggestion}
                          </div>
                        ))}
                      </div>
                    )}
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
              <table className="w-full text-left border-collapse">
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
                  {groupedHistoryItems.map((group) => {
                    const hasChildren = group.children.length > 0;
                    const isExpanded = expandedGroups.has(group.main._id);
                    
                    return (
                      <div key={group.main._id} style={{ display: 'contents' }}>
                        {/* Main Group Row */}
                        <RowItem 
                          sale={group.main} 
                          hasChildren={hasChildren ? group.children.length : 0}
                          isExpanded={isExpanded}
                          onToggle={() => toggleGroup(group.main._id)}
                        />

                        {/* Children Rows (Dropdown) */}
                        {hasChildren && isExpanded && group.children.map(child => (
                           <RowItem key={child._id} sale={child} isChild={true} />
                        ))}
                      </div>
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
                  if (val === '' || parseFloat(val) >= 0) {
                    setSalesQuantity(val);
                  }
                }}
                className="font-bold"
              />
            </div>
            <div className="space-y-2 relative">
              <Label className="flex items-center gap-2">
                <User className="w-4 h-4" />
                Customer Name {paymentStatus === "unpaid" && <span className="text-destructive">*</span>}
              </Label>
              <Input 
                placeholder={paymentStatus === "unpaid" ? "Required for unpaid sales" : "Optional"}
                value={customerName}
                onChange={(e) => handleCustomerNameChange(e.target.value)}
                onFocus={() => customerName && setShowSuggestions(customerSuggestions.length > 0)}
                onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                className={paymentStatus === "unpaid" && (!customerName || customerName.trim() === '') ? 'border-destructive' : ''}
              />
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 z-50 bg-white border border-gray-200 rounded-md shadow-lg max-h-40 overflow-y-auto">
                  {customerSuggestions.map((suggestion, index) => (
                    <div
                      key={index}
                      className="px-3 py-2 hover:bg-gray-100 cursor-pointer text-sm"
                      onClick={() => selectCustomerSuggestion(suggestion)}
                    >
                      {suggestion}
                    </div>
                  ))}
                </div>
              )}
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