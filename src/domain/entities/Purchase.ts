export interface Purchase {
  id: number;
  supplier_id: number | null;
  user_id: number;
  total: string;
  notes: string | null;
  created_at: string;
}

export interface PurchaseItem {
  id: number;
  purchase_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface PurchaseWithItems extends Purchase {
  items: PurchaseItem[];
  supplier_name: string | null;
}
