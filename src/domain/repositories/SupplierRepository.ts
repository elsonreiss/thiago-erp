import { Supplier } from "@/domain/entities/Supplier";

export type CreateSupplierInput = Omit<Supplier, "id" | "created_at" | "updated_at" | "active">;
export type UpdateSupplierInput = Partial<CreateSupplierInput> & { active?: boolean };

export interface SupplierRepository {
  findById(id: number): Promise<Supplier | null>;
  findAll(search?: string): Promise<Supplier[]>;
  searchForAutocomplete(query: string, limit?: number): Promise<Supplier[]>;
  create(input: CreateSupplierInput): Promise<Supplier>;
  update(id: number, input: UpdateSupplierInput): Promise<Supplier | null>;
  delete(id: number): Promise<void>;
}
