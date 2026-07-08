import { CustomerRepository } from "@/domain/repositories/CustomerRepository";

export class DeleteCustomer {
  constructor(private customerRepository: CustomerRepository) {}

  execute(id: number): Promise<void> {
    return this.customerRepository.delete(id);
  }
}
