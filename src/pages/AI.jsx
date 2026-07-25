import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { jsPDF } from "jspdf";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { showError } from "../utils/notification";
import StatCard from "../components/common/StatCard";
import { FaBrain, FaChartLine, FaShieldAlt, FaDollarSign, FaCalendarCheck, FaCreditCard } from "react-icons/fa";

const insightCards = [
  { key: "settlement", title: "Settlement Recommendation", icon: <FaBrain className="text-white text-2xl" />, color: "bg-indigo-500" },
  { key: "budget", title: "Budget Planner", icon: <FaChartLine className="text-white text-2xl" />, color: "bg-emerald-500" },
  { key: "risk", title: "Risk Score", icon: <FaShieldAlt className="text-white text-2xl" />, color: "bg-red-500" },
  { key: "emi", title: "EMI Optimization", icon: <FaDollarSign className="text-white text-2xl" />, color: "bg-blue-500" },
  { key: "debtFree", title: "Debt Free Prediction", icon: <FaCalendarCheck className="text-white text-2xl" />, color: "bg-violet-500" },
  { key: "cibil", title: "Estimated CIBIL", icon: <FaCreditCard className="text-white text-2xl" />, color: "bg-yellow-500" },
];

export default function AIInsights() {
  const [data, setData] = useState({});
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [planForm, setPlanForm] = useState({
    loanType: "Personal",
    amount: "",
    monthlyIncome: "",
    monthlyPayment: "",
    preferredMonths: "",
  });
  const [planResult, setPlanResult] = useState(null);
  const [planLoading, setPlanLoading] = useState(false);

  const handlePlanChange = (field) => (event) => {
    setPlanForm((prev) => ({ ...prev, [field]: event.target.value }));
  };

  const downloadPlanPdf = () => {
    if (!planResult) return;
    const doc = new jsPDF();
    const lines = [
      "Debt Payoff Plan",
      "",
      `Loan Type: ${planResult.loan_type}`,
      `Total Debt: ₹${planResult.total_debt.toLocaleString()}`,
      `Interest Rate: ${planResult.interest_rate}%`,
      `Estimated Monthly Payment: ₹${planResult.estimated_monthly_payment.toLocaleString()}`,
      `Estimated Months: ${planResult.estimated_months}`,
      `Estimated Years: ${planResult.estimated_years}`,
      "",
      "Summary:",
      planResult.summary,
      "",
      "Plan:",
      ...planResult.plan.split("\n"),
      "",
      "Recommendation:",
      planResult.recommendation,
    ];
    doc.setFontSize(16);
    doc.text(lines, 14, 20, { maxWidth: 180 });
    doc.save("debt-payoff-plan.pdf");
  };

  const generateDebtPlan = async () => {
    const amount = Number(planForm.amount);
    if (!amount || amount <= 0) {
      showError("Please enter a valid loan amount to generate a debt payoff plan.");
      return;
    }

    setPlanLoading(true);
    setPlanResult(null);
    try {
      const response = await api.post("/ai/plan", {
        loan_type: planForm.loanType,
        amount,
        monthly_income: planForm.monthlyIncome ? Number(planForm.monthlyIncome) : undefined,
        monthly_payment: planForm.monthlyPayment ? Number(planForm.monthlyPayment) : undefined,
        preferred_months: planForm.preferredMonths ? Number(planForm.preferredMonths) : undefined,
      });
      setPlanResult(response.data);
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to generate debt payoff plan");
    } finally {
      setPlanLoading(false);
    }
  };

  const loadInsights = async () => {
    setLoading(true);
    try {
      const [summaryRes, settlementRes, budgetRes, riskRes, emiRes, debtFreeRes, eligibilityRes, cibilRes] = await Promise.all([
        api.get("/ai/summary"),
        api.get("/ai/settlement"),
        api.get("/ai/budget"),
        api.get("/ai/risk"),
        api.get("/ai/emi"),
        api.get("/ai/debt-free"),
        api.get("/ai/eligibility"),
        api.get("/ai/cibil"),
      ]);

      setSummary(summaryRes.data.summary);
      setData({
        settlement: settlementRes.data.settlement,
        budget: budgetRes.data.budget,
        risk: riskRes.data,
        emi: emiRes.data,
        debtFree: debtFreeRes.data,
        eligibility: eligibilityRes.data,
        cibil: cibilRes.data,
      });
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to load AI insights");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInsights();
  }, []);

  const getStatValue = (key) => {
    const insight = data[key];
    if (!insight) return "Ready";
    if (key === "settlement") return insight.risk || insight.status || "Ready";
    if (key === "budget") return insight.monthly_income ? "Plan Ready" : "Ready";
    if (key === "risk") return insight.risk_level || insight.status || "Ready";
    if (key === "emi") return insight.status || "Ready";
    if (key === "debtFree") return insight.completion_date || "Ready";
    if (key === "cibil") return insight.rating || "Ready";
    return "Ready";
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">AI Insights</h1>
            <p className="text-gray-600 mt-2">Get personalized financial guidance from your loan profile.</p>
          </div>

          <button
            onClick={loadInsights}
            className="rounded-full bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 transition"
          >
            {loading ? "Refreshing..." : "Refresh Insights"}
          </button>
        </div>

        <div className="grid gap-6 mt-8 lg:grid-cols-3">
          {insightCards.map((card) => (
            <StatCard
              key={card.key}
              title={card.title}
              value={getStatValue(card.key)}
              icon={card.icon}
              color={card.color}
            />
          ))}
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-3">
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Financial Summary</h2>
            {summary ? (
              <div className="space-y-4 text-slate-700">
                <div>
                  <p className="text-sm text-slate-500">Total Debt</p>
                  <p className="text-xl font-semibold">₹{summary.total_debt}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Average Interest</p>
                  <p className="text-xl font-semibold">{summary.average_interest}%</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Overdue Payments</p>
                  <p className="text-xl font-semibold">{summary.overdue_payments}</p>
                </div>
              </div>
            ) : (
              <p className="text-gray-500">AI financial summary will appear here.</p>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Debt Payoff Planner</h2>
            <div className="space-y-4 text-slate-700">
              <div>
                <label className="block text-sm font-medium text-slate-600">Loan Type</label>
                <input
                  type="text"
                  value={planForm.loanType}
                  onChange={handlePlanChange("loanType")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Personal, Home, Auto, Education"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Loan Amount</label>
                <input
                  type="number"
                  value={planForm.amount}
                  onChange={handlePlanChange("amount")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Enter loan amount"
                />
              </div>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-600">Monthly Income</label>
                  <input
                    type="number"
                    value={planForm.monthlyIncome}
                    onChange={handlePlanChange("monthlyIncome")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-600">Monthly Payment</label>
                  <input
                    type="number"
                    value={planForm.monthlyPayment}
                    onChange={handlePlanChange("monthlyPayment")}
                    className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                    placeholder="Optional"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-600">Preferred Payoff Months</label>
                <input
                  type="number"
                  value={planForm.preferredMonths}
                  onChange={handlePlanChange("preferredMonths")}
                  className="mt-2 w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none focus:border-blue-500"
                  placeholder="Optional"
                />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={generateDebtPlan}
                  disabled={planLoading}
                  className="rounded-full bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 transition disabled:opacity-50"
                >
                  {planLoading ? "Generating..." : "Generate Plan"}
                </button>
                {planResult ? (
                  <button
                    onClick={downloadPlanPdf}
                    className="rounded-full bg-slate-900 px-6 py-3 text-white hover:bg-slate-700 transition"
                  >
                    Download PDF
                  </button>
                ) : null}
              </div>
              {planResult ? (
                <div className="rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700">
                  <p className="font-semibold mb-2">Payoff Summary</p>
                  <p>{planResult.summary}</p>
                  <div className="mt-3 whitespace-pre-line text-slate-700">{planResult.plan}</div>
                </div>
              ) : (
                <p className="text-sm text-slate-500">Enter loan details above to receive an estimated payoff schedule and action plan.</p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-bold mb-4">Top Insights</h2>
            <div className="space-y-4">
              {Object.entries(data).map(([key, value]) => (
                <div key={key} className="rounded-2xl bg-slate-50 p-4">
                  <div className="flex items-center justify-between gap-3 mb-2">
                    <p className="font-semibold capitalize">{key.replace(/([A-Z])/g, " $1")}</p>
                    <span className="text-sm text-slate-500">Updated</span>
                  </div>
                  <p className="text-sm leading-6 text-slate-700">
                    {typeof value === "string"
                      ? value
                      : value?.recommendation || value?.suggestion || value?.plan || "No recommendation yet."}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
