import React from "react";
import { useRouter } from "next/router";
import { DM_Sans } from "next/font/google";
import { Card, CardBody, Button, Input } from "@heroui/react";
import Link from "next/link";
import { loginWithEmail, signupWithEmail } from "@/lib/auth";

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  const [isSignup, setIsSignup] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      if (!email || !password) {
        setError("Email and password are required");
        setLoading(false);
        return;
      }

      const result = isSignup
        ? await signupWithEmail(email, password)
        : await loginWithEmail(email, password);

      if (result.success) {
        router.push("/");
      } else {
        setError(result.error || "Authentication failed");
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className={`${dmSans.className} flex min-h-screen flex-col bg-gradient-to-b from-emerald-50 via-white to-teal-50 text-slate-900`}
    >
      <header className="flex items-center justify-between px-6 py-4">
        <Link href="/" className="flex items-center gap-2 hover:opacity-90">
          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 text-xs font-semibold text-white shadow-sm">
            SP
          </div>
          <span className="text-sm font-medium tracking-tight text-slate-800">
            Smart Pantry
          </span>
        </Link>
      </header>

      <main className="flex flex-1 items-center justify-center px-4 pb-10 pt-2">
        <div className="w-full max-w-md">
          <Card shadow="sm" className="border-none bg-white/70 backdrop-blur-md">
            <CardBody className="gap-6 p-6 sm:p-8">
              <div className="space-y-2 text-center">
                <h1 className="text-2xl font-semibold tracking-tight text-slate-900">
                  {isSignup ? "Create Account" : "Welcome Back"}
                </h1>
                <p className="text-sm text-slate-500">
                  {isSignup
                    ? "Sign up to manage your pantry"
                    : "Sign in to your Smart Pantry account"}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Email
                  </label>
                  <Input
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-slate-700">
                    Password
                  </label>
                  <Input
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="mt-1"
                    size="lg"
                    variant="bordered"
                  />
                </div>

                {error && (
                  <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                    {error}
                  </div>
                )}

                <Button
                  type="submit"
                  isDisabled={loading}
                  className="h-10 rounded-lg bg-slate-900 text-sm font-semibold text-white hover:bg-slate-800"
                >
                  {loading
                    ? "Loading…"
                    : isSignup
                    ? "Create Account"
                    : "Sign In"}
                </Button>
              </form>

              <div className="text-center">
                <p className="text-xs text-slate-500">
                  {isSignup ? "Already have an account?" : "Don't have an account?"}
                  <button
                    type="button"
                    onClick={() => {
                      setIsSignup(!isSignup);
                      setError("");
                    }}
                    className="ml-1 font-medium text-emerald-600 hover:text-emerald-700"
                  >
                    {isSignup ? "Sign in" : "Sign up"}
                  </button>
                </p>
              </div>
            </CardBody>
          </Card>

          <p className="mt-6 text-center text-xs text-slate-400">
            Demo user: <span className="font-medium">ash@example.com</span>
          </p>
        </div>
      </main>
    </div>
  );
}
