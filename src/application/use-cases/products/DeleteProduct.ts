import { ProductRepository } from "@/domain/repositories/ProductRepository";

export class DeleteProduct {
  constructor(private productRepository: ProductRepository) {}

  async execute(id: number): Promise<void> {
    await this.productRepository.delete(id);
  }
}
