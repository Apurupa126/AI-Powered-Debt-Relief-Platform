import { FaArrowUp } from "react-icons/fa";

export default function StatCard({
  title,
  value,
  icon,
  color,
}) {
  return (
    <div className="bg-white rounded-3xl shadow-lg p-6 hover:shadow-xl transition-all duration-200">
      <div className="flex justify-between items-start gap-4">
        <div>
          <p className="text-slate-500 text-xs tracking-[0.25em] uppercase">
            {title}
          </p>
          <h2 className="text-4xl font-semibold mt-3 leading-tight text-slate-900">
            {value}
          </h2>
        </div>
        <div className={`w-14 h-14 rounded-3xl flex items-center justify-center ${color}`}>
          {icon}
        </div>
      </div>
      <div className="flex items-center mt-6 text-green-600 text-sm">
        <FaArrowUp className="mr-2" />
        Updated Today
      </div>
    </div>
  );
}