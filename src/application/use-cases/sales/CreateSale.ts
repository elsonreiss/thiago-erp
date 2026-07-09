import { SaleRepository, CreateSaleInput } from "@/domain/repositories/SaleRepository";
import { SaleWithItems } from "@/domain/entities/Sale";

export class SaleValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SaleValidationError";
  }
}

function validate(input: CreateSaleInput) {
  if (!input.items || input.items.length === 0) {
    throw new SaleValidationError("Adicione ao menos um item à venda.");
  }
  for (const item of input.items) {
    if (!item.product_id && !item.product_name?.trim()) {
      throw new SaleValidationError("Item avulso precisa de um nome.");
    }
    if (!item.quantity || item.quantity <= 0) {
      throw new SaleValidationError("A quantidade de cada item deve ser maior que zero.");
    }
    const price = parseFloat(item.unit_price);
    if (!Number.isFinite(price) || price < 0) {
      throw new SaleValidationError("Preço unitário inválido em um dos itens.");
    }
  }
  const discount = parseFloat(input.discount || "0");
  if (!Number.isFinite(discount) || discount < 0) {
    throw new SaleValidationError("Desconto inválido.");
  }
}

export class CreateSale {
  constructor(private saleRepository: SaleRepository) {}

  async execute(input: CreateSaleInput): Promise<SaleWithItems> {
    validate(input);
    return this.saleRepository.create(input);
  }
}
