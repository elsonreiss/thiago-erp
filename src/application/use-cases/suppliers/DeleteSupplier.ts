import { SupplierRepository } from "@/domain/repositories/SupplierRepository";

export class DeleteSupplier {
  constructor(private supplierRepository: SupplierRepository) {}

  execute(id: number): Promise<void> {
    return this.supplierRepository.delete(id);
  }
}
