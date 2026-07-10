export interface CashClosing {
  id: number;
  closing_date: string; // "YYYY-MM-DD"
  user_id: number;
  opening_amount: string;
  sales_cash: string;
  expected_total: string;
  counted_cash: string;
  difference: string;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface CashClosingWithUser extends CashClosing {
  user_name: string;
}
