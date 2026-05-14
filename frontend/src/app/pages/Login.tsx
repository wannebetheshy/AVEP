import type { ChangeEvent, FormEvent } from "react";
import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const INITIAL_FORM = {
  identity: "",
  password: "",
};

export default function Login() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginUser, isAuthenticated, isAdmin, isLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isLoading || !isAuthenticated) {
      return;
    }

    navigate(isAdmin ? "/admin" : "/dashboard", { replace: true });
  }, [isAuthenticated, isAdmin, isLoading, navigate]);

  const updateField =
    (field: keyof typeof INITIAL_FORM) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      await loginUser(form.identity, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <Terminal className="w-8 h-8 text-zinc-400" />
          </div>
          <h1 className="text-2xl text-zinc-100 mb-2">AVEP</h1>
          <p className="text-sm text-zinc-500">
            Automated Vulnerable Environment Provisioning
          </p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 rounded-lg p-6">
          <h2 className="text-lg text-zinc-100 mb-6">User Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="identity" className="text-zinc-300">
                Username or email
              </Label>
              <Input
                id="identity"
                type="text"
                value={form.identity}
                onChange={updateField("identity")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Enter username or email"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Password
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={updateField("password")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Enter password"
              />
            </div>

            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <Button
              type="submit"
              disabled={loading}
              className="w-full bg-zinc-700 hover:bg-zinc-600"
            >
              {loading ? "Authenticating..." : "Login"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 space-y-3 text-sm">
            <p className="text-zinc-400">
              Don't have an account?{" "}
              <Link
                to="/register"
                className="text-zinc-300 hover:text-zinc-100 underline"
              >
                Register
              </Link>
            </p>
            <p className="text-zinc-400">
              Admin access?{" "}
              <Link
                to="/admin-login"
                className="text-zinc-300 hover:text-zinc-100 underline"
              >
                Admin Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
