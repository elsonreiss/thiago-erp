import { SupplierRepository, UpdateSupplierInput } from "@/domain/repositories/SupplierRepository";
import { Supplier } from "@/domain/entities/Supplier";
import { SupplierValidationError } from "@/application/use-cases/suppliers/CreateSupplier";

export class SupplierNotFoundError extends Error {
  constructor() {
    super("Fornecedor não encontrado.");
    this.name = "SupplierNotFoundError";
  }
}

export class UpdateSupplier {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(id: number, input: UpdateSupplierInput): Promise<Supplier> {
    if (input.name !== undefined && !input.name.trim()) {
      throw new SupplierValidationError("Nome/razão social é obrigatório.");
    }
    const updated = await this.supplierRepository.update(id, input);
    if (!updated) throw new SupplierNotFoundError();
    return updated;
  }
}
