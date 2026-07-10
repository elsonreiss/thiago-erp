import { CustomerNoteRepository, CreateCustomerNoteInput } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { CustomerRepository } from "@/domain/repositories/CustomerRepository";
import { formatCurrency } from "@/lib/format";

export class CustomerNoteValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerNoteValidationError";
  }
}

/** Erro específico de limite de crédito — o front-end pode oferecer "continuar mesmo assim". */
export class CreditLimitExceededError extends CustomerNoteValidationError {
  constructor(message: string) {
    super(message);
    this.name = "CreditLimitExceededError";
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
    if (!item.product_id && !item.product_name?.trim()) {
      throw new CustomerNoteValidationError("Item avulso precisa de um nome.");
    }
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
  constructor(
    private customerNoteRepository: CustomerNoteRepository,
    private customerRepository: CustomerRepository
  ) {}

  async execute(input: CreateCustomerNoteInput, overrideLimit = false): Promise<CustomerNoteWithItems> {
    validate(input);

    const customer = await this.customerRepository.findById(input.customer_id);
    if (customer?.credit_limit) {
      const limit = parseFloat(customer.credit_limit);
      if (Number.isFinite(limit)) {
        const existingNotes = await this.customerNoteRepository.findAll({ customerId: input.customer_id });
        const openBalance = existingNotes
          .filter((n) => n.status !== "pago")
          .reduce((sum, n) => sum + Math.max(0, parseFloat(n.total) - parseFloat(n.paid_amount)), 0);
        const newAmount = input.items.reduce(
          (sum, item) => sum + item.quantity * parseFloat(item.unit_price),
          0
        );
        const projected = openBalance + newAmount;
        if (projected > limit && !overrideLimit) {
          throw new CreditLimitExceededError(
            `Esse cliente tem limite de crédito de ${formatCurrency(limit)} e já deve ${formatCurrency(
              openBalance
            )}. Essa nota levaria o saldo a ${formatCurrency(projected)}, acima do limite.`
          );
        }
      }
    }

    return this.customerNoteRepository.create(input);
  }
}
