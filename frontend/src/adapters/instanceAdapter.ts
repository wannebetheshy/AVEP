import type { Instance } from "../domain/types";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

export const getInstanceStatus = async (
  userId: string,
): Promise<Instance | null> => {
  logger.info(logEvents.instanceStatus, { userId, active: false });
  // TODO: Call backend endpoint when available
  return null;
};

export const deployInstance = async (
  userId: string,
  taskId: string,
): Promise<Instance> => {
  logger.info(logEvents.instanceDeployAttempt, { userId, taskId });

  // Mock deployment for now
  const now = new Date();
  const expiresAt = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour

  const instance: Instance = {
    uuid: `mock-${Math.random().toString(36).substring(7)}`,
    taskId,
    taskName: "Mock Task",
    status: "active",
    url: "https://instance.local",
    createdAt: now,
    expiresAt,
    extensionsCount: 0,
    timeRemainingMs: 60 * 60 * 1000,
  };

  logger.info(logEvents.instanceDeploySuccess, {
    userId,
    taskId,
    instanceId: instance.uuid,
  });

  return instance;
};

export const extendInstance = async (userId: string): Promise<Instance> => {
  logger.info(logEvents.instanceExtendAttempt, { userId });
  throw new Error("Extension not yet implemented");
};

export const terminateInstance = async (userId: string): Promise<string> => {
  logger.info(logEvents.instanceTerminateAttempt, { userId });
  throw new Error("Termination not yet implemented");
};
