import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { showError, showSuccess } from "../utils/notification";
import DashboardLayout from "../layouts/DashboardLayout";
import LoanSummary from "../components/loan/LoanSummary";
import LoanTable from "../components/loan/LoanTable";
import LoanForm from "../components/loan/LoanForm";
import api from "../services/api";

export default function Loans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingLoan, setEditingLoan] = useState(null);

  const fetchLoans = async () => {
    setLoading(true);
    try {
      const res = await api.get("/loan/");
      setLoans(res.data.loans || res.data);
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to load loans");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLoans();
  }, []);

  const onEdit = (loan) => {
    setEditingLoan(loan);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const onDelete = async (loanId) => {
    if (!confirm("Delete this loan?")) return;
    try {
      await api.delete(`/loan/${loanId}`);
      showSuccess("Loan deleted successfully.");
      fetchLoans();
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to delete loan");
    }
  };

  const onResetEdit = () => setEditingLoan(null);

  const onLoanSaved = () => {
    fetchLoans();
    setEditingLoan(null);
  };

  return (
    <DashboardLayout>
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Loan Management</h1>
            <p className="text-gray-600 mt-2">Add, update, and manage your loan portfolio with ease.</p>
          </div>
          <button className="rounded-full bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 transition" onClick={fetchLoans}>
            {loading ? "Refreshing..." : "Refresh Loans"}
          </button>
        </div>

        <LoanForm onLoanAdded={onLoanSaved} onLoanUpdated={onLoanSaved} editingLoan={editingLoan} onCancel={onResetEdit} />

        <LoanSummary loans={loans} />

        <div className="mt-8">
          <LoanTable loans={loans} onEdit={onEdit} onDelete={onDelete} />
        </div>
      </motion.div>
    </DashboardLayout>
  );
}
