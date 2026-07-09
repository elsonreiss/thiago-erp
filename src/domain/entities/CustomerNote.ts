import { PaymentMethod } from "@/domain/entities/Sale";

export type CustomerNoteStatus = "aberto" | "parcial" | "pago";

export interface CustomerNote {
  id: number;
  customer_id: number;
  user_id: number;
  description: string | null;
  total: string;
  paid_amount: string;
  status: CustomerNoteStatus;
  sale_id: number | null;
  created_at: string;
  paid_at: string | null;
}

export interface CustomerNoteItem {
  id: number;
  note_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
  paid: boolean;
  created_at: string;
}

export interface CustomerNotePayment {
  id: number;
  note_id: number;
  amount: string;
  payment_method: PaymentMethod;
  created_at: string;
}

export interface CustomerNoteWithItems extends CustomerNote {
  items: CustomerNoteItem[];
  payments: CustomerNotePayment[];
  customer_name: string;
  seller_name: string;
}
