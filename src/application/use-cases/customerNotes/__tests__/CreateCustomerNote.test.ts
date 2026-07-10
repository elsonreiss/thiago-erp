import { describe, expect, it } from "vitest";
import {
  CreateCustomerNote,
  CustomerNoteValidationError,
  CreditLimitExceededError,
} from "@/application/use-cases/customerNotes/CreateCustomerNote";
import {
  CustomerNoteRepository,
  CreateCustomerNoteInput,
  CustomerNoteFilters,
  OpenBalanceRow,
} from "@/domain/repositories/CustomerNoteRepository";
import { CustomerNoteWithItems } from "@/domain/entities/CustomerNote";
import { CustomerRepository } from "@/domain/repositories/CustomerRepository";
import { Customer } from "@/domain/entities/Customer";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

/** Repositórios falsos em memória, só pra testar a lógica de validação e limite de crédito sem banco. */
class FakeCustomerNoteRepository implements CustomerNoteRepository {
  public existingNotes: CustomerNoteWithItems[] = [];
  public created: CreateCustomerNoteInput[] = [];

  async findById(): Promise<CustomerNoteWithItems | null> {
    return null;
  }
  async findAll(): Promise<CustomerNoteWithItems[]> {
    return this.existingNotes;
  }
  async findPage(_f: CustomerNoteFilters, page: number, pageSize: number): Promise<PaginatedResult<CustomerNoteWithItems>> {
    return buildPaginatedResult([], 0, page, pageSize);
  }
  async create(input: CreateCustomerNoteInput): Promise<CustomerNoteWithItems> {
    this.created.push(input);
    return {
      id: 1,
      customer_id: input.customer_id,
      user_id: input.user_id,
      description: input.description,
      total: "0.00",
      paid_amount: "0.00",
      status: "aberto",
      sale_id: null,
      due_date: input.due_date,
      created_at: new Date().toISOString(),
      paid_at: null,
      items: [],
      payments: [],
      customer_name: "Cliente Teste",
      seller_name: "Vendedor Teste",
    };
  }
  async addItem(): Promise<CustomerNoteWithItems> {
    throw new Error("not implemented in fake");
  }
  async removeItem(): Promise<CustomerNoteWithItems> {
    throw new Error("not implemented in fake");
  }
  async registerPayment(): Promise<CustomerNoteWithItems> {
    throw new Error("not implemented in fake");
  }
  async payItems(): Promise<CustomerNoteWithItems> {
    throw new Error("not implemented in fake");
  }
  async attachSale(): Promise<void> {}
  async delete(): Promise<void> {}
  async openBalanceByCustomer(): Promise<OpenBalanceRow[]> {
    return [];
  }
}

class FakeCustomerRepository implements CustomerRepository {
  constructor(private customer: Customer | null) {}

  async findById(): Promise<Customer | null> {
    return this.customer;
  }
  async findAll(): Promise<Customer[]> {
    return this.customer ? [this.customer] : [];
  }
  async searchForAutocomplete(): Promise<Customer[]> {
    return [];
  }
  async create(): Promise<Customer> {
    throw new Error("not implemented in fake");
  }
  async update(): Promise<Customer | null> {
    return this.customer;
  }
  async delete(): Promise<void> {}
  async topBuyers(): Promise<Array<{ customer: Customer; total_spent: number }>> {
    return [];
  }
}

function makeCustomer(overrides: Partial<Customer> = {}): Customer {
  return {
    id: 1,
    name: "Cliente Teste",
    document: null,
    phone: null,
    whatsapp: null,
    email: null,
    address: null,
    city: null,
    state: null,
    notes: null,
    credit_limit: null,
    active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
    ...overrides,
  };
}

function makeNote(overrides: Partial<CustomerNoteWithItems> = {}): CustomerNoteWithItems {
  return {
    id: 1,
    customer_id: 1,
    user_id: 1,
    description: null,
    total: "100.00",
    paid_amount: "0.00",
    status: "aberto",
    sale_id: null,
    due_date: null,
    created_at: new Date().toISOString(),
    paid_at: null,
    items: [],
    payments: [],
    customer_name: "Cliente Teste",
    seller_name: "Vendedor Teste",
    ...overrides,
  };
}

function baseInput(overrides: Partial<CreateCustomerNoteInput> = {}): CreateCustomerNoteInput {
  return {
    customer_id: 1,
    user_id: 1,
    description: null,
    due_date: null,
    items: [{ product_id: 5, quantity: 1, unit_price: "50.00" }],
    ...overrides,
  };
}

describe("CreateCustomerNote — validação básica", () => {
  it("rejeita nota sem cliente", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    const customerRepo = new FakeCustomerRepository(makeCustomer());
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);
    await expect(useCase.execute(baseInput({ customer_id: 0 }))).rejects.toThrow(CustomerNoteValidationError);
  });

  it("rejeita nota sem itens", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    const customerRepo = new FakeCustomerRepository(makeCustomer());
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);
    await expect(useCase.execute(baseInput({ items: [] }))).rejects.toThrow("Adicione ao menos um item");
  });
});

describe("CreateCustomerNote — limite de crédito", () => {
  it("permite a nota quando o cliente não tem limite definido", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    const customerRepo = new FakeCustomerRepository(makeCustomer({ credit_limit: null }));
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);
    await useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "999999.00" }] }));
    expect(noteRepo.created).toHaveLength(1);
  });

  it("permite a nota quando o total fica dentro do limite", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    const customerRepo = new FakeCustomerRepository(makeCustomer({ credit_limit: "200.00" }));
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);
    await useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "150.00" }] }));
    expect(noteRepo.created).toHaveLength(1);
  });

  it("bloqueia a nota quando ultrapassa o limite, considerando saldo já em aberto", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    noteRepo.existingNotes = [makeNote({ total: "80.00", paid_amount: "0.00", status: "aberto" })];
    const customerRepo = new FakeCustomerRepository(makeCustomer({ credit_limit: "100.00" }));
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);

    await expect(
      useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "50.00" }] }))
    ).rejects.toThrow(CreditLimitExceededError);
    expect(noteRepo.created).toHaveLength(0);
  });

  it("permite ultrapassar o limite quando overrideLimit é true", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    noteRepo.existingNotes = [makeNote({ total: "80.00", paid_amount: "0.00", status: "aberto" })];
    const customerRepo = new FakeCustomerRepository(makeCustomer({ credit_limit: "100.00" }));
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);

    await useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "50.00" }] }), true);
    expect(noteRepo.created).toHaveLength(1);
  });

  it("ignora notas já quitadas no cálculo do saldo em aberto", async () => {
    const noteRepo = new FakeCustomerNoteRepository();
    noteRepo.existingNotes = [makeNote({ total: "500.00", paid_amount: "500.00", status: "pago" })];
    const customerRepo = new FakeCustomerRepository(makeCustomer({ credit_limit: "100.00" }));
    const useCase = new CreateCustomerNote(noteRepo, customerRepo);

    await useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "50.00" }] }));
    expect(noteRepo.created).toHaveLength(1);
  });
});
