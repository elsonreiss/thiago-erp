import { CustomerRepository, UpdateCustomerInput } from "@/domain/repositories/CustomerRepository";
import { Customer } from "@/domain/entities/Customer";
import { CustomerValidationError } from "@/application/use-cases/customers/CreateCustomer";

export class CustomerNotFoundError extends Error {
  constructor() {
    super("Cliente não encontrado.");
    this.name = "CustomerNotFoundError";
  }
}

export class UpdateCustomer {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(id: number, input: UpdateCustomerInput): Promise<Customer> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new CustomerValidationError("Nome é obrigatório.");
    }
    const updated = await this.customerRepository.update(id, input);
    if (!updated) throw new CustomerNotFoundError();
    return updated;
  }
}
