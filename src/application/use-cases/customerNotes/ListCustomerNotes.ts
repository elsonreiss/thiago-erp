import { CustomerNoteRepository, CustomerNoteFilters } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

export class ListCustomerNotes {
  constructor(private customerNoteRepository: CustomerNoteRepository) {}

  async execute(filters?: CustomerNoteFilters): Promise<CustomerNoteWithItems[]> {
    return this.customerNoteRepository.findAll(filters);
  }
}
