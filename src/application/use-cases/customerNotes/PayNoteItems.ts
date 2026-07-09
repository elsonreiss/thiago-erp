import { CustomerNoteRepository } from "@/domain/repositories/CustomerNoteRepository";
import { SaleRepository } from "@/domain/repositories/SaleRepository";
import { PaymentMethod } from "@/domain/entities/Sale";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

export class CustomerNoteNotFoundError extends Error {
  constructor() {
    super("Nota não encontrada.");
    this.name = "CustomerNoteNotFoundError";
  }
}

export class PayNoteItemsValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PayNoteItemsValidationError";
  }
}

/**
 * Marca itens específicos de uma nota como pagos — pra quando o cliente
 * paga só parte da nota (alguns produtos, não todos). O valor pago é a soma
 * dos subtotais dos itens marcados. Assim como no pagamento por valor livre,
 * se isso quitar a nota inteira, uma venda de verdade é criada automaticamente
 * (sem baixar estoque de novo) e passa a contar no financeiro.
 */
export class PayNoteItems {
  constructor(
    private customerNoteRepository: CustomerNoteRepository,
    private saleRepository: SaleRepository
  ) {}

  async execute(
    noteId: number,
    input: { item_ids: number[]; payment_method: PaymentMethod }
  ): Promise<CustomerNoteWithItems> {
    if (!input.item_ids || input.item_ids.length === 0) {
      throw new PayNoteItemsValidationError("Selecione ao menos um item para marcar como pago.");
    }

    const existing = await this.customerNoteRepository.findById(noteId);
    if (!existing) throw new CustomerNoteNotFoundError();

    const updated = await this.customerNoteRepository.payItems(noteId, input.item_ids, input.payment_method);

    if (updated.status === "pago" && !updated.sale_id) {
      const sale = await this.saleRepository.create({
        customer_id: updated.customer_id,
        user_id: updated.user_id,
        payment_method: input.payment_method,
        discount: "0.00",
        notes: `Quitação da nota de cliente registrada em ${new Date().toLocaleDateString("pt-BR")}.`,
        items: updated.items.map((item) => ({
          product_id: item.product_id,
          product_name: item.product_id ? undefined : item.product_name,
          quantity: item.quantity,
          unit_price: item.unit_price,
        })),
        skipStockDecrement: true,
      });
      await this.customerNoteRepository.attachSale(noteId, sale.id);
      const withSale = await this.customerNoteRepository.findById(noteId);
      return withSale ?? updated;
    }

    return updated;
  }
}
