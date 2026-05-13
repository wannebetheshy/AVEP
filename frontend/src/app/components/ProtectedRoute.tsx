import { useEffect } from "react";
import type { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";

interface ProtectedRouteProps {
  children: ReactNode;
  requireAdmin?: boolean;
}

export function ProtectedRoute({
  children,
  requireAdmin = false,
}: ProtectedRouteProps) {
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    if (!isAuthenticated) return;

    if (requireAdmin && !isAdmin) {
      toast.error("Admin access required");
    }
  }, [isAuthenticated, isAdmin, requireAdmin]);

  if (!isAuthenticated) {
    return <Navigate to={requireAdmin ? "/admin-login" : "/login"} replace />;
  }

  if (requireAdmin && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  if (!requireAdmin && isAdmin) {
    return <Navigate to="/admin" replace />;
  }

  return <>{children}</>;
}
