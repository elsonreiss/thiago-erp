import { ProductRepository, UpdateProductInput } from "@/domain/repositories/ProductRepository";
import { Product } from "@/domain/entities/Product";
import { DuplicateProductCodeError, ProductValidationError } from "@/application/use-cases/products/CreateProduct";

export class ProductNotFoundError extends Error {
  constructor() {
    super("Produto não encontrado.");
    this.name = "ProductNotFoundError";
  }
}

export class UpdateProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(id: number, input: UpdateProductInput): Promise<Product> {
    if (input.min_stock !== undefined && input.min_stock < 0) {
      throw new ProductValidationError("Estoque mínimo não pode ser negativo.");
    }
    if (input.quantity !== undefined && input.quantity < 0) {
      throw new ProductValidationError("Quantidade não pode ser negativa.");
    }

    if (input.code) {
      const existing = await this.productRepository.findByCode(input.code.trim());
      if (existing && existing.id !== id) throw new DuplicateProductCodeError();
      input.code = input.code.trim();
    }

    const updated = await this.productRepository.update(id, input);
    if (!updated) throw new ProductNotFoundError();
    return updated;
  }
}
