import type { Instance, Task, User } from "../domain/types";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

const DEFAULT_INSTANCE_LIFETIME_MS = 60 * 60 * 1000;
const DEFAULT_EXTENSION_MS = 30 * 60 * 1000;

export const APP_CONSTANTS = {
  instanceLifetimeMs: DEFAULT_INSTANCE_LIFETIME_MS,
  extensionMs: DEFAULT_EXTENSION_MS,
  extensionThresholdMs: 15 * 60 * 1000,
};

type UserRecord = User & { password: string };

type InstanceRecord = Omit<Instance, "timeRemainingMs">;

const ADMIN_USERNAME = import.meta.env.VITE_ADMIN_USERNAME ?? "admin";
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD ?? "admin";

const users: UserRecord[] = [
  {
    id: "admin",
    username: ADMIN_USERNAME,
    email: "admin@avep.local",
    role: "admin",
    password: ADMIN_PASSWORD,
  },
  {
    id: "user-alice",
    username: "alice",
    email: "alice@avep.local",
    role: "user",
    password: "password123",
  },
  {
    id: "user-bob",
    username: "bob",
    email: "bob@avep.local",
    role: "user",
    password: "password123",
  },
];

const tasks: Task[] = [
  {
    id: "sql-injection",
    name: "SQL Injection Lab",
    description: "Practice SQL injection techniques on a vulnerable web application",
    difficulty: "Beginner",
    category: "Web",
  },
  {
    id: "xss-challenge",
    name: "XSS Challenge",
    description: "Exploit cross-site scripting vulnerabilities",
    difficulty: "Intermediate",
    category: "Web",
  },
  {
    id: "buffer-overflow",
    name: "Buffer Overflow",
    description: "Binary exploitation and memory corruption",
    difficulty: "Advanced",
    category: "Binary",
  },
  {
    id: "path-traversal",
    name: "Path Traversal",
    description: "File system access control bypass",
    difficulty: "Beginner",
    category: "Web",
  },
  {
    id: "csrf-lab",
    name: "CSRF Lab",
    description: "Cross-site request forgery exploitation",
    difficulty: "Intermediate",
    category: "Web",
  },
  {
    id: "race-condition",
    name: "Race Condition",
    description: "Time-based exploitation scenarios",
    difficulty: "Advanced",
    category: "Logic",
  },
];

const instancesByUser = new Map<string, InstanceRecord>();

const seedInstances = () => {
  const now = new Date();

  const aliceInstance: InstanceRecord = {
    uuid: "mock-alice-001",
    taskId: "sql-injection",
    taskName: "SQL Injection Lab",
    status: "active",
    url: buildInstanceUrl("mock-alice-001"),
    createdAt: new Date(now.getTime() - 20 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 40 * 60 * 1000),
    extensionsCount: 0,
  };

  const bobInstance: InstanceRecord = {
    uuid: "mock-bob-002",
    taskId: "xss-challenge",
    taskName: "XSS Challenge",
    status: "active",
    url: buildInstanceUrl("mock-bob-002"),
    createdAt: new Date(now.getTime() - 50 * 60 * 1000),
    expiresAt: new Date(now.getTime() + 8 * 60 * 1000),
    extensionsCount: 1,
  };

  instancesByUser.set("user-alice", aliceInstance);
  instancesByUser.set("user-bob", bobInstance);

  logger.info(logEvents.mockInstancesSeeded, {
    count: instancesByUser.size,
    users: Array.from(instancesByUser.keys()),
  });
};

const safeRandom = () => Math.random().toString(36).slice(2, 10);

export const sleep = (ms: number) =>
  new Promise<void>((resolve) => setTimeout(resolve, ms));

export const generateId = () => {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }

  return `id_${safeRandom()}`;
};

export const buildInstanceUrl = (uuid: string) =>
  `https://lab-${uuid.slice(0, 8)}.avep.local`;

export const getUsers = () => users;

export const addUser = (user: UserRecord) => {
  users.push(user);
};

export const getTasks = () => tasks;

export const getInstanceByUser = (userId: string) =>
  instancesByUser.get(userId) ?? null;

export const setInstanceForUser = (userId: string, instance: InstanceRecord) => {
  instancesByUser.set(userId, instance);
};

export const removeInstanceForUser = (userId: string) => {
  instancesByUser.delete(userId);
};

export const getAllInstances = () => Array.from(instancesByUser.entries());

export const toInstance = (record: InstanceRecord): Instance => {
  const remaining = Math.max(0, record.expiresAt.getTime() - Date.now());

  return {
    ...record,
    timeRemainingMs: remaining,
  };
};

export const getInstanceConfig = () => APP_CONSTANTS;

seedInstances();
