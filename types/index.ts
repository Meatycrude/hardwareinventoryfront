export interface User {
  id: number;
  name: string;
  email: string;
  role: "admin" | "cashier" | "storekeeper";
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Supplier {
  id: number;
  name: string;
  phone: string;
  email: string;
  address?: string;
}

export interface Product {
  id: number;
  category_id: number;
  supplier_id: number;
  name: string;
  sku: string;
  brand?: string;
  unit: string;
  buying_price: number;
  selling_price: number;
  stock_quantity: number;
  minimum_stock: number;
  description?: string;
  category?: Category;
  supplier?: Supplier;
}

export interface StockMovement {
  id: number;
  product_id: number;
  type: "purchase" | "sale" | "adjustment" | "damage";
  quantity: number;
  reference?: string;
  notes?: string;
  created_at: string;
}

export interface SaleItem {
  id?: number;
  product_id: number;
  quantity: number;
  unit_price: number;
  subtotal: number;
  product?: Product;
}

export interface Sale {
  id: number;
  invoice_number: string;
  total_amount: number;
  payment_method: string;
  sale_items: SaleItem[];
  created_at: string;
}
