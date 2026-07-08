export type BudgetStatus = "pendente" | "aprovado" | "recusado" | "convertido" | "expirado";

export interface Budget {
  id: number;
  customer_id: number | null;
  user_id: number;
  discount: string;
  total: string;
  validity_date: string | null;
  status: BudgetStatus;
  notes: string | null;
  converted_sale_id: number | null;
  created_at: string;
}

export interface BudgetItem {
  id: number;
  budget_id: number;
  product_id: number;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface BudgetWithItems extends Budget {
  items: BudgetItem[];
  customer_name: string | null;
  seller_name: string;
}
