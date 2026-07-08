import { Customer } from "@/domain/entities/Customer";

export type CreateCustomerInput = Omit<Customer, "id" | "created_at" | "updated_at" | "active">;
export type UpdateCustomerInput = Partial<CreateCustomerInput> & { active?: boolean };

export interface CustomerRepository {
  findById(id: number): Promise<Customer | null>;
  findAll(search?: string): Promise<Customer[]>;
  searchForAutocomplete(query: string, limit?: number): Promise<Customer[]>;
  create(input: CreateCustomerInput): Promise<Customer>;
  update(id: number, input: UpdateCustomerInput): Promise<Customer | null>;
  delete(id: number): Promise<void>;
  topBuyers(limit: number, since?: string): Promise<Array<{ customer: Customer; total_spent: number }>>;
}
