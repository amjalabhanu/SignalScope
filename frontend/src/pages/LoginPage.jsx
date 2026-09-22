import { useState } from "react";
import { loginUser, getCurrentUser } from "../api";
import { useAuth } from "../auth/useAuth";

export default function LoginPage({ onSwitchToSignup }) {
  const { login } = useAuth();

  const [form, setForm] = useState({
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));

    if (error) {
      setError("");
    }
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setError("");

    if (!form.email.trim()) {
      setError("Please enter your email.");
      return;
    }

    if (!form.password) {
      setError("Please enter your password.");
      return;
    }

    setLoading(true);

    try {
      const response = await loginUser({
        email: form.email.trim(),
        password: form.password,
      });

      if (!response?.access_token) {
        throw new Error("Login succeeded but no access token was returned.");
      }

      const currentUser = await getCurrentUser(response.access_token);

      login(response.access_token, currentUser);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-[#f5f7fa] px-6 py-12">
      <div className="mx-auto max-w-md">
        <div className="mb-8">
          <p className="mb-2 text-sm font-semibold uppercase tracking-[0.2em] text-[#3157c8]">
            SignalScope
          </p>

          <h1 className="text-3xl font-bold tracking-tight text-[#172033]">
            Welcome back
          </h1>

          <p className="mt-2 text-sm text-[#687386]">
            Sign in to continue to your intelligence feed.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="rounded-2xl border border-[#dfe4ec] bg-white p-6 shadow-sm"
        >
          <div className="space-y-5">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#263044]">
                Email
              </span>

              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                autoComplete="email"
                disabled={loading}
                className="w-full rounded-lg border border-[#d5dbe5] px-3 py-2.5 text-sm outline-none transition focus:border-[#3157c8] focus:ring-2 focus:ring-[#3157c8]/15 disabled:bg-[#f5f7fa]"
                placeholder="you@example.com"
              />
            </label>

            <label className="block">
              <span className="mb-2 block text-sm font-medium text-[#263044]">
                Password
              </span>

              <input
                name="password"
                type="password"
                value={form.password}
                onChange={handleChange}
                autoComplete="current-password"
                disabled={loading}
                className="w-full rounded-lg border border-[#d5dbe5] px-3 py-2.5 text-sm outline-none transition focus:border-[#3157c8] focus:ring-2 focus:ring-[#3157c8]/15 disabled:bg-[#f5f7fa]"
                placeholder="Your password"
              />
            </label>
          </div>

          {error && (
            <div
              role="alert"
              className="mt-5 rounded-lg border border-[#e4b9b2] bg-[#fff5f3] px-3 py-2.5 text-sm text-[#a33b2b]"
            >
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-6 w-full rounded-lg bg-[#3157c8] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#2949aa] disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? "Signing in..." : "Sign in"}
          </button>

          <p className="mt-5 text-center text-sm text-[#687386]">
            Don't have an account?{" "}
            <button
              type="button"
              onClick={onSwitchToSignup}
              disabled={loading}
              className="font-semibold text-[#3157c8] hover:underline disabled:opacity-60"
            >
              Create an account
            </button>
          </p>
        </form>
      </div>
    </main>
  );
}