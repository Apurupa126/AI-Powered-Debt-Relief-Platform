import { FaEdit, FaTrash } from "react-icons/fa";

export default function LoanTable({ loans, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl shadow-md overflow-x-auto">
      <table className="w-full">
        <thead className="bg-blue-700 text-white">
          <tr>
            <th className="p-4">ID</th>
            <th>Loan Name</th>
            <th>Amount</th>
            <th>Interest</th>
            <th>EMI</th>
            <th>Overdue</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {loans.length > 0 ? (
            loans.map((loan) => (
              <tr key={loan.id} className="border-b hover:bg-slate-50">
                <td className="p-4">{loan.id}</td>
                <td>{loan.loan_name}</td>
                <td>₹{loan.amount}</td>
                <td>{loan.interest}%</td>
                <td>₹{loan.emi}</td>
                <td>{loan.overdue}</td>
                <td className="flex gap-3 p-4">
                  <button onClick={() => onEdit?.(loan)} className="text-blue-600 hover:text-blue-800">
                    <FaEdit />
                  </button>
                  <button onClick={() => onDelete?.(loan.id)} className="text-red-600 hover:text-red-800">
                    <FaTrash />
                  </button>
                </td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="7" className="text-center p-8 text-gray-500">
                No Loans Found
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
