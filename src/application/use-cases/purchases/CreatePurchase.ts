import { PurchaseRepository, CreatePurchaseInput } from "@/domain/repositories/PurchaseRepository";
import { PurchaseWithItems } from "@/domain/entities/Purchase";

export class PurchaseValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PurchaseValidationError";
  }
}

function validate(input: CreatePurchaseInput) {
  if (!input.items || input.items.length === 0) {
    throw new PurchaseValidationError("Adicione ao menos um item à compra.");
  }
  for (const item of input.items) {
    if (!item.product_id) throw new PurchaseValidationError("Item inválido: produto não informado.");
    if (!item.quantity || item.quantity <= 0) {
      throw new PurchaseValidationError("A quantidade de cada item deve ser maior que zero.");
    }
    const price = parseFloat(item.unit_price);
    if (!Number.isFinite(price) || price < 0) {
      throw new PurchaseValidationError("Preço unitário inválido em um dos itens.");
    }
  }
}

export class CreatePurchase {
  constructor(private purchaseRepository: PurchaseRepository) {}

  async execute(input: CreatePurchaseInput): Promise<PurchaseWithItems> {
    validate(input);
    return this.purchaseRepository.create(input);
  }
}
