export type Role = "user" | "admin";

export interface User {
  id: string;
  username: string;
  email: string;
  role: Role;
}

export interface Session {
  token: string;
  user: User;
}

export interface Task {
  id: string;
  name: string;
  description: string;
  difficulty: "Beginner" | "Intermediate" | "Advanced";
  category?: string;
}

export type InstanceStatus = "deploying" | "active";

export interface Instance {
  uuid: string;
  taskId: string;
  taskName: string;
  status: InstanceStatus;
  url: string;
  createdAt: Date;
  expiresAt: Date;
  timeRemainingMs: number;
  extensionsCount: number;
}

export interface AdminInstance extends Instance {
  userId: string;
  username: string;
}
