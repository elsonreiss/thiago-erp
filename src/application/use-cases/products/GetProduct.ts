import { ProductRepository } from "@/domain/repositories/ProductRepository";
import { Product } from "@/domain/entities/Product";

export class GetProduct {
  constructor(private productRepository: ProductRepository) {}

  execute(id: number): Promise<Product | null> {
    return this.productRepository.findById(id);
  }
}
