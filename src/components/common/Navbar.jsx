export default function Navbar({ title = "Dashboard", userName = "User" }) {
  return (
    <header className="bg-white shadow px-8 py-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        <p className="text-gray-500">Welcome back, {userName} 👋</p>
      </div>

      <div className="flex items-center gap-4">
        <button className="rounded-full border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100">
          Notifications
        </button>
        <div className="w-12 h-12 rounded-full bg-blue-700 text-white flex items-center justify-center text-xl font-bold">
          {userName.charAt(0).toUpperCase()}
        </div>
      </div>
    </header>
  );
}
