import {
  LayoutDashboard,
  Package,
  Users,
  Truck,
  ShoppingCart,
  ScanBarcode,
  PackagePlus,
  FileText,
  NotebookText,
  ClipboardCheck,
  Wallet,
  BarChart3,
  ShieldCheck,
  Settings,
  type LucideIcon,
} from "lucide-react";
import { UserRole, canViewFinancials, isAdmin } from "@/domain/entities/User";

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
  roles?: UserRole[];
  visible?: (role: UserRole) => boolean;
}

export const NAV_ITEMS: NavItem[] = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/estoque", label: "Estoque", icon: Package },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/fornecedores", label: "Fornecedores", icon: Truck },
  { href: "/vendas", label: "Vendas", icon: ShoppingCart },
  { href: "/caixa-rapido", label: "Caixa rápido", icon: ScanBarcode },
  { href: "/compras", label: "Compras", icon: PackagePlus },
  { href: "/orcamentos", label: "Orçamentos", icon: FileText },
  { href: "/notas-clientes", label: "Notas de clientes", icon: NotebookText },
  {
    href: "/caixa",
    label: "Caixa",
    icon: ClipboardCheck,
    visible: canViewFinancials,
  },
  {
    href: "/financeiro",
    label: "Financeiro",
    icon: Wallet,
    visible: canViewFinancials,
  },
  {
    href: "/relatorios",
    label: "Relatórios",
    icon: BarChart3,
    visible: canViewFinancials,
  },
  {
    href: "/auditoria",
    label: "Auditoria",
    icon: ShieldCheck,
    visible: isAdmin,
  },
  {
    href: "/configuracoes",
    label: "Configurações",
    icon: Settings,
    visible: isAdmin,
  },
];

export function navItemsForRole(role: UserRole): NavItem[] {
  return NAV_ITEMS.filter((item) => !item.visible || item.visible(role));
}
