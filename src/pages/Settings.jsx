import { useState } from "react";
import DashboardLayout from "../layouts/DashboardLayout";

export default function Settings() {
  const [darkMode, setDarkMode] = useState(false);
  const [currency, setCurrency] = useState("INR");
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div>
          <h1 className="text-4xl font-bold">Settings</h1>
          <p className="text-gray-600 mt-2">Manage your preferences for the dashboard experience.</p>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Appearance</h2>
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold">Dark Mode</p>
                <p className="text-sm text-slate-500">Enable a night-friendly dashboard theme.</p>
              </div>
              <button
                onClick={() => setDarkMode((prev) => !prev)}
                className={`rounded-full px-5 py-2 font-semibold transition ${darkMode ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {darkMode ? "Enabled" : "Disabled"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Notifications</h2>
            <div className="flex items-center justify-between gap-4 rounded-3xl border border-slate-200 p-4">
              <div>
                <p className="font-semibold">Email Alerts</p>
                <p className="text-sm text-slate-500">Receive loan reminders and budget updates.</p>
              </div>
              <button
                onClick={() => setNotificationsEnabled((prev) => !prev)}
                className={`rounded-full px-5 py-2 font-semibold transition ${notificationsEnabled ? "bg-blue-700 text-white" : "bg-slate-100 text-slate-700"}`}
              >
                {notificationsEnabled ? "On" : "Off"}
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-3xl shadow p-6">
          <h2 className="text-2xl font-semibold mb-4">Preferences</h2>
          <div className="space-y-4">
            <label className="block text-sm font-medium text-slate-700">Currency</label>
            <select
              value={currency}
              onChange={(event) => setCurrency(event.target.value)}
              className="w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
            >
              <option value="INR">INR</option>
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
            </select>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
