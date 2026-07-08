import { ProductRepository, ProductFilters } from "@/domain/repositories/ProductRepository";
import { Product } from "@/domain/entities/Product";

export class ListProducts {
  constructor(private productRepository: ProductRepository) {}

  execute(filters?: ProductFilters): Promise<Product[]> {
    return this.productRepository.findAll(filters);
  }
}
