import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ShieldCheck } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const INITIAL_FORM = {
  username: "",
  password: "",
};

export default function AdminLogin() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { loginAdmin } = useAuth();
  const navigate = useNavigate();
  const adminUsername = import.meta.env.VITE_ADMIN_USERNAME;
  const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD;

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
      await loginAdmin(form.username, form.password);
      navigate("/admin");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Admin authentication failed",
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-zinc-950 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <div className="flex items-center justify-center mb-4">
            <ShieldCheck className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl text-zinc-100 mb-2">AVEP Admin</h1>
          <p className="text-sm text-zinc-500">Administrative Access</p>
        </div>

        <div className="bg-zinc-900 border border-red-900/30 rounded-lg p-6">
          <h2 className="text-lg text-zinc-100 mb-6">Admin Login</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">
                Admin Username
              </Label>
              <Input
                id="username"
                type="text"
                value={form.username}
                onChange={updateField("username")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Enter admin username"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="password" className="text-zinc-300">
                Admin Password
              </Label>
              <Input
                id="password"
                type="password"
                value={form.password}
                onChange={updateField("password")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Enter admin password"
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
              className="w-full bg-red-900 hover:bg-red-800"
            >
              {loading ? "Authenticating..." : "Admin Login"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-sm">
            <p className="text-zinc-400">
              User access?{" "}
              <Link
                to="/login"
                className="text-zinc-300 hover:text-zinc-100 underline"
              >
                User Login
              </Link>
            </p>
          </div>
        </div>

        <div className="mt-4 p-3 bg-zinc-900/50 border border-zinc-800 rounded text-xs text-zinc-500">
          Demo credentials: {adminUsername ?? "NO_ADMIN_USERNAME"} /{" "}
          {adminPassword ?? "NO_ADMIN_PASSWORD"}
        </div>
      </div>
    </div>
  );
}
