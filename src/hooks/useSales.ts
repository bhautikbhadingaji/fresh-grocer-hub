import { useState, useEffect } from "react";
import { SaleRecord, GroupedSales } from "@/types/admin";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useSales = () => {
  const [salesHistory, setSalesHistory] = useState<SaleRecord[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchSales();
  }, []);

  const fetchSales = async () => {
    try {
      const response = await fetch(`${API}/api/sales`);
      const data = await response.json();
      setSalesHistory(data);
      console.log('Sales refreshed:', data.length);
    } catch (err) {
      console.error('Failed to fetch sales:', err);
    }
  };

  const createSale = async (payload: any) => {
    const response = await fetch(`${API}/api/sales`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    
    if (response.ok) {
      toast({ title: "Sale Recorded Successfully" });
      fetchSales();
      return data;
    } else {
      toast({ title: "Error", description: data.message, variant: "destructive" });
      throw new Error(data.message);
    }
  };

  const updateSale = async (saleId: string, payload: any) => {
    const response = await fetch(`${API}/api/sales/${saleId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const data = await response.json();
    
    if (response.ok) {
      toast({ title: "Sale Updated Successfully" });
      fetchSales();
      return data;
    } else {
      toast({ title: "Error", description: data.message, variant: "destructive" });
      throw new Error(data.message);
    }
  };

  const deleteSale = async (saleId: string) => {
    const response = await fetch(`${API}/api/sales/${saleId}`, { method: "DELETE" });
    const res = await response.json();
    setSalesHistory(salesHistory.filter(s => s._id !== saleId));
    toast({ title: "Sale Deleted Successfully" });
    return res;
  };

  const recordPayment = async (saleId: string, amountPaid: number) => {
    const response = await fetch(`${API}/api/customers/payment`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ saleId, amountPaid, paymentMethod: 'cash' })
    });
    
    if (!response.ok) {
      const data = await response.json();
      throw new Error(data.message || 'Payment failed');
    }
    
    const data = await response.json();
    toast({ title: "Payment Recorded Successfully" });
    
    // Force refresh sales data
    await fetchSales();
    
    return data;
  };

  const groupSalesByDate = (): GroupedSales => {
    return salesHistory.reduce((groups: any, sale) => {
      const date = new Date(sale.createdAt).toLocaleDateString('en-GB');
      if (!groups[date]) groups[date] = { items: [], totalRevenue: 0, totalQty: 0 };
      groups[date].items.push(sale);
      groups[date].totalRevenue += sale.total;
      groups[date].totalQty += sale.quantity;
      return groups;
    }, {});
  };

  return {
    salesHistory,
    setSalesHistory,
    createSale,
    updateSale,
    deleteSale,
    recordPayment,
    fetchSales,
    groupSalesByDate
  };
};