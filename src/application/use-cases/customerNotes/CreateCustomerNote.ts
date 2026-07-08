import { CustomerNoteRepository, CreateCustomerNoteInput } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

export class CustomerNoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerNoteValidationError";
  }
}

function validate(input: CreateCustomerNoteInput) {
  if (!input.customer_id) {
    throw new CustomerNoteValidationError("Selecione o cliente da nota.");
  }
  if (!input.items || input.items.length === 0) {
    throw new CustomerNoteValidationError("Adicione ao menos um item à nota.");
  }
  for (const item of input.items) {
    if (!item.product_id) throw new CustomerNoteValidationError("Item inválido: produto não informado.");
    if (!item.quantity || item.quantity <= 0) {
      throw new CustomerNoteValidationError("A quantidade de cada item deve ser maior que zero.");
    }
    const price = parseFloat(item.unit_price);
    if (!Number.isFinite(price) || price < 0) {
      throw new CustomerNoteValidationError("Preço unitário inválido em um dos itens.");
    }
  }
}

export class CreateCustomerNote {
  constructor(private customerNoteRepository: CustomerNoteRepository) {}

  async execute(input: CreateCustomerNoteInput): Promise<CustomerNoteWithItems> {
    validate(input);
    return this.customerNoteRepository.create(input);
  }
}
