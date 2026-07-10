import { UserRepository } from "@/domain/repositories/UserRepository";
import { SessionRepository } from "@/domain/repositories/SessionRepository";
import { ProductRepository } from "@/domain/repositories/ProductRepository";
import { CustomerRepository } from "@/domain/repositories/CustomerRepository";
import { SupplierRepository } from "@/domain/repositories/SupplierRepository";
import { SaleRepository } from "@/domain/repositories/SaleRepository";
import { PurchaseRepository } from "@/domain/repositories/PurchaseRepository";
import { BudgetRepository } from "@/domain/repositories/BudgetRepository";
import { ExpenseRepository } from "@/domain/repositories/ExpenseRepository";
import { CustomerNoteRepository } from "@/domain/repositories/CustomerNoteRepository";
import { CashClosingRepository } from "@/domain/repositories/CashClosingRepository";

import { PgUserRepository } from "@/infrastructure/repositories/PgUserRepository";
import { PgSessionRepository } from "@/infrastructure/repositories/PgSessionRepository";
import { PgProductRepository } from "@/infrastructure/repositories/PgProductRepository";
import { PgCustomerRepository } from "@/infrastructure/repositories/PgCustomerRepository";
import { PgSupplierRepository } from "@/infrastructure/repositories/PgSupplierRepository";
import { PgSaleRepository } from "@/infrastructure/repositories/PgSaleRepository";
import { PgPurchaseRepository } from "@/infrastructure/repositories/PgPurchaseRepository";
import { PgBudgetRepository } from "@/infrastructure/repositories/PgBudgetRepository";
import { PgExpenseRepository } from "@/infrastructure/repositories/PgExpenseRepository";
import { PgCustomerNoteRepository } from "@/infrastructure/repositories/PgCustomerNoteRepository";
import { PgCashClosingRepository } from "@/infrastructure/repositories/PgCashClosingRepository";

interface Container {
  userRepository: UserRepository;
  sessionRepository: SessionRepository;
  productRepository: ProductRepository;
  customerRepository: CustomerRepository;
  supplierRepository: SupplierRepository;
  saleRepository: SaleRepository;
  purchaseRepository: PurchaseRepository;
  budgetRepository: BudgetRepository;
  expenseRepository: ExpenseRepository;
  customerNoteRepository: CustomerNoteRepository;
  cashClosingRepository: CashClosingRepository;
}

export const container: Container = {
  userRepository: new PgUserRepository(),
  sessionRepository: new PgSessionRepository(),
  productRepository: new PgProductRepository(),
  customerRepository: new PgCustomerRepository(),
  supplierRepository: new PgSupplierRepository(),
  saleRepository: new PgSaleRepository(),
  purchaseRepository: new PgPurchaseRepository(),
  budgetRepository: new PgBudgetRepository(),
  expenseRepository: new PgExpenseRepository(),
  customerNoteRepository: new PgCustomerNoteRepository(),
  cashClosingRepository: new PgCashClosingRepository(),
};
