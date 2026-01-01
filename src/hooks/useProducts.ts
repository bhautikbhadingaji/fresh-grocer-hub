import { useState, useEffect } from "react";
import { Product } from "@/types";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [tempStocks, setTempStocks] = useState<{ [key: string]: number }>({});
  const { toast } = useToast();

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = () => {
    fetch(`${API}/api/products`)
      .then(r => r.json())
      .then((data) => {
        const mapped = data.map((p: any) => ({ ...p, id: p._id }));
        setProducts(mapped);
        const initialStocks: any = {};
        mapped.forEach((p: any) => initialStocks[p.id] = p.stock);
        setTempStocks(initialStocks);
      })
      .catch(() => {});
  };

  const createProduct = async (payload: any) => {
    console.log('Creating product with payload:', payload);
    
    const response = await fetch(`${API}/api/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error creating product:', errorData);
      toast({ 
        title: "Error", 
        description: errorData.message || errorData.error || "Failed to create product", 
        variant: "destructive" 
      });
      throw new Error(errorData.message || "Failed to create product");
    }
    
    const res = await response.json();
    setProducts([...products, { ...res, id: res._id }]);
    setTempStocks(prev => ({ ...prev, [res._id]: res.stock }));
    toast({ title: "Product Added Successfully" });
    return res;
  };

  const updateProduct = async (productId: string, payload: any) => {
    const response = await fetch(`${API}/api/products/${productId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Error updating product:', errorData);
      toast({ 
        title: "Error", 
        description: errorData.message || "Failed to update product", 
        variant: "destructive" 
      });
      throw new Error(errorData.message || "Failed to update product");
    }
    
    const res = await response.json();
    setProducts(products.map(p => (String(p.id) === String(res._id) ? { ...res, id: res._id } : p)));
    setTempStocks(prev => ({ ...prev, [res._id]: res.stock }));
    toast({ title: "Product Updated Successfully" });
    return res;
  };

  const deleteProduct = async (productId: string) => {
    await fetch(`${API}/api/products/${productId}`, { method: "DELETE" });
    setProducts(products.filter(p => String(p.id) !== String(productId)));
    toast({ title: "Product Deleted Successfully" });
  };

  const updateStock = async (productId: string, newStock: number) => {
    const finalStock = Math.max(0, newStock);
    const existing = products.find(p => String(p.id) === String(productId));
    const delta = finalStock - (existing?.stock || 0);
    if (delta === 0) return;

    const response = await fetch(`${API}/api/products/${productId}/stock`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ delta })
    });
    const updated = await response.json();
    setProducts(products.map(p => (String(p.id) === String(updated._id) ? { ...updated, id: updated._id } : p)));
    setTempStocks(prev => ({ ...prev, [productId]: updated.stock }));
    toast({ title: "Stock Updated" });
  };

  return {
    products,
    setProducts,
    tempStocks,
    setTempStocks,
    createProduct,
    updateProduct,
    deleteProduct,
    updateStock,
    fetchProducts
  };
};