import { NavLink, useNavigate } from "react-router-dom";
import {
  FaHome,
  FaMoneyBillWave,
  FaRobot,
  FaUser,
  FaSignOutAlt,
} from "react-icons/fa";

export default function Sidebar() {
  const navigate = useNavigate();

  const logout = () => {
    localStorage.removeItem("token");
    navigate("/");
  };

  const itemClass = ({ isActive }) =>
    `flex items-center gap-3 p-3 rounded-lg transition ${
      isActive ? "bg-blue-700" : "hover:bg-blue-700"
    }`;

  return (
    <aside className="w-72 bg-blue-800 text-white min-h-screen">
      <div className="p-8">
        <h1 className="text-3xl font-bold">AI Debt Relief</h1>
        <p className="text-blue-200 mt-2 text-sm">
          Smart fintech analytics for your debt journey.
        </p>
      </div>

      <nav className="px-5 space-y-3">
        <NavLink to="/dashboard" className={itemClass}>
          <FaHome />
          Dashboard
        </NavLink>

        <NavLink to="/loans" className={itemClass}>
          <FaMoneyBillWave />
          Loans
        </NavLink>

        <NavLink to="/ai" className={itemClass}>
          <FaRobot />
          AI Insights
        </NavLink>

        <NavLink to="/profile" className={itemClass}>
          <FaUser />
          Profile
        </NavLink>

        <NavLink to="/settings" className={itemClass}>
          <FaUser />
          Settings
        </NavLink>

        <button
          onClick={logout}
          className="w-full flex items-center gap-3 p-3 rounded-lg bg-red-500 hover:bg-red-600 mt-10"
        >
          <FaSignOutAlt />
          Logout
        </button>
      </nav>
    </aside>
  );
}
