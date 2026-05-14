import type { Task } from "../domain/types";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

// Mock tasks for now - backend endpoints coming soon
const MOCK_TASKS: Task[] = [
  {
    id: "sql-injection-101",
    name: "SQL Injection Basics",
    description: "Learn the fundamentals of SQL injection vulnerabilities",
    difficulty: "Beginner",
    category: "Web Security",
  },
  {
    id: "xss-basics",
    name: "Cross-Site Scripting (XSS)",
    description: "Understand XSS attacks and how to prevent them",
    difficulty: "Beginner",
    category: "Web Security",
  },
  {
    id: "buffer-overflow",
    name: "Buffer Overflow Attacks",
    description: "Exploit buffer overflow vulnerabilities in C programs",
    difficulty: "Intermediate",
    category: "Low-Level Security",
  },
  {
    id: "privilege-escalation",
    name: "Privilege Escalation",
    description: "Practice techniques to gain higher access levels",
    difficulty: "Intermediate",
    category: "System Security",
  },
  {
    id: "race-condition",
    name: "Race Condition Exploitation",
    description: "Exploit race conditions in concurrent systems",
    difficulty: "Advanced",
    category: "System Security",
  },
  {
    id: "cryptanalysis",
    name: "Cryptanalysis Challenge",
    description: "Break cryptographic implementations",
    difficulty: "Advanced",
    category: "Cryptography",
  },
];

export const listTasks = async (): Promise<Task[]> => {
  logger.info(logEvents.tasksList, { count: MOCK_TASKS.length });
  return MOCK_TASKS;
};

export const listAvailableTasks = listTasks;
