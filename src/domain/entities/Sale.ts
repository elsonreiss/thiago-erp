export type PaymentMethod =
  | "dinheiro"
  | "pix"
  | "cartao_debito"
  | "cartao_credito"
  | "boleto"
  | "fiado";

export interface Sale {
  id: number;
  customer_id: number | null;
  user_id: number;
  payment_method: PaymentMethod;
  discount: string;
  total: string;
  notes: string | null;
  /** Número/chave da NFC-e emitida no sistema fiscal externo (referência opcional, sem validação). */
  nfce_number: string | null;
  created_at: string;
}

export interface SaleItem {
  id: number;
  sale_id: number;
  product_id: number | null;
  product_name: string;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface SaleWithItems extends Sale {
  items: SaleItem[];
  customer_name: string | null;
  seller_name: string;
}
