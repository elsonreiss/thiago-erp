import { SaleRepository } from "@/domain/repositories/SaleRepository";
import { SaleWithItems } from "@/domain/entities/Sale";

export class GetSale {
  constructor(private saleRepository: SaleRepository) {}

  execute(id: number): Promise<SaleWithItems | null> {
    return this.saleRepository.findById(id);
  }
}
