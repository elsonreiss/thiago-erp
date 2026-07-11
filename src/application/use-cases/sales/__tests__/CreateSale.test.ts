import { describe, expect, it } from "vitest";
import { CreateSale, SaleValidationError } from "@/application/use-cases/sales/CreateSale";
import { SaleRepository, CreateSaleInput, SaleFilters } from "@/domain/repositories/SaleRepository";
import { SaleWithItems, PaymentMethod } from "@/domain/entities/Sale";
import { PaginatedResult, buildPaginatedResult } from "@/lib/pagination";

/** Repositório falso em memória, só para testar a validação do use-case sem precisar de banco. */
class FakeSaleRepository implements SaleRepository {
  public created: CreateSaleInput[] = [];

  async findById(): Promise<SaleWithItems | null> {
    return null;
  }
  async findAll(): Promise<SaleWithItems[]> {
    return [];
  }
  async findPage(_filters: SaleFilters, page: number, pageSize: number): Promise<PaginatedResult<SaleWithItems>> {
    return buildPaginatedResult([], 0, page, pageSize);
  }
  async create(input: CreateSaleInput): Promise<SaleWithItems> {
    this.created.push(input);
    return {
      id: 1,
      customer_id: input.customer_id,
      user_id: input.user_id,
      payment_method: input.payment_method,
      discount: input.discount,
      total: "0.00",
      notes: input.notes,
      nfce_number: null,
      created_at: new Date().toISOString(),
      items: [],
      customer_name: null,
      seller_name: "Vendedor Teste",
    };
  }
  async recent(): Promise<SaleWithItems[]> {
    return [];
  }
  async totalRevenue(): Promise<number> {
    return 0;
  }
  async countSalesToday(): Promise<number> {
    return 0;
  }
  async revenueByDay(): Promise<Array<{ day: string; total: number }>> {
    return [];
  }
  async revenueBySeller(): Promise<Array<{ user_id: number; seller_name: string; total: number; count: number }>> {
    return [];
  }
  async revenueByMonth(): Promise<Array<{ month: string; total: number }>> {
    return [];
  }
  async revenueByPaymentMethodForDay(): Promise<Array<{ payment_method: PaymentMethod; total: number; count: number }>> {
    return [];
  }
  async delete(): Promise<void> {}

  async updateNfceNumber(): Promise<SaleWithItems | null> {
    return null;
  }
}

function baseInput(overrides: Partial<CreateSaleInput> = {}): CreateSaleInput {
  return {
    customer_id: null,
    user_id: 1,
    payment_method: "dinheiro",
    discount: "0.00",
    notes: null,
    items: [{ product_id: 10, quantity: 2, unit_price: "5.00" }],
    ...overrides,
  };
}

describe("CreateSale", () => {
  it("cria a venda quando os dados são válidos", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await useCase.execute(baseInput());
    expect(repo.created).toHaveLength(1);
  });

  it("rejeita venda sem itens", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await expect(useCase.execute(baseInput({ items: [] }))).rejects.toThrow(SaleValidationError);
  });

  it("rejeita item avulso sem nome", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await expect(
      useCase.execute(baseInput({ items: [{ product_id: null, quantity: 1, unit_price: "10.00" }] }))
    ).rejects.toThrow("Item avulso precisa de um nome.");
  });

  it("aceita item avulso com nome", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await useCase.execute(
      baseInput({ items: [{ product_id: null, product_name: "Parafuso avulso", quantity: 1, unit_price: "10.00" }] })
    );
    expect(repo.created).toHaveLength(1);
  });

  it("rejeita quantidade zero ou negativa", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await expect(
      useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 0, unit_price: "10.00" }] }))
    ).rejects.toThrow("quantidade");
  });

  it("rejeita preço unitário negativo", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await expect(
      useCase.execute(baseInput({ items: [{ product_id: 1, quantity: 1, unit_price: "-5.00" }] }))
    ).rejects.toThrow("Preço unitário inválido");
  });

  it("rejeita desconto inválido", async () => {
    const repo = new FakeSaleRepository();
    const useCase = new CreateSale(repo);
    await expect(useCase.execute(baseInput({ discount: "-10" }))).rejects.toThrow("Desconto inválido.");
  });
});
