import { useEffect } from "react";
import { useForm } from "react-hook-form";
import api from "../../services/api";
import { formatApiError, showError, showSuccess } from "../../utils/notification";

const initialValues = {
  loan_name: "",
  lender: "",
  amount: "",
  interest: "",
  emi: "",
  income: "",
  expenses: "",
  overdue: "",
  loan_type: "Personal",
  duration_months: "",
  remaining_balance: "",
  due_date: "",
  salary: "",
  other_income: "",
  household_expenses: "",
  savings: "",
  house_ownership: false,
  vehicle_ownership: false,
  investments: "",
  financial_goal: "",
};

export default function LoanForm({ onLoanAdded, onLoanUpdated, editingLoan, onCancel }) {
  const {
    register,
    handleSubmit,
    reset,
  } = useForm({ defaultValues: initialValues });

  useEffect(() => {
    if (editingLoan) {
      reset({
        ...editingLoan,
        house_ownership: editingLoan.house_ownership ?? false,
        vehicle_ownership: editingLoan.vehicle_ownership ?? false,
      });
    } else {
      reset(initialValues);
    }
  }, [editingLoan, reset]);

  const saveLoan = async (values) => {
    const payload = {
      ...values,
      amount: Number(values.amount),
      interest: Number(values.interest),
      emi: Number(values.emi),
      income: Number(values.income || 0),
      expenses: Number(values.expenses || 0),
      overdue: Number(values.overdue || 0),
      duration_months: values.duration_months ? Number(values.duration_months) : undefined,
      remaining_balance: values.remaining_balance ? Number(values.remaining_balance) : undefined,
      salary: Number(values.salary || 0),
      other_income: Number(values.other_income || 0),
      household_expenses: Number(values.household_expenses || 0),
      savings: Number(values.savings || 0),
      investments: Number(values.investments || 0),
    };

    try {
      if (editingLoan) {
        await api.put(`/loan/${editingLoan.id}`, payload);
        showSuccess("Loan updated successfully.");
        onLoanUpdated?.();
      } else {
        await api.post("/loan/add", payload);
        showSuccess("Loan added successfully.");
        onLoanAdded?.();
      }
      reset(initialValues);
    } catch (err) {
      showError(formatApiError(err));
    }
  };

  return (
    <form onSubmit={handleSubmit(saveLoan)} className="bg-white rounded-2xl shadow-md p-6 mb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-bold">{editingLoan ? "Edit Loan" : "Add New Loan"}</h2>
          <p className="text-slate-500 mt-1">Keep your loan portfolio up to date.</p>
        </div>
        <div className="flex gap-3">
          {editingLoan && (
            <button type="button" onClick={onCancel} className="rounded-full border border-slate-300 px-5 py-2 text-slate-600 hover:bg-slate-100 transition">
              Cancel
            </button>
          )}
          <button type="submit" className="rounded-full bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 transition">
            {editingLoan ? "Update Loan" : "Save Loan"}
          </button>
        </div>
      </div>

      <div className="grid gap-5 mt-6 md:grid-cols-2">
        {[
          { name: "loan_name", label: "Loan Name", type: "text" },
          { name: "lender", label: "Lender", type: "text" },
          { name: "loan_type", label: "Loan Type", type: "text" },
          { name: "amount", label: "Loan Amount", type: "number" },
          { name: "interest", label: "Interest Rate", type: "number" },
          { name: "emi", label: "Monthly EMI", type: "number" },
          { name: "income", label: "Monthly Income", type: "number" },
          { name: "expenses", label: "Monthly Expenses", type: "number" },
          { name: "overdue", label: "Overdue Months", type: "number" },
          { name: "duration_months", label: "Duration (Months)", type: "number" },
          { name: "remaining_balance", label: "Remaining Balance", type: "number" },
          { name: "due_date", label: "Due Date", type: "text" },
          { name: "salary", label: "Salary", type: "number" },
          { name: "other_income", label: "Other Income", type: "number" },
          { name: "household_expenses", label: "Household Expenses", type: "number" },
          { name: "savings", label: "Savings", type: "number" },
          { name: "investments", label: "Investments", type: "number" },
        ].map((field) => (
          <div key={field.name}>
            <label className="block text-sm font-medium text-slate-700">{field.label}</label>
            <input
              type={field.type}
              {...register(field.name)}
              className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
            />
          </div>
        ))}

        <div className="flex items-center gap-4">
          <label className="flex items-center gap-3 text-slate-700">
            <input type="checkbox" {...register("house_ownership")} />
            Own House
          </label>
          <label className="flex items-center gap-3 text-slate-700">
            <input type="checkbox" {...register("vehicle_ownership")} />
            Own Vehicle
          </label>
        </div>

        <div className="md:col-span-2">
          <label className="block text-sm font-medium text-slate-700">Financial Goal</label>
          <textarea
            {...register("financial_goal")}
            rows={3}
            className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
          />
        </div>
      </div>
    </form>
  );
}
