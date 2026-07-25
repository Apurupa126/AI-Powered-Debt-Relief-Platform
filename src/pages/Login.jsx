import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useForm } from "react-hook-form";
import AuthLayout from "../layouts/AuthLayout";
import api from "../services/api";
import { formatApiError, showError, showSuccess } from "../utils/notification";

export default function Login() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const { register, handleSubmit } = useForm();

  const loginUser = async (values) => {
    setLoading(true);
    try {
      const response = await api.post("/auth/login", values);
      localStorage.setItem("token", response.data.access_token);
      showSuccess("Login successful");
      navigate("/dashboard");
    } catch (err) {
      showError(formatApiError(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthLayout>
      <div className="w-full max-w-md">
        <h2 className="text-4xl font-bold mb-3">Welcome Back</h2>
        <p className="text-slate-500 mb-8">Login to access your AI debt relief dashboard.</p>

        <form onSubmit={handleSubmit(loginUser)} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">Email</label>
            <input
              type="email"
              {...register("email", { required: true })}
              placeholder="you@example.com"
              className="mt-2 w-full rounded-3xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              {...register("password", { required: true })}
              placeholder="Enter your password"
              className="mt-2 w-full rounded-3xl border border-slate-300 px-4 py-3 focus:border-blue-600 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            className="w-full rounded-full bg-blue-700 px-6 py-3 text-white font-semibold hover:bg-blue-800 transition"
          >
            {loading ? "Signing in..." : "Login"}
          </button>

          <p className="text-center text-slate-500">
            Don&apos;t have an account?{' '}
            <Link to="/register" className="font-semibold text-blue-700 hover:underline">
              Register
            </Link>
          </p>
        </form>
      </div>
    </AuthLayout>
  );
}
