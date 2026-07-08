import { PurchaseRepository } from "@/domain/repositories/PurchaseRepository";
import { PurchaseWithItems } from "@/domain/entities/Purchase";

export class GetPurchase {
  constructor(private purchaseRepository: PurchaseRepository) {}

  execute(id: number): Promise<PurchaseWithItems | null> {
    return this.purchaseRepository.findById(id);
  }
}
