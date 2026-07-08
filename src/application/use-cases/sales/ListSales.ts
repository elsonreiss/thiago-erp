import { SaleRepository, SaleFilters } from "@/domain/repositories/SaleRepository";
import { SaleWithItems } from "@/domain/entities/Sale";

export class ListSales {
  constructor(private saleRepository: SaleRepository) {}

  execute(filters?: SaleFilters): Promise<SaleWithItems[]> {
    return this.saleRepository.findAll(filters);
  }
}
