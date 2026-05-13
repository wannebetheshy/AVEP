import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import type { Instance, Session } from "../../domain/types";
import {
  loginAdmin,
  loginUser,
  logoutUser,
  readSession,
  registerUser,
} from "../../adapters/authAdapter";
import {
  deployInstance as deployInstanceApi,
  extendInstance as extendInstanceApi,
  getInstanceStatus,
  terminateInstance as terminateInstanceApi,
} from "../../adapters/instanceAdapter";

interface AuthContextValue {
  session: Session | null;
  instance: Instance | null;
  isAdmin: boolean;
  isAuthenticated: boolean;
  loginUser: (identity: string, password: string) => Promise<void>;
  registerUser: (
    email: string,
    username: string,
    password: string,
  ) => Promise<void>;
  loginAdmin: (username: string, password: string) => Promise<void>;
  logoutUser: () => Promise<void>;
  refreshInstance: () => Promise<void>;
  deployInstance: (taskId: string) => Promise<void>;
  extendInstance: () => Promise<void>;
  terminateInstance: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(() => readSession());
  const [instance, setInstance] = useState<Instance | null>(null);

  const isAuthenticated = !!session;
  const isAdmin = session?.user.role === "admin";

  const refreshInstance = useCallback(async () => {
    if (!session) {
      setInstance(null);
      return;
    }

    const latest = await getInstanceStatus(session.user.id);
    setInstance(latest);
  }, [session]);

  useEffect(() => {
    let active = true;

    const load = async () => {
      if (!session) {
        setInstance(null);
        return;
      }

      const latest = await getInstanceStatus(session.user.id);
      if (active) {
        setInstance(latest);
      }
    };

    load();

    return () => {
      active = false;
    };
  }, [session]);

  const handleLoginUser = useCallback(
    async (identity: string, password: string) => {
      const nextSession = await loginUser(identity, password);
      setSession(nextSession);
    },
    [],
  );

  const handleRegisterUser = useCallback(
    async (email: string, username: string, password: string) => {
      const nextSession = await registerUser(email, username, password);
      setSession(nextSession);
    },
    [],
  );

  const handleLoginAdmin = useCallback(
    async (username: string, password: string) => {
      const nextSession = await loginAdmin(username, password);
      setSession(nextSession);
    },
    [],
  );

  const handleLogoutUser = useCallback(async () => {
    await logoutUser();
    setSession(null);
    setInstance(null);
  }, []);

  const deployInstance = useCallback(
    async (taskId: string) => {
      if (!session) return;
      const latest = await deployInstanceApi(session.user.id, taskId);
      setInstance(latest);
    },
    [session],
  );

  const extendInstance = useCallback(async () => {
    if (!session) return;
    const latest = await extendInstanceApi(session.user.id);
    setInstance(latest);
  }, [session]);

  const terminateInstance = useCallback(async () => {
    if (!session) return;
    await terminateInstanceApi(session.user.id);
    setInstance(null);
  }, [session]);

  const value = useMemo(
    () => ({
      session,
      instance,
      isAdmin,
      isAuthenticated,
      loginUser: handleLoginUser,
      registerUser: handleRegisterUser,
      loginAdmin: handleLoginAdmin,
      logoutUser: handleLogoutUser,
      refreshInstance,
      deployInstance,
      extendInstance,
      terminateInstance,
    }),
    [
      session,
      instance,
      isAdmin,
      isAuthenticated,
      handleLoginUser,
      handleRegisterUser,
      handleLoginAdmin,
      handleLogoutUser,
      refreshInstance,
      deployInstance,
      extendInstance,
      terminateInstance,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
