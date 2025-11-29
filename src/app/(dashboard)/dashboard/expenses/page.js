// src/app/(dashboard)/dashboard/expenses/page.js
import ExpensesPage from '@/components/ExpensesPage';

export const metadata = {
  title: 'Expense Tracking | Truck Command',
  description: 'Track and manage all your business expenses'
};

export default function ExpensesRoute() {
  return <ExpensesPage />;
}
