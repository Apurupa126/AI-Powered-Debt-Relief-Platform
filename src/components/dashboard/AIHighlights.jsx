export default function AIHighlights() {
  const aiHighlights = [
    {
      title: "Settlement Prediction",
      description: "AI guidance for settlement offers and recovery planning.",
    },
    {
      title: "Negotiation Strategy",
      description: "Generate lender-specific negotiation letters and approach advice.",
    },
    {
      title: "Debt Stress Monitoring",
      description: "Track EMI burden and risk level with easy-to-read indicators.",
    },
    {
      title: "Budget Planning",
      description: "Use AI recommendations to allocate income and savings effectively.",
    },
    {
      title: "Borrower Rights",
      description: "Access guidance on your rights as a borrower and responsible debt recovery steps.",
    },
  ];

  return (
    <div className="bg-white rounded-3xl shadow-md p-6">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-slate-500">AI Insights</p>
          <h2 className="text-2xl font-semibold mt-3 text-slate-900">Financial intelligence</h2>
        </div>
      </div>
      <div className="mt-6 space-y-3">
        {aiHighlights.map((item, index) => (
          <div
            key={index}
            className="rounded-3xl border border-slate-200 bg-slate-50 p-4 transition hover:border-blue-300"
          >
            <p className="font-semibold text-slate-900">{item.title}</p>
            <p className="text-sm text-slate-600 mt-1">{item.description}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
