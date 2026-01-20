import { useState, useEffect, useCallback } from 'react';

// ખાતરી કરો કે તમારો API URL સાચો છે
const API_BASE = 'http://localhost:5000/api';

interface Customer {
  _id?: string;
  name: string;
  phone?: string;
  email?: string;
  address?: string;
  totalPurchases: number;
  totalPaid: number;
  totalUnpaid: number;
  salesCount: number;
  lastPurchaseDate?: string;
  sales?: any[];
}

interface CustomerSummary {
  totalCustomers: number;
  totalRevenue: number;
  totalPaid: number;
  totalUnpaid: number;
  customersWithUnpaid: number;
}

export const useCustomers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [summary, setSummary] = useState<CustomerSummary | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // ૧. ગ્રાહકોની યાદી મેળવવા માટે
  const fetchCustomers = useCallback(async (search?: string) => {
    setLoading(true);
    setError(null);
    try {
      const url = search 
        ? `${API_BASE}/customers?search=${encodeURIComponent(search)}` 
        : `${API_BASE}/customers`;
      
      const response = await fetch(url);
      if (!response.ok) throw new Error('Failed to fetch customers');
      
      const data = await response.json();
      setCustomers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch customers');
    } finally {
      setLoading(false);
    }
  }, []);

  // ૨. સમરી મેળવવા માટે
  const fetchSummary = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE}/customers/summary`);
      if (!response.ok) throw new Error('Failed to fetch summary');
      
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error('Summary fetch error:', err);
    }
  }, []);

  // ૩. પેમેન્ટ રેકોર્ડ કરવા માટે (Final Fix)
  const recordPayment = async (saleId: string, amountPaid: number) => {
    setLoading(true);
    setError(null);
    try {
      // API call to record payment
      const response = await fetch(`${API_BASE}/customers/payment`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          saleId, 
          amountPaid: Number(amountPaid), // ખાતરી કરો કે આ નંબર છે
          paymentMethod: 'cash' 
        })
      });
      
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to record payment');
      }
      
      // પેમેન્ટ સફળ થયા પછી ડેટા રી-ફેચ કરવો જેથી UI અપડેટ થાય
      // આ બંને ફંક્શન કોલ કરવાથી આખા પેજમાં નવી વેલ્યુ આવી જશે
      await Promise.all([
        fetchCustomers(),
        fetchSummary()
      ]);
      
      return data;
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Failed to record payment';
      setError(msg);
      throw new Error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ૪. ગ્રાહકની વિગતવાર હિસ્ટ્રી (Specific Customer Details)
  const getCustomerDetails = async (name: string) => {
    setLoading(true);
    try {
      const response = await fetch(`${API_BASE}/customers/${encodeURIComponent(name)}`);
      if (!response.ok) throw new Error('Failed to fetch customer details');
      return await response.json();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed');
      return null;
    } finally {
      setLoading(false);
    }
  };

  // ૫. initial load
  useEffect(() => {
    fetchCustomers();
    fetchSummary();
  }, [fetchCustomers, fetchSummary]);

  return {
    customers,
    summary,
    loading,
    error,
    fetchCustomers,
    fetchSummary,
    getCustomerDetails,
    recordPayment
  };
};