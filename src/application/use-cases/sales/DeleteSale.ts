import { SaleRepository } from "@/domain/repositories/SaleRepository";

export class SaleNotFoundError extends Error {
  constructor() {
    super("Venda não encontrada.");
    this.name = "SaleNotFoundError";
  }
}

/** Exclui uma venda e devolve ao estoque a quantidade que havia sido baixada. Ação restrita a administradores. */
export class DeleteSale {
  constructor(private saleRepository: SaleRepository) {}

  async execute(id: number): Promise<void> {
    const existing = await this.saleRepository.findById(id);
    if (!existing) throw new SaleNotFoundError();
    await this.saleRepository.delete(id);
  }
}
