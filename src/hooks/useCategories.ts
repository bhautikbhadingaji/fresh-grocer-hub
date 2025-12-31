import { useState, useEffect } from "react";
import { Category } from "@/types";
import { useToast } from "@/hooks/use-toast";

const API = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = () => {
    fetch(`${API}/api/categories`)
      .then(r => r.json())
      .then((data) => setCategories(data.map((c: any) => ({ ...c, id: c._id }))))
      .catch(() => {});
  };

  const createCategory = async (payload: any) => {
    const response = await fetch(`${API}/api/categories`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    setCategories([...categories, { ...res, id: res._id }]);
    toast({ title: "Category Added Successfully" });
    return res;
  };

  const updateCategory = async (categoryId: string, payload: any) => {
    const response = await fetch(`${API}/api/categories/${categoryId}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    const res = await response.json();
    setCategories(categories.map(c => (String(c.id) === String(res._id) ? { ...res, id: res._id } : c)));
    toast({ title: "Category Updated Successfully" });
    return res;
  };

  const deleteCategory = async (categoryId: string) => {
    await fetch(`${API}/api/categories/${categoryId}`, { method: "DELETE" });
    setCategories(categories.filter(c => String(c.id) !== String(categoryId)));
    toast({ title: "Category Deleted Successfully" });
  };

  return {
    categories,
    setCategories,
    createCategory,
    updateCategory,
    deleteCategory,
    fetchCategories
  };
};