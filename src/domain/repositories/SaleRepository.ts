import { PaymentMethod, SaleWithItems } from "@/domain/entities/Sale";
import { PaginatedResult } from "@/lib/pagination";

export interface CreateSaleItemInput {
  /** Null quando é um item avulso (digitado na hora, sem produto cadastrado no estoque). */
  product_id: number | null;
  /** Obrigatório quando product_id é null — nome do item avulso. */
  product_name?: string;
  quantity: number;
  unit_price: string;
}

export interface CreateSaleInput {
  customer_id: number | null;
  user_id: number;
  payment_method: PaymentMethod;
  discount: string;
  notes: string | null;
  items: CreateSaleItemInput[];
  /** Quando true, não dá baixa no estoque (usado ao quitar uma nota de cliente, que já baixou o estoque na hora). */
  skipStockDecrement?: boolean;
}

export interface SaleFilters {
  from?: string;
  to?: string;
  userId?: number;
  customerId?: number;
}

export interface SaleRepository {
  findById(id: number): Promise<SaleWithItems | null>;
  findAll(filters?: SaleFilters): Promise<SaleWithItems[]>;
  findPage(filters: SaleFilters, page: number, pageSize: number): Promise<PaginatedResult<SaleWithItems>>;
  create(input: CreateSaleInput): Promise<SaleWithItems>;
  recent(limit: number): Promise<SaleWithItems[]>;
  totalRevenue(from: string, to: string, userId?: number): Promise<number>;
  countSalesToday(): Promise<number>;
  revenueByDay(from: string, to: string): Promise<Array<{ day: string; total: number }>>;
  revenueBySeller(from: string, to: string): Promise<Array<{ user_id: number; seller_name: string; total: number; count: number }>>;
  revenueByMonth(from: string, to: string): Promise<Array<{ month: string; total: number }>>;
  /** Total vendido em cada forma de pagamento num dia específico (pra conferência de caixa). */
  revenueByPaymentMethodForDay(
    date: string
  ): Promise<Array<{ payment_method: PaymentMethod; total: number; count: number }>>;
  delete(id: number): Promise<void>;
  /** Salva o número/chave da NFC-e emitida em outro sistema (referência, sem validação). */
  updateNfceNumber(id: number, nfceNumber: string | null): Promise<SaleWithItems | null>;
}
