import { ProductRepository, CreateProductInput } from "@/domain/repositories/ProductRepository";
import { Product } from "@/domain/entities/Product";

export class ProductValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ProductValidationError";
  }
}

export class DuplicateProductCodeError extends Error {
  constructor() {
    super("Já existe um produto cadastrado com esse código.");
    this.name = "DuplicateProductCodeError";
  }
}

function validate(input: CreateProductInput) {
  if (!input.code?.trim()) throw new ProductValidationError("Código é obrigatório.");
  if (!input.name?.trim()) throw new ProductValidationError("Nome é obrigatório.");
  if (!input.category?.trim()) throw new ProductValidationError("Categoria é obrigatória.");
  if (!input.unit?.trim()) throw new ProductValidationError("Unidade é obrigatória.");
  if (input.min_stock < 0) throw new ProductValidationError("Estoque mínimo não pode ser negativo.");
  if (input.quantity < 0) throw new ProductValidationError("Quantidade não pode ser negativa.");
}

export class CreateProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(input: CreateProductInput): Promise<Product> {
    validate(input);

    const existing = await this.productRepository.findByCode(input.code.trim());
    if (existing) throw new DuplicateProductCodeError();

    return this.productRepository.create({ ...input, code: input.code.trim() });
  }
}
