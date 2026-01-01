import { Product } from "@/types";

export interface SaleRecord {
  _id: string;
  productId: Product;
  quantity: number;
  unitPrice: number;
  total: number;
  customerName?: string;
  paymentStatus: 'paid' | 'unpaid';
  createdAt: string;
}

export interface ProductFormData {
  name: string;
  description: string;
  price: string;
  image: string;
  categoryId: string;
  stock: string;
  unit: string;
  expiryDate: string;
  batchNo: string;
}

export interface CategoryFormData {
  name: string;
  icon: string;
}

export interface GroupedSales {
  [date: string]: {
    items: SaleRecord[];
    totalRevenue: number;
    totalQty: number;
  };
}