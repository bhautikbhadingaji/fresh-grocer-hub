import { useState, useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Users, Search, DollarSign, CheckCircle2, AlertCircle, IndianRupee, Package, Edit } from "lucide-react";
import { SaleRecord } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

// Prevent negative values and non-numeric input
const handleKeyRestriction = (e: React.KeyboardEvent<HTMLInputElement>) => {
  const allowedKeys = ['Backspace', 'Delete', 'ArrowLeft', 'ArrowRight', 'Tab', 'Enter', '.'];
  
  // Prevent minus sign
  if (e.key === '-') {
    e.preventDefault();
    return;
  }
  
  if (!/[0-9]/.test(e.key) && !allowedKeys.includes(e.key)) {
    e.preventDefault();
  }
};

interface CustomersTabProps {
  salesHistory: SaleRecord[];
  onPaymentUpdate: (saleId: string, amountPaid: number) => Promise<any>;
  onCustomerUpdate?: (customerName: string, updates: { name: string; address?: string; phone?: string }) => Promise<any>;
}

interface CustomerData {
  name: string;
  totalPurchases: number;
  totalPaid: number;
  totalUnpaid: number;
  salesCount: number;
  lastPurchaseDate: string;
  sales: SaleRecord[];
  address?: string;
  phone?: string;
}

