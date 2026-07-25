import AuthLogo from "../components/auth/AuthLogo";

export default function AuthLayout({ children }) {
  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">

      <div className="w-full max-w-6xl bg-white rounded-3xl shadow-2xl overflow-hidden grid lg:grid-cols-2">

        {/* Left Section */}

        <div className="bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-900 text-white p-14 flex flex-col justify-center">

          <AuthLogo />

          <h1 className="text-5xl font-bold mt-12 leading-tight">
            AI Powered
            <br />
            Debt Relief
          </h1>

          <p className="mt-8 text-blue-100 text-lg leading-8">

            Manage your debts smarter using Artificial Intelligence.

            <br /><br />

            ✔ AI Settlement Planning

            <br />

            ✔ Budget Optimization

            <br />

            ✔ Risk Analysis

            <br />

            ✔ EMI Optimization

            <br />

            ✔ Estimated CIBIL

            <br />

            ✔ Become Debt Free

          </p>

        </div>

        {/* Right Section */}

        <div className="flex items-center justify-center p-12">

          {children}

        </div>

      </div>

    </div>
  );
}