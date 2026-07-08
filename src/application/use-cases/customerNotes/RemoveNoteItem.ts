import { CustomerNoteRepository } from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";

/** Remove um item de uma nota, devolvendo a quantidade ao estoque e recalculando o total. */
export class RemoveNoteItem {
  constructor(private customerNoteRepository: CustomerNoteRepository) {}

  async execute(noteId: number, itemId: number): Promise<CustomerNoteWithItems> {
    return this.customerNoteRepository.removeItem(noteId, itemId);
  }
}
