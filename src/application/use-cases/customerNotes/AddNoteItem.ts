import { CustomerNoteRepository, CreateCustomerNoteItemInput } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { CustomerRepository } from "@/domain/repositories/CustomerRepository";
import { formatCurrency } from "@/lib/format";
import { CreditLimitExceededError } from "@/application/use-cases/customerNotes/CreateCustomerNote";

export class CustomerNoteItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerNoteItemValidationError";
  }
}

function validate(item: CreateCustomerNoteItemInput) {
  if (!item.product_id && !item.product_name?.trim()) {
    throw new CustomerNoteItemValidationError("Item avulso precisa de um nome.");
  }
  if (!item.quantity || item.quantity <= 0) {
    throw new CustomerNoteItemValidationError("A quantidade deve ser maior que zero.");
  }
  const price = parseFloat(item.unit_price);
  if (!Number.isFinite(price) || price < 0) {
    throw new CustomerNoteItemValidationError("Preço unitário inválido.");
  }
}

/** Adiciona um novo item a uma nota já existente — uma nova "compra" na mesma nota, com timestamp próprio. */
export class AddNoteItem {
  constructor(
    private customerNoteRepository: CustomerNoteRepository,
    private customerRepository: CustomerRepository
  ) {}

  async execute(
    noteId: number,
    item: CreateCustomerNoteItemInput,
    overrideLimit = false
  ): Promise<CustomerNoteWithItems> {
    validate(item);

    const note = await this.customerNoteRepository.findById(noteId);
    if (note) {
      const customer = await this.customerRepository.findById(note.customer_id);
      if (customer?.credit_limit) {
        const limit = parseFloat(customer.credit_limit);
        if (Number.isFinite(limit)) {
          const existingNotes = await this.customerNoteRepository.findAll({ customerId: note.customer_id });
          const openBalance = existingNotes
            .filter((n) => n.status !== "pago")
            .reduce((sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)), 0);
          const newAmount = item.quantity * parseFloat(item.unit_price);
          const projected = openBalance + newAmount;
          if (projected > limit && !overrideLimit) {
            throw new CreditLimitExceededError(
              `Esse cliente tem limite de crédito de ${formatCurrency(limit)} e já deve ${formatCurrency(
                openBalance
              )}. Esse item levaria o saldo a ${formatCurrency(projected)}, acima do limite.`
            );
          }
        }
      }
    }

    return this.customerNoteRepository.addItem(noteId, item);
  }
}
