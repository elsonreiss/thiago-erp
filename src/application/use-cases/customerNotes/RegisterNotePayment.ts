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

/**
 * Registra um pagamento (total ou parcial) numa nota de cliente.
 * O dinheiro só entra no financeiro quando a nota fica totalmente quitada: nesse
 * momento uma venda de verdade é criada (sem baixar estoque de novo, pois a
 * nota já tirou os itens do estoque no lançamento) e passa a aparecer em
 * Vendas/Financeiro/Relatórios/Dashboard normalmente.
 */
export class RegisterNotePayment {
  constructor(
    private customerNoteRepository: CustomerNoteRepository,
    private saleRepository: SaleRepository
  ) {}

  async execute(
    noteId: number,
    input: { amount: string; payment_method: PaymentMethod }
  ): Promise<CustomerNoteWithItems> {
    const existing = await this.customerNoteRepository.findById(noteId);
    if (!existing) throw new CustomerNoteNotFoundError();

    const updated = await this.customerNoteRepository.registerPayment(noteId, input.amount, input.payment_method);

    if (updated.status === "pago" && !updated.sale_id) {
      const sale = await this.saleRepository.create({
        customer_id: updated.customer_id,
        user_id: updated.user_id,
        payment_method: input.payment_method,
        discount: "0.00",
        notes: `Quitação da nota de cliente registrada em ${new Date().toLocaleDateString("pt-BR")}.`,
        items: updated.items.map((item) => ({
          product_id: item.product_id!,
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
