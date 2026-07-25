import { useEffect, useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { showError } from "../utils/notification";
import DashboardCards from "../components/dashboard/DashboardCards";
import IncomeExpenseChart from "../components/dashboard/IncomeExpenseChart";
import RecentLoans from "../components/dashboard/RecentLoans";
import AIHighlights from "../components/dashboard/AIHighlights";

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [aiData, setAiData] = useState({ settlement: null, negotiation: null });
  const [loading, setLoading] = useState(true);
  const [aiLoading, setAiLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const response = await api.get("/dashboard/me");
      setStats(response.data);
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to load dashboard");
    } finally {
      setLoading(false);
    }
  };

  const fetchAIInsights = async () => {
    setAiLoading(true);
    try {
      const [settlementRes, negotiationRes] = await Promise.all([
        api.get("/ai/settlement"),
        api.get("/ai/negotiation"),
      ]);
      setAiData({
        settlement: settlementRes.data.settlement,
        negotiation: negotiationRes.data,
      });
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to load AI insights");
    } finally {
      setAiLoading(false);
    }
  };

  const refreshDashboard = async () => {
    await Promise.all([fetchStats(), fetchAIInsights()]);
  };

  useEffect(() => {
    refreshDashboard();
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-5xl md:text-6xl font-bold leading-tight">AI Powered Debt Relief Dashboard</h1>
            <p className="text-slate-600 text-lg mt-3 max-w-2xl">Track your progress, gauge risk, and plan your debt-free journey with AI-powered insights and settlement guidance.</p>
          </div>
          <button
            onClick={refreshDashboard}
            className="rounded-full bg-blue-700 px-6 py-3 text-white text-sm font-semibold hover:bg-blue-800 transition"
          >
            {loading || aiLoading ? "Refreshing..." : "Refresh Metrics"}
          </button>
        </div>

        <DashboardCards stats={stats} />

        {stats?.total_loans === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-700 mt-6">
            <h2 className="text-2xl font-semibold text-slate-900">No loan data available yet</h2>
            <p className="mt-3 text-sm leading-7">
              Add your first loan in the Loans section to unlock AI settlement guidance, negotiation letters, and a full financial health dashboard.
            </p>
          </div>
        ) : null}

        <div className="grid lg:grid-cols-2 gap-6 mt-8">
          <IncomeExpenseChart />
          <AIHighlights />
        </div>

        <div className="grid gap-6 lg:grid-cols-2 mt-8">
          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-slate-500">AI-Powered Settlement Prediction</p>
                <h2 className="text-2xl font-semibold mt-3 text-slate-900">Smart settlement guidance</h2>
              </div>
              <span className={`rounded-full px-4 py-2 text-xs font-semibold ${aiData.settlement?.risk === "High" ? "bg-red-100 text-red-800" : aiData.settlement?.risk === "Medium" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                {aiData.settlement?.risk ?? (aiLoading ? "Loading..." : "Pending")}
              </span>
            </div>
            <p className="mt-5 text-slate-700 leading-7 text-sm">
              {aiLoading
                ? "Loading settlement prediction..."
                : aiData.settlement?.recommendation || "Generate AI-backed settlement guidance based on your current loan profile."
              }
            </p>
            {aiData.settlement?.debt_ratio != null ? (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Debt ratio</p>
                <p className="mt-2">{aiData.settlement.debt_ratio}% of your monthly income is committed to EMI payments.</p>
              </div>
            ) : null}
          </div>

          <div className="bg-white rounded-3xl shadow-md p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs tracking-[0.3em] uppercase text-slate-500">AI Negotiation Strategy</p>
                <h2 className="text-2xl font-semibold mt-3 text-slate-900">Lender negotiation plan</h2>
              </div>
              <span className="rounded-full bg-sky-100 px-4 py-2 text-xs font-semibold text-sky-800">
                {aiLoading ? "Loading..." : "Active"}
              </span>
            </div>
            <div className="mt-5 text-slate-700 leading-7 text-sm whitespace-pre-line">
              {aiLoading
                ? "Loading negotiation strategy..."
                : aiData.negotiation?.strategy || "Your AI-generated negotiation strategy will show here once available."
              }
            </div>
            {aiData.negotiation?.summary ? (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Summary</p>
                <p className="mt-2">{aiData.negotiation.summary}</p>
              </div>
            ) : null}
            {aiData.negotiation?.sample_letter ? (
              <div className="mt-6 rounded-3xl bg-slate-50 p-4 text-sm text-slate-700">
                <p className="font-semibold">Sample Negotiation Letter</p>
                <pre className="mt-3 whitespace-pre-wrap break-words text-sm text-slate-700">{aiData.negotiation.sample_letter}</pre>
              </div>
            ) : null}
          </div>
        </div>

        <div className="mt-8">
          <RecentLoans stats={stats} />
        </div>
      </div>
    </DashboardLayout>
  );
}
