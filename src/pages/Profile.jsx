import { useCallback, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import DashboardLayout from "../layouts/DashboardLayout";
import api from "../services/api";
import { showError, showSuccess } from "../utils/notification";

export default function Profile() {
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const { register, handleSubmit, reset } = useForm();
  const { register: registerPassword, handleSubmit: handleSubmitPassword, reset: resetPassword } = useForm();

  const fetchProfile = useCallback(async () => {
    setLoading(true);
    try {
      const response = await api.get("/profile/me");
      setProfile(response.data);
      reset(response.data);
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to fetch profile");
    } finally {
      setLoading(false);
    }
  }, [reset]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const onSubmit = async (values) => {
    setSaving(true);
    try {
      await api.put("/profile/me", values);
      showSuccess("Profile updated successfully");
      fetchProfile();
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to update profile");
    } finally {
      setSaving(false);
    }
  };

  const onPasswordChange = async (values) => {
    setPasswordSaving(true);
    try {
      await api.put("/profile/change-password", values);
      showSuccess("Password updated successfully");
      resetPassword();
    } catch (err) {
      showError(err?.response?.data?.detail || err.message || "Unable to update password");
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-4xl font-bold">Profile</h1>
            <p className="text-gray-600">Manage your personal and financial profile details.</p>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Personal Information</h2>
            {loading ? (
              <p className="text-gray-500">Loading profile...</p>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700">Full Name</label>
                  <input
                    {...register("name")}
                    defaultValue={profile?.name || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Email address</label>
                  <input
                    {...register("email")}
                    defaultValue={profile?.email || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Monthly Income</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("monthly_income")}
                    defaultValue={profile?.monthly_income || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Monthly Expenses</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("monthly_expenses")}
                    defaultValue={profile?.monthly_expenses || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Savings</label>
                  <input
                    type="number"
                    step="0.01"
                    {...register("savings")}
                    defaultValue={profile?.savings || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700">Financial Goal</label>
                  <input
                    {...register("financial_goal")}
                    defaultValue={profile?.financial_goal || ""}
                    className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                  />
                </div>
                <button type="submit" disabled={saving} className="mt-2 rounded-full bg-blue-700 px-6 py-3 text-white hover:bg-blue-800 transition">
                  {saving ? "Saving..." : "Save Profile"}
                </button>
              </form>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow p-6">
            <h2 className="text-2xl font-semibold mb-4">Change Password</h2>
            <form onSubmit={handleSubmitPassword(onPasswordChange)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-slate-700">Current Password</label>
                <input
                  type="password"
                  {...registerPassword("old_password")}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700">New Password</label>
                <input
                  type="password"
                  {...registerPassword("new_password")}
                  className="mt-2 w-full rounded-2xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
                />
              </div>
              <button type="submit" disabled={passwordSaving} className="mt-2 rounded-full bg-slate-900 px-6 py-3 text-white hover:bg-slate-800 transition">
                {passwordSaving ? "Updating..." : "Update Password"}
              </button>
            </form>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
