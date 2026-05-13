import type { ChangeEvent, FormEvent } from "react";
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Terminal } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Alert, AlertDescription } from "../components/ui/alert";
import { Button } from "../components/ui/button";
import { Input } from "../components/ui/input";
import { Label } from "../components/ui/label";

const INITIAL_FORM = {
  email: "",
  username: "",
  password: "",
  confirmPassword: "",
};

export default function Register() {
  const [form, setForm] = useState(INITIAL_FORM);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { registerUser } = useAuth();
  const navigate = useNavigate();

  const updateField =
    (field: keyof typeof INITIAL_FORM) =>
    (event: ChangeEvent<HTMLInputElement>) => {
      setForm((prev) => ({ ...prev, [field]: event.target.value }));
    };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");

    if (form.password !== form.confirmPassword) {
      setError("Passwords do not match");
      return;
    }

    if (form.password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      await registerUser(form.email, form.username, form.password);
      navigate("/dashboard");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
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
          <h2 className="text-lg text-zinc-100 mb-6">Create Account</h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email" className="text-zinc-300">
                Email
              </Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={updateField("email")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="email@example.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="username" className="text-zinc-300">
                Username
              </Label>
              <Input
                id="username"
                type="text"
                value={form.username}
                onChange={updateField("username")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Choose username"
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
                placeholder="Minimum 8 characters"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword" className="text-zinc-300">
                Confirm Password
              </Label>
              <Input
                id="confirmPassword"
                type="password"
                value={form.confirmPassword}
                onChange={updateField("confirmPassword")}
                required
                className="bg-zinc-950 border-zinc-800 text-zinc-100"
                placeholder="Re-enter password"
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
              {loading ? "Creating account..." : "Register"}
            </Button>
          </form>

          <div className="mt-6 pt-6 border-t border-zinc-800 text-sm">
            <p className="text-zinc-400">
              Already have an account?{" "}
              <Link
                to="/login"
                className="text-zinc-300 hover:text-zinc-100 underline"
              >
                Login
              </Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
