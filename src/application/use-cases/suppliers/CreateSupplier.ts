import { SupplierRepository, CreateSupplierInput } from "@/domain/repositories/SupplierRepository";
import { Supplier } from "@/domain/entities/Supplier";

export class SupplierValidationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "SupplierValidationError";
  }
}

export class CreateSupplier {
  constructor(private supplierRepository: SupplierRepository) {}

  async execute(input: CreateSupplierInput): Promise<Supplier> {
    if (!input.name?.trim()) throw new SupplierValidationError("Nome/razão social é obrigatório.");
    return this.supplierRepository.create({ ...input, name: input.name.trim() });
  }
}
