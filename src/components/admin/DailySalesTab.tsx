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
import { Save, Search, History, CalendarDays, Pencil, Trash2, Calendar as CalendarIcon, Plus, Clock } from "lucide-react";
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

  // --- DRAFT SALES STATE ---
  const [draftSales, setDraftSales] = useState<any[]>([]);

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

  // ૧. ડ્રાફ્ટમાં એડ કરવા માટે
  const addToDraft = () => {
    const product = products.find(p => p.id === selectedSalesProduct);
    if (!product || !salesQuantity) return;

    const newDraft = {
      tempId: Date.now().toString(),
      productId: product.id,
      name: product.name,
      unit: product.unit,
      quantity: parseFloat(salesQuantity),
      unitPrice: product.price,
      total: product.price * parseFloat(salesQuantity)
    };

    setDraftSales([...draftSales, newDraft]);
    setSelectedSalesProduct("");
    setSalesQuantity("");
    setSalesSearch("");
  };

  // ૨. ફાઈનલ સેવ
  const handleFinalSave = async () => {
    if (draftSales.length === 0) return;
    try {
      for (const sale of draftSales) {
        const payload = {
          productId: sale.productId,
          quantity: sale.quantity,
          unitPrice: sale.unitPrice
        };
        const data = await onCreateSale(payload);
        if (data.product) {
          onProductUpdated({ ...data.product, id: data.product._id });
        }
      }
      setDraftSales([]); 
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
        unitPrice: product.price
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
                <Input 
                  type="number" 
                  step="any" 
                  onKeyDown={(e) => handleKeyRestriction(e)} 
                  value={salesQuantity} 
                  onChange={(e) => setSalesQuantity(e.target.value)}
                  placeholder="0.00"
                  className="font-bold"
                />
                {/* POINT 3: Display unit box only when a product is selected */}
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
              onClick={addToDraft}
              disabled={!selectedSalesProduct || !salesQuantity || parseFloat(salesQuantity) <= 0}
            >
              <Plus className="w-4 h-4 mr-2" /> Add to List
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
                    <th className="p-2 text-center w-10"></th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {draftSales.map((sale) => (
                    <tr key={sale.tempId} className="bg-white">
                      <td className="p-2 pl-4 font-medium">{sale.name}</td>
                      <td className="p-2 text-center">{sale.quantity} {sale.unit}</td>
                      <td className="p-2 text-right pr-4 font-bold">₹{sale.total.toFixed(2)}</td>
                      <td className="p-2">
                        <button onClick={() => setDraftSales(draftSales.filter(d => d.tempId !== sale.tempId))}>
                          <Trash2 className="w-3 h-3 text-destructive" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-3 bg-primary/5 flex justify-end">
                <Button variant="hero" size="sm" onClick={handleFinalSave}>
                  <Save className="w-4 h-4 mr-2" /> Save All Items
                </Button>
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
              <span className="bg-white/50 px-3 py-1 rounded border text-green-600">Revenue: ₹{displaySales.totalRevenue.toFixed(2)}</span>
            </div>
          )}
        </div>
        
        {displaySales ? (
          <div className="bg-card rounded-xl border overflow-hidden shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead className="bg-muted/30 text-xs font-bold uppercase">
                  <tr>
                    {/* POINT 1: Column Header Updated */}
                    <th className="p-3">Date & Time</th>
                    <th className="p-3">Product</th>
                    <th className="p-3 text-center">Qty</th>
                    <th className="p-3 text-right">Price</th>
                    <th className="p-3 text-right">Total</th>
                    <th className="p-3 text-center">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {displaySales.items.map((sale: any) => {
                    const dateObj = new Date(sale.createdAt);
                    return (
                      <tr key={sale._id} className="text-sm hover:bg-muted/10 transition-colors">
                        <td className="p-3">
                          {/* POINT 1: Displaying both Date and Time */}
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
                        <td className="p-3 text-center font-bold">
                          {sale.quantity} {(sale.productId as any)?.unit}
                        </td>
                        <td className="p-3 text-right text-muted-foreground">₹{sale.unitPrice}</td>
                        <td className="p-3 text-right font-bold text-primary">₹{sale.total}</td>
                        <td className="p-3 text-center">
                          <div className="flex justify-center gap-1">
                            <Button 
                              variant="ghost" 
                              size="icon" 
                              className="h-7 w-7 text-blue-600 hover:bg-blue-50"
                              onClick={() => {
                                setEditingSale(sale);
                                setSalesQuantity(sale.quantity.toString());
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
          if(!open) { setEditingSale(null); setSalesQuantity(""); } 
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
                onKeyDown={(e) => handleKeyRestriction(e)} 
                value={salesQuantity} 
                onChange={(e) => setSalesQuantity(e.target.value)}
                className="font-bold"
              />
            </div>
            <div className="space-y-2">
              <Label>Updated Total</Label>
              <div className="h-10 flex items-center px-3 bg-primary/5 rounded-md border-2 border-primary/20 text-lg font-bold text-primary">
                ₹ {totalSaleAmount}
              </div>
            </div>
            <Button className="w-full" variant="hero" onClick={handleSaveSale}>
              Update Sale
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};