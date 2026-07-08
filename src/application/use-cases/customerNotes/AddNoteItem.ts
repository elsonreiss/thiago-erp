import { CustomerNoteRepository, CreateCustomerNoteItemInput } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

export class CustomerNoteItemValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerNoteItemValidationError";
  }
}

function validate(item: CreateCustomerNoteItemInput) {
  if (!item.product_id) throw new CustomerNoteItemValidationError("Produto não informado.");
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
  constructor(private customerNoteRepository: CustomerNoteRepository) {}

  async execute(noteId: number, item: CreateCustomerNoteItemInput): Promise<CustomerNoteWithItems> {
    validate(item);
    return this.customerNoteRepository.addItem(noteId, item);
  }
}
