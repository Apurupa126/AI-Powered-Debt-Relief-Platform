import StatCard from "../common/StatCard";
import { FaWallet, FaPercentage, FaMoneyBillWave, FaList } from "react-icons/fa";

export default function LoanSummary({ loans = [] }) {
  const totalDebt = loans.reduce((sum, loan) => sum + (loan.amount || 0), 0);
  const totalEmi = loans.reduce((sum, loan) => sum + (loan.emi || 0), 0);
  const totalLoans = loans.length;
  const averageInterest = totalLoans > 0 ? (loans.reduce((sum, loan) => sum + (loan.interest || 0), 0) / totalLoans).toFixed(2) : "0.00";

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
      <StatCard title="Total Loans" value={totalLoans} icon={<FaList className="text-white text-2xl" />} color="bg-blue-500" />
      <StatCard title="Total Debt" value={`₹${totalDebt.toLocaleString()}`} icon={<FaWallet className="text-white text-2xl" />} color="bg-red-500" />
      <StatCard title="Average Interest" value={`${averageInterest}%`} icon={<FaPercentage className="text-white text-2xl" />} color="bg-green-500" />
      <StatCard title="Monthly EMI" value={`₹${totalEmi.toLocaleString()}`} icon={<FaMoneyBillWave className="text-white text-2xl" />} color="bg-purple-500" />
    </div>
  );
}
