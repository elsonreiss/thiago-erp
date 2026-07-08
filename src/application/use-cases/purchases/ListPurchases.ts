import { PurchaseRepository } from "@/domain/repositories/PurchaseRepository";
import { PurchaseWithItems } from "@/domain/entities/Purchase";

export class ListPurchases {
  constructor(private purchaseRepository: PurchaseRepository) {}

  execute(): Promise<PurchaseWithItems[]> {
    return this.purchaseRepository.findAll();
  }
}
