// types/admin.ts

export interface Product {
  id: string;
  _id?: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  categoryId: string;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface Category {
  id: string;
  _id?: string;
  name: string;
  description?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface SaleRecord {
  _id: string;
  productId: Product | string;
  quantity: number;
  unitPrice: number;
  total: number;
  customerName?: string;
  paymentStatus: 'paid' | 'unpaid' | 'partial';
  totalPaid?: number;
  totalUnpaid?: number;
  createdAt: string;
  updatedAt?: string;
}

export interface GroupedSales {
  [date: string]: {
    items: SaleRecord[];
    totalRevenue: number;
    totalQty: number;
  };
}

export interface Payment {
  _id: string;
  saleId: string;
  customerId: string;
  amountPaid: number;
  paymentMethod: 'cash' | 'card' | 'upi' | 'other';
  paymentDate: string;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
}