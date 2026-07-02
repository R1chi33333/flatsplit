export const metadata = {
  title: 'Expenses — FlatSplit',
};

export default function ExpensesPage() {
  return (
    <div className="flex flex-col items-center gap-2 py-16 text-center">
      <h1 className="text-lg font-semibold">Expenses</h1>
      <p className="text-sm text-fg-muted">Expense tracking lands in the next loop.</p>
    </div>
  );
}
