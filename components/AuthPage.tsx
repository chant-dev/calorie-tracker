"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { LoaderIcon, EyeIcon, EyeOffIcon } from "lucide-react";
import { cn } from "@/lib/utils";

type Tab = "signin" | "signup";

export function AuthPage() {
  const [tab, setTab] = useState<Tab>("signin");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (tab === "signup") {
        const res = await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, password }),
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error || "Sign up failed");
          return;
        }
      }

      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError(tab === "signin" ? "Invalid email or password" : "Sign in failed after registration");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn("google", { callbackUrl: "/" });
  };

  return (
    <div className="min-h-screen bg-bg flex flex-col items-center justify-center px-4">
      <div className="w-full max-w-[400px]">
        {/* Logo */}
        <div className="text-center mb-8">
          <h1 className="text-[28px] font-bold tracking-tight text-text">Calories</h1>
          <p className="text-[15px] text-text-muted mt-1">Track what matters.</p>
        </div>

        {/* Card */}
        <div className="bg-surface rounded-3xl border border-border/60 p-6 shadow-sm">
          {/* Tabs */}
          <div className="flex bg-surface-raised rounded-xl p-1 gap-1 mb-5">
            <button
              onClick={() => { setTab("signin"); setError(""); }}
              className={cn(
                "flex-1 py-2 text-[14px] font-medium rounded-lg transition-all",
                tab === "signin" ? "bg-surface text-text shadow-sm" : "text-text-secondary hover:text-text"
              )}
            >
              Sign in
            </button>
            <button
              onClick={() => { setTab("signup"); setError(""); }}
              className={cn(
                "flex-1 py-2 text-[14px] font-medium rounded-lg transition-all",
                tab === "signup" ? "bg-surface text-text shadow-sm" : "text-text-secondary hover:text-text"
              )}
            >
              Create account
            </button>
          </div>

          {/* Google button */}
          <button
            onClick={handleGoogle}
            disabled={googleLoading}
            className="w-full flex items-center justify-center gap-3 bg-surface-raised hover:bg-border/30 border border-border/60 text-text text-[14px] font-medium py-3 rounded-2xl transition-colors mb-4"
          >
            {googleLoading ? (
              <LoaderIcon className="w-4 h-4 animate-spin text-text-muted" />
            ) : (
              <GoogleIcon />
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-[12px] text-text-muted">or</span>
            <div className="flex-1 h-px bg-border" />
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3">
            {tab === "signup" && (
              <input
                type="text"
                placeholder="Name (optional)"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-surface-raised rounded-xl px-4 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
              />
            )}

            <input
              type="email"
              placeholder="Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full bg-surface-raised rounded-xl px-4 py-3 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
            />

            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={tab === "signup" ? 8 : undefined}
                className="w-full bg-surface-raised rounded-xl px-4 py-3 pr-11 text-[15px] text-text placeholder:text-text-muted border border-transparent focus:border-accent/50 focus:bg-white focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-text-muted hover:text-text transition-colors"
              >
                {showPassword ? <EyeOffIcon className="w-4 h-4" /> : <EyeIcon className="w-4 h-4" />}
              </button>
            </div>

            {tab === "signup" && (
              <p className="text-[12px] text-text-muted px-1">Minimum 8 characters</p>
            )}

            {error && (
              <p className="text-[13px] text-danger px-1">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email || !password}
              className={cn(
                "w-full py-3.5 rounded-2xl text-[15px] font-semibold transition-all mt-1",
                !loading && email && password
                  ? "bg-accent hover:bg-accent-hover text-white active:scale-[0.98]"
                  : "bg-surface-raised text-text-muted cursor-not-allowed"
              )}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <LoaderIcon className="w-4 h-4 animate-spin" />
                  {tab === "signup" ? "Creating account…" : "Signing in…"}
                </span>
              ) : tab === "signup" ? (
                "Create account"
              ) : (
                "Sign in"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
      <path d="M17.64 9.2c0-.637-.057-1.251-.164-1.84H9v3.481h4.844c-.209 1.125-.843 2.078-1.796 2.717v2.258h2.908c1.702-1.567 2.684-3.874 2.684-6.615z" fill="#4285F4"/>
      <path d="M9 18c2.43 0 4.467-.806 5.956-2.18l-2.908-2.259c-.806.54-1.837.86-3.048.86-2.344 0-4.328-1.584-5.036-3.711H.957v2.332A8.997 8.997 0 0 0 9 18z" fill="#34A853"/>
      <path d="M3.964 10.71A5.41 5.41 0 0 1 3.682 9c0-.593.102-1.17.282-1.71V4.958H.957A8.996 8.996 0 0 0 0 9c0 1.452.348 2.827.957 4.042l3.007-2.332z" fill="#FBBC05"/>
      <path d="M9 3.58c1.321 0 2.508.454 3.44 1.345l2.582-2.58C13.463.891 11.426 0 9 0A8.997 8.997 0 0 0 .957 4.958L3.964 7.29C4.672 5.163 6.656 3.58 9 3.58z" fill="#EA4335"/>
    </svg>
  );
}
