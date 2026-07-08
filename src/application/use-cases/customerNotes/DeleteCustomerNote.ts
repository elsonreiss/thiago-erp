import { CustomerNoteRepository } from "@/domain/repositories/CustomerNoteRepository";

export class CustomerNoteNotFoundError extends Error {
  constructor() {
    super("Nota não encontrada.");
    this.name = "CustomerNoteNotFoundError";
  }
}

export class CustomerNoteAlreadyPaidError extends Error {
  constructor() {
    super("Esta nota já foi quitada e virou uma venda — exclua a venda em Vendas se precisar desfazer.");
    this.name = "CustomerNoteAlreadyPaidError";
  }
}

export class DeleteCustomerNote {
  constructor(private customerNoteRepository: CustomerNoteRepository) {}

  async execute(id: number): Promise<void> {
    const note = await this.customerNoteRepository.findById(id);
    if (!note) throw new CustomerNoteNotFoundError();
    if (note.status === "pago") throw new CustomerNoteAlreadyPaidError();
    await this.customerNoteRepository.delete(id);
  }
}
