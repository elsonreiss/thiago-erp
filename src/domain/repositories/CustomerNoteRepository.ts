import { PaymentMethod } from "@/domain/entities/Sale";
import { CustomerNoteStatus, CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

export interface CreateCustomerNoteItemInput {
  product_id: number;
  quantity: number;
  unit_price: string;
}

export interface CreateCustomerNoteInput {
  customer_id: number;
  user_id: number;
  description: string | null;
  items: CreateCustomerNoteItemInput[];
}

export interface CustomerNoteFilters {
  customerId?: number;
  status?: CustomerNoteStatus;
}

export interface OpenBalanceRow {
  customer_id: number;
  customer_name: string;
  balance: number;
  notes_count: number;
}

export interface CustomerNoteRepository {
  findById(id: number): Promise<CustomerNoteWithItems | null>;
  findAll(filters?: CustomerNoteFilters): Promise<CustomerNoteWithItems[]>;
  create(input: CreateCustomerNoteInput): Promise<CustomerNoteWithItems>;
  /** Adiciona um item a uma nota já existente (nova compra na mesma nota), com baixa de estoque e timestamp próprio. */
  addItem(noteId: number, item: CreateCustomerNoteItemInput): Promise<CustomerNoteWithItems>;
  /** Remove um item da nota, devolvendo a quantidade ao estoque e recalculando o total. */
  removeItem(noteId: number, itemId: number): Promise<CustomerNoteWithItems>;
  /** Registra um pagamento (total ou parcial). Atualiza paid_amount/status/paid_at. */
  registerPayment(id: number, amount: string, paymentMethod: PaymentMethod): Promise<CustomerNoteWithItems>;
  /** Vincula a venda gerada quando a nota é quitada (dinheiro só entra no financeiro aqui). */
  attachSale(id: number, saleId: number): Promise<void>;
  delete(id: number): Promise<void>;
  /** Saldo em aberto (aberto + parcial) agrupado por cliente. */
  openBalanceByCustomer(): Promise<OpenBalanceRow[]>;
}
