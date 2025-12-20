export interface Category {
  id: string;
  name: string;
  icon: string;
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  image: string;
  categoryId: string;
  stock: number;
  unit: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'customer';
}
