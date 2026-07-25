export default function RecentLoans({ stats }) {
  const loans = stats
    ? [
        { name: "Loan Count", amount: stats.total_loans },
        { name: "Debt Stress", amount: stats.debt_stress },
        { name: "Settlement", amount: stats.recommended_settlement },
      ]
    : [
        { name: "Home Loan", amount: "₹8,00,000" },
        { name: "Car Loan", amount: "₹2,00,000" },
        { name: "Personal Loan", amount: "₹1,00,000" },
      ];

  return (
    <div className="bg-white rounded-2xl shadow-md p-6">
      <h2 className="text-xl font-bold mb-5">Recent Loans</h2>
      {loans.map((loan, index) => (
        <div key={index} className="flex justify-between py-3 border-b last:border-b-0">
          <span>{loan.name}</span>
          <span className="font-bold">{loan.amount}</span>
        </div>
      ))}
    </div>
  );
}