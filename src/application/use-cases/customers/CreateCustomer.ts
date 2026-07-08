import { CustomerRepository, CreateCustomerInput } from "@/domain/repositories/CustomerRepository";
import { Customer } from "@/domain/entities/Customer";

export class CustomerValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "CustomerValidationError";
  }
}

export class CreateCustomer {
  constructor(private customerRepository: CustomerRepository) {}

  async execute(input: CreateCustomerInput): Promise<Customer> {
    if (!input.name?.trim()) throw new CustomerValidationError("Nome é obrigatório.");
    return this.customerRepository.create({ ...input, name: input.name.trim() });
  }
}