export const CustomersTab = ({ salesHistory, onPaymentUpdate, onCustomerUpdate }: CustomersTabProps) => {
  const { toast } = useToast();
  const [searchQuery, setSearchQuery] = useState("");
  const [paymentStatusFilter, setPaymentStatusFilter] = useState<string>("all");
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [paymentDialogOpen, setPaymentDialogOpen] = useState(false);
  const [selectedSale, setSelectedSale] = useState<SaleRecord | null>(null);
  const [paymentAmount, setPaymentAmount] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Edit customer states
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({ name: "", address: "", phone: "" });
  
  // Pay All confirmation state
  const [payAllDialogOpen, setPayAllDialogOpen] = useState(false);

  // Handle payment amount change with validation
  const handlePaymentAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Remove any negative signs and non-numeric characters except decimal point
    const sanitized = value.replace(/-/g, '').replace(/[^0-9.]/g, '');
    setPaymentAmount(sanitized);
  };

  const customersData = useMemo(() => {
    console.log('CustomersTab: Processing salesHistory', salesHistory.length);
    const customerMap = new Map<string, CustomerData>();

    salesHistory.forEach((sale) => {
      const customerName = sale.customerName?.trim() || "Walk-in Customer";
      
      if (!customerMap.has(customerName)) {
        customerMap.set(customerName, {
          name: customerName,
          totalPurchases: 0,
          totalPaid: 0,
          totalUnpaid: 0,
          salesCount: 0,
          lastPurchaseDate: sale.createdAt,
          sales: []
        });
      }

      const customer = customerMap.get(customerName)!;
      const saleTotal = Number(sale.total || 0);
      const salePaid = Number(sale.totalPaid || 0);
      const saleUnpaid = Number(sale.totalUnpaid || 0);

      console.log(`Sale ${sale._id}:`, { total: saleTotal, paid: salePaid, unpaid: saleUnpaid, status: sale.paymentStatus });

      customer.totalPurchases += saleTotal;
      customer.totalPaid += salePaid;
      customer.totalUnpaid += saleUnpaid;
      customer.salesCount += 1;
      customer.sales.push(sale);

      if (new Date(sale.createdAt) > new Date(customer.lastPurchaseDate)) {
        customer.lastPurchaseDate = sale.createdAt;
      }
    });

    return Array.from(customerMap.values()).sort((a, b) => 
      new Date(b.lastPurchaseDate).getTime() - new Date(a.lastPurchaseDate).getTime()
    );
  }, [salesHistory]);

  const filteredCustomers = useMemo(() => {
    let filtered = customersData;
    
    // Filter by search query
    if (searchQuery.trim()) {
      filtered = filtered.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));
    }
    
    // Filter by payment status
    if (paymentStatusFilter !== "all") {
      filtered = filtered.filter(c => {
        if (paymentStatusFilter === "paid") {
          return c.totalUnpaid === 0;
        } else if (paymentStatusFilter === "unpaid") {
          return c.totalUnpaid > 0;
        }
        return true;
      });
    }
    
    return filtered;
  }, [customersData, searchQuery, paymentStatusFilter]);

  const selectedCustomerData = useMemo(() => {
    if (!selectedCustomer) return null;
    return customersData.find(c => c.name === selectedCustomer);
  }, [selectedCustomer, customersData]);

  const handlePaymentSubmit = async () => {
    if (!selectedSale || !paymentAmount) return;

    const amount = parseFloat(paymentAmount);
    const unpaid = Number(selectedSale.totalUnpaid || 0);
    
    console.log('Payment Submit:', { amount, unpaid, saleId: selectedSale._id });
    
    if (isNaN(amount) || amount <= 0) {
      toast({ title: "Invalid Amount", description: "Enter valid amount", variant: "destructive" });
      return;
    }

    if (amount > unpaid + 0.01) {
      toast({ title: "Invalid Amount", description: `Max: ₹${unpaid.toFixed(2)}`, variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      const result = await onPaymentUpdate(selectedSale._id, amount);
      console.log('Payment Result:', result);
      toast({ title: "Success", description: `₹${amount} payment recorded` });
      setPaymentDialogOpen(false);
      setSelectedSale(null);
      setPaymentAmount("");
    } catch (err: any) {
      console.error('Payment Error:', err);
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePayAll = async () => {
    if (!selectedCustomerData || selectedCustomerData.totalUnpaid <= 0) return;

    try {
      setIsSubmitting(true);
      const unpaidSales = selectedCustomerData.sales.filter(sale => Number(sale.totalUnpaid || 0) > 0);
      
      for (const sale of unpaidSales) {
        await onPaymentUpdate(sale._id, Number(sale.totalUnpaid || 0));
      }
      
      toast({ 
        title: "Success", 
        description: `₹${selectedCustomerData.totalUnpaid.toFixed(2)} total payment processed` 
      });
      setPayAllDialogOpen(false);
    } catch (err: any) {
      console.error('Pay All Error:', err);
      toast({ title: "Error", description: err.message || "Payment failed", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const openPaymentDialog = (sale: SaleRecord) => {
    setSelectedSale(sale);
    setPaymentAmount((sale.totalUnpaid || 0).toString());
    setPaymentDialogOpen(true);
  };

  const openEditDialog = (customer: CustomerData) => {
    setEditForm({
      name: customer.name,
      address: customer.address || "",
      phone: customer.phone || ""
    });
    setEditDialogOpen(true);
  };

  const handleEditSubmit = async () => {
    if (!onCustomerUpdate || !selectedCustomerData) return;
    
    if (!editForm.name.trim()) {
      toast({ title: "Error", description: "Name is required", variant: "destructive" });
      return;
    }

    try {
      setIsSubmitting(true);
      await onCustomerUpdate(selectedCustomerData.name, editForm);
      toast({ title: "Success", description: "Customer updated successfully" });
      setEditDialogOpen(false);
    } catch (err: any) {
      toast({ title: "Error", description: err.message || "Failed to update customer", variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  const summary = useMemo(() => {
    const totalCustomers = customersData.length;
    const totalRevenue = customersData.reduce((sum, c) => sum + c.totalPurchases, 0);
    const totalPaid = customersData.reduce((sum, c) => sum + c.totalPaid, 0);
    const totalUnpaid = customersData.reduce((sum, c) => sum + c.totalUnpaid, 0);
    const customersWithUnpaid = customersData.filter(c => c.totalUnpaid > 0).length;
    return { totalCustomers, totalRevenue, totalPaid, totalUnpaid, customersWithUnpaid };
  }, [customersData]);

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 md:gap-4">
        <StatCard title="Total Customers" value={summary.totalCustomers} icon={<Users className="w-4 h-4" />} />
        <StatCard title="Total Revenue" value={`₹${summary.totalRevenue.toFixed(0)}`} icon={<IndianRupee className="w-4 h-4" />} color="text-primary" />
        <StatCard title="Total Paid" value={`₹${summary.totalPaid.toFixed(0)}`} icon={<CheckCircle2 className="w-4 h-4" />} color="text-green-600" />
        <StatCard title="Total Unpaid" value={`₹${summary.totalUnpaid.toFixed(0)}`} icon={<AlertCircle className="w-4 h-4" />} color="text-red-600" />
        <StatCard title="With Pending" value={summary.customersWithUnpaid} icon={<Users className="w-4 h-4" />} color="text-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Customer List */}
        <div className="lg:col-span-1 bg-card p-3 md:p-4 rounded-xl border">
          <div className="space-y-3 mb-3 md:mb-4">
            <div className="relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="pl-10" />
            </div>
            <Select value={paymentStatusFilter} onValueChange={setPaymentStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Customers</SelectItem>
                <SelectItem value="paid">Paid</SelectItem>
                <SelectItem value="unpaid">Unpaid</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 max-h-[300px] md:max-h-[500px] overflow-y-auto">
            {filteredCustomers.map((customer) => (
              <button
                key={customer.name}
                onClick={() => setSelectedCustomer(customer.name)}
                className={`w-full text-left p-2.5 md:p-3 rounded-lg border transition ${
                  selectedCustomer === customer.name ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
                }`}
              >
                <div className="flex justify-between items-start font-bold text-sm md:text-base">
                  <span className="truncate">{customer.name}</span>
                  {customer.totalUnpaid > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 py-0.5 rounded">DUE</span>}
                </div>
                <div className="text-xs mt-1 opacity-70 flex justify-between">
                  <span>{customer.salesCount} Sales</span>
                  <span>₹{customer.totalUnpaid.toFixed(0)} due</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="lg:col-span-2">
          {selectedCustomerData ? (
            <div className="bg-card p-4 md:p-6 rounded-xl border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center border-b pb-3 md:pb-4 mb-3 md:mb-4 gap-2">
                <div className="flex items-center gap-2">
                  <h2 className="text-xl md:text-2xl font-bold">{selectedCustomerData.name}</h2>
                  <Button 
                    size="sm" 
                    variant="outline" 
                    onClick={() => openEditDialog(selectedCustomerData)}
                    className="h-8 w-8 p-0"
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
                <div className="text-left sm:text-right flex flex-col sm:flex-row items-start sm:items-center gap-2">
                  <div>
                    <p className="text-xs text-muted-foreground">UNPAID</p>
                    <p className="text-xl md:text-2xl font-black text-red-600">₹{selectedCustomerData.totalUnpaid.toFixed(2)}</p>
                  </div>
                  {selectedCustomerData.totalUnpaid > 0 && (
                    <Button 
                      onClick={() => setPayAllDialogOpen(true)} 
                      disabled={isSubmitting}
                      size="sm"
                      className="bg-green-600 hover:bg-green-700 text-white font-bold whitespace-nowrap"
                    >
                      {isSubmitting ? "Processing..." : "Pay All"}
                    </Button>
                  )}
                </div>
              </div>

              {/* Mobile Card View */}
              <div className="block md:hidden space-y-3">
                {selectedCustomerData.sales.map((sale) => {
                  const paid = Number(sale.totalPaid || 0);
                  const unpaid = Number(sale.totalUnpaid || 0);
                  return (
                    <div key={sale._id} className="border rounded-lg p-3 space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex items-center gap-1 text-sm font-medium">
                          <Package className="w-3 h-3" />
                          {(sale.productId as any)?.name}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {new Date(sale.createdAt).toLocaleDateString('en-GB')}
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-sm">
                        <div>
                          <span className="text-xs text-muted-foreground">Total:</span>
                          <span className="font-bold ml-1">₹{sale.total.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Paid:</span>
                          <span className="font-bold text-green-600 ml-1">₹{paid.toFixed(2)}</span>
                        </div>
                        <div>
                          <span className="text-xs text-muted-foreground">Unpaid:</span>
                          <span className="font-bold text-red-600 ml-1">₹{unpaid.toFixed(2)}</span>
                        </div>
                        <div className="flex items-center">
                          {sale.paymentStatus === 'paid' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-green-100 text-green-700">PAID</span>}
                          {sale.paymentStatus === 'partial' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-yellow-100 text-yellow-700">PARTIAL</span>}
                          {sale.paymentStatus === 'unpaid' && <span className="px-2 py-0.5 rounded-full text-[9px] font-bold bg-red-100 text-red-700">UNPAID</span>}
                        </div>
                      </div>
                      
                      {unpaid > 0 && (
                        <Button size="sm" variant="outline" className="w-full h-8 text-green-600" onClick={() => openPaymentDialog(sale)}>
                          Pay Now
                        </Button>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Product</th>
                      <th className="p-3 text-right">Total</th>
                      <th className="p-3 text-right text-green-600">Paid</th>
                      <th className="p-3 text-right text-red-600">Unpaid</th>
                      <th className="p-3 text-center">Status</th>
                      <th className="p-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {selectedCustomerData.sales.map((sale) => {
                      const paid = Number(sale.totalPaid || 0);
                      const unpaid = Number(sale.totalUnpaid || 0);
                      return (
                        <tr key={sale._id} className="hover:bg-muted/20">
                          <td className="p-3">{new Date(sale.createdAt).toLocaleDateString('en-GB')}</td>
                          <td className="p-3 flex items-center gap-1">
                            <Package className="w-3 h-3" />
                            {(sale.productId as any)?.name}
                          </td>
                          <td className="p-3 text-right font-bold">₹{sale.total.toFixed(2)}</td>
                          <td className="p-3 text-right text-green-600 font-bold">₹{paid.toFixed(2)}</td>
                          <td className="p-3 text-right text-red-600 font-bold">₹{unpaid.toFixed(2)}</td>
                          <td className="p-3 text-center">
                            {sale.paymentStatus === 'paid' && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-green-100 text-green-700">PAID</span>}
                            {sale.paymentStatus === 'partial' && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-yellow-100 text-yellow-700">PARTIAL</span>}
                            {sale.paymentStatus === 'unpaid' && <span className="px-2 py-1 rounded-full text-[10px] font-bold bg-red-100 text-red-700">UNPAID</span>}
                          </td>
                          <td className="p-3 text-right">
                            {unpaid > 0 && (
                              <Button size="sm" variant="outline" className="h-7 text-green-600" onClick={() => openPaymentDialog(sale)}>
                                Pay
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          ) : (
            <div className="bg-card rounded-xl border p-12 md:p-20 text-center text-muted-foreground">
              <Users className="w-10 h-10 md:w-12 md:h-12 mx-auto mb-3 md:mb-4 opacity-10" />
              <p className="text-sm md:text-base">Select a customer</p>
            </div>
          )}
        </div>
      </div>

      {/* Payment Dialog */}
      <Dialog open={paymentDialogOpen} onOpenChange={setPaymentDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Record Payment</DialogTitle></DialogHeader>
          {selectedSale && (
            <div className="space-y-4 py-4">
              <div className="bg-muted p-3 rounded-lg text-sm space-y-1">
                <div className="flex justify-between"><span>Product:</span><span className="font-bold">{(selectedSale.productId as any)?.name}</span></div>
                <div className="flex justify-between"><span>Total:</span><span className="font-bold">₹{selectedSale.total.toFixed(2)}</span></div>
                <div className="flex justify-between text-green-600"><span>Paid:</span><span className="font-bold">₹{(selectedSale.totalPaid || 0).toFixed(2)}</span></div>
                <div className="flex justify-between text-red-600"><span>Remaining:</span><span className="font-bold">₹{(selectedSale.totalUnpaid || 0).toFixed(2)}</span></div>
              </div>
              <div className="space-y-2">
                <Label>Amount (₹)</Label>
                <div className="relative">
                  <IndianRupee className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input 
                    type="text"
                    inputMode="decimal"
                    value={paymentAmount} 
                    onChange={handlePaymentAmountChange}
                    onKeyDown={handleKeyRestriction}
                    onPaste={(e) => {
                      e.preventDefault();
                      const pastedText = e.clipboardData.getData('text');
                      const sanitized = pastedText.replace(/-/g, '').replace(/[^0-9.]/g, '');
                      setPaymentAmount(sanitized);
                    }}
                    className="pl-10 text-lg font-bold" 
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setPaymentDialogOpen(false)} disabled={isSubmitting}>Cancel</Button>
                <Button className="flex-1 bg-green-600 hover:bg-green-700" onClick={handlePaymentSubmit} disabled={isSubmitting}>
                  {isSubmitting ? "Wait..." : "Confirm"}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Customer Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Edit Customer</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Name *</Label>
              <Input 
                value={editForm.name} 
                onChange={(e) => setEditForm(prev => ({ ...prev, name: e.target.value }))}
                placeholder="Customer name"
              />
            </div>
            <div className="space-y-2">
              <Label>Address</Label>
              <Input 
                value={editForm.address} 
                onChange={(e) => setEditForm(prev => ({ ...prev, address: e.target.value }))}
                placeholder="Customer address (optional)"
              />
            </div>
            <div className="space-y-2">
              <Label>Contact Number</Label>
              <Input 
                value={editForm.phone} 
                onChange={(e) => setEditForm(prev => ({ ...prev, phone: e.target.value }))}
                placeholder="Phone number (optional)"
              />
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setEditDialogOpen(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1" 
                onClick={handleEditSubmit} 
                disabled={isSubmitting || !editForm.name.trim()}
              >
                {isSubmitting ? "Saving..." : "Save"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Pay All Confirmation Dialog */}
      <Dialog open={payAllDialogOpen} onOpenChange={setPayAllDialogOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader><DialogTitle>Confirm Payment</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <div className="text-center space-y-2">
              <p className="text-lg">Pay all pending amount for</p>
              <p className="text-xl font-bold text-primary">{selectedCustomerData?.name}</p>
              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount</p>
                <p className="text-2xl font-bold text-green-600">₹{selectedCustomerData?.totalUnpaid.toFixed(2)}</p>
              </div>
              <p className="text-sm text-muted-foreground">This will mark all unpaid sales as paid.</p>
            </div>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                className="flex-1" 
                onClick={() => setPayAllDialogOpen(false)} 
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button 
                className="flex-1 bg-green-600 hover:bg-green-700" 
                onClick={handlePayAll} 
                disabled={isSubmitting}
              >
                {isSubmitting ? "Processing..." : "Confirm Payment"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const StatCard = ({ title, value, icon, color = "" }: any) => (
  <div className="bg-card p-3 md:p-4 rounded-lg border">
    <div className={`flex items-center gap-2 text-xs md:text-sm mb-1 text-muted-foreground ${color}`}>{icon} <span className="truncate">{title}</span></div>
    <div className={`text-lg md:text-2xl font-bold ${color}`}>{value}</div>
  </div>
);