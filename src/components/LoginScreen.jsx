import { useState } from "react";
import { useAuth } from "../context/AuthContext";
import { AlertCircle, Loader2 } from "lucide-react";
import Logo from "../assets/taskflow.png";

// SVG Google icon component
const GoogleIcon = () => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path
      fill="currentColor"
      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
    />
    <path
      fill="currentColor"
      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
    />
    <path
      fill="currentColor"
      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
    />
    <path
      fill="currentColor"
      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
    />
  </svg>
);

export default function LoginScreen() {
  const { login } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleGoogleLogin = async () => {
    setIsLoading(true);
    setError(null);
    try {
      await login();
    } catch (err) {
      setError("Failed to sign in. Please try again.");
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--background)] p-4">
      <div className="w-full max-w-md">
        {/* Logo Section */}
        <div className="text-center mb-8">
          <div className="relative inline-block mb-4">
            <img
              src={Logo}
              alt="TaskFlow"
              className="w-32 h-32 object-contain animate-pulse"
            />
            <div className="absolute inset-0 bg-[var(--primary)]/20 blur-xl rounded-full animate-pulse" />
          </div>
          <h1 className="text-3xl font-bold text-[var(--text)] mb-2">
            TaskFlow
          </h1>
          <p className="text-[var(--text-muted)]">Your tasks, everywhere</p>
        </div>

        {/* Login Card */}
        <div className="bg-[var(--surface)] border border-[var(--border)] rounded-2xl p-8 shadow-xl">
          <h2 className="text-xl font-semibold text-[var(--text)] mb-2 text-center">
            Welcome Back
          </h2>
          <p className="text-sm text-[var(--text-muted)] mb-6 text-center">
            Sign in to sync your tasks across all devices
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg flex items-center gap-2 text-red-500 text-sm">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          )}

          <button
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3 bg-[var(--surface-elevated)] hover:bg-[var(--surface-hover)] border border-[var(--border)] rounded-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed group"
          >
            {isLoading ? (
              <Loader2 className="w-5 h-5 animate-spin text-[var(--primary)]" />
            ) : (
              <div className="text-blue-500 group-hover:scale-110 transition-transform">
                <GoogleIcon />
              </div>
            )}
            <span className="font-medium text-[var(--text)]">
              {isLoading ? "Signing in..." : "Continue with Google"}
            </span>
          </button>

          <div className="mt-6 text-center">
            <p className="text-xs text-[var(--text-muted)]">
              By signing in, you agree to our Terms of Service and Privacy
              Policy
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="mt-8 grid grid-cols-3 gap-4 text-center">
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Create Lists</p>
          </div>
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Track Tasks</p>
          </div>
          <div className="p-3">
            <div className="w-10 h-10 mx-auto mb-2 rounded-lg bg-[var(--primary-muted)] flex items-center justify-center">
              <svg
                className="w-5 h-5 text-[var(--primary)]"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                />
              </svg>
            </div>
            <p className="text-xs text-[var(--text-muted)]">Cloud Sync</p>
          </div>
        </div>
      </div>
    </div>
  );
}
