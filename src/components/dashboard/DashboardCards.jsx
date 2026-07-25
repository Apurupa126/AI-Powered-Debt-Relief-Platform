import {
  FaWallet,
  FaMoneyBillWave,
  FaPiggyBank,
  FaUniversity,
} from "react-icons/fa";

import StatCard from "../common/StatCard";

export default function DashboardCards({ stats }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
      <StatCard
        title="Total Debt"
        value={stats ? `₹${stats.total_debt.toLocaleString()}` : "Loading..."}
        icon={<FaWallet className="text-white text-2xl" />}
        color="bg-red-500"
      />

      <StatCard
        title="Monthly EMI"
        value={stats ? `₹${stats.monthly_emi.toLocaleString()}` : "Loading..."}
        icon={<FaMoneyBillWave className="text-white text-2xl" />}
        color="bg-blue-500"
      />

      <StatCard
        title="Income"
        value={stats ? `₹${stats.monthly_income.toLocaleString()}` : "Loading..."}
        icon={<FaUniversity className="text-white text-2xl" />}
        color="bg-emerald-500"
      />

      <StatCard
        title="Monthly Surplus"
        value={stats ? `₹${stats.monthly_surplus.toLocaleString()}` : "Loading..."}
        icon={<FaPiggyBank className="text-white text-2xl" />}
        color="bg-violet-500"
      />

      <StatCard
        title="EMI Ratio"
        value={stats ? `${stats.emi_ratio}%` : "Loading..."}
        icon={<FaMoneyBillWave className="text-white text-2xl" />}
        color="bg-sky-500"
      />

      <StatCard
        title="Debt Stress"
        value={stats ? stats.debt_stress : "Loading..."}
        icon={<FaUniversity className="text-white text-2xl" />}
        color={stats?.debt_stress === "High" ? "bg-red-600" : stats?.debt_stress === "Medium" ? "bg-amber-500" : "bg-emerald-500"}
      />
    </div>
  );
}