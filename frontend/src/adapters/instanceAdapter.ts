import type { Instance } from "../domain/types";
import { MOCK_DELAY_MS } from "./constants";
import { logEvents } from "./logEvents";
import { logger } from "./logger";
import {
  buildInstanceUrl,
  getInstanceByUser,
  getInstanceConfig,
  getTasks,
  removeInstanceForUser,
  setInstanceForUser,
  sleep,
  toInstance,
  generateId,
} from "./inMemoryStore";

export const getInstanceStatus = async (
  userId: string,
): Promise<Instance | null> => {
  await sleep(MOCK_DELAY_MS);

  const record = getInstanceByUser(userId);
  const instance = record ? toInstance(record) : null;
  logger.info(logEvents.instanceStatus, { userId, active: !!instance });
  return instance;
};

export const deployInstance = async (userId: string, taskId: string) => {
  logger.info(logEvents.instanceDeployAttempt, { userId, taskId });
  const existing = getInstanceByUser(userId);
  if (existing) {
    logger.warn(logEvents.instanceDeployBlocked, { userId, taskId });
    throw new Error("Only one instance can run at a time");
  }

  const task = getTasks().find((item) => item.id === taskId);
  if (!task) {
    logger.warn(logEvents.instanceDeployMissingTask, { userId, taskId });
    throw new Error("Task not found");
  }

  const now = new Date();
  const uuid = generateId();
  const record = {
    uuid,
    taskId: task.id,
    taskName: task.name,
    status: "deploying" as const,
    url: buildInstanceUrl(uuid),
    createdAt: now,
    expiresAt: new Date(now.getTime() + getInstanceConfig().instanceLifetimeMs),
    extensionsCount: 0,
  };

  setInstanceForUser(userId, record);

  await sleep(MOCK_DELAY_MS);

  const activeRecord = {
    ...record,
    status: "active" as const,
  };

  setInstanceForUser(userId, activeRecord);
  logger.info(logEvents.instanceDeploySuccess, {
    userId,
    taskId,
    instanceId: activeRecord.uuid,
  });
  return toInstance(activeRecord);
};

export const extendInstance = async (userId: string) => {
  await sleep(MOCK_DELAY_MS);
  logger.info(logEvents.instanceExtendAttempt, { userId });

  const record = getInstanceByUser(userId);
  if (!record) {
    logger.warn(logEvents.instanceExtendMissing, { userId });
    throw new Error("No active instance found");
  }

  const remaining = record.expiresAt.getTime() - Date.now();
  if (remaining >= getInstanceConfig().extensionThresholdMs) {
    logger.warn(logEvents.instanceExtendTooEarly, { userId });
    throw new Error("Extension is only available in the last 15 minutes");
  }

  const updatedRecord = {
    ...record,
    expiresAt: new Date(record.expiresAt.getTime() + getInstanceConfig().extensionMs),
    extensionsCount: record.extensionsCount + 1,
  };

  setInstanceForUser(userId, updatedRecord);
  logger.info(logEvents.instanceExtendSuccess, {
    userId,
    instanceId: updatedRecord.uuid,
    extensionsCount: updatedRecord.extensionsCount,
  });
  return toInstance(updatedRecord);
};

export const terminateInstance = async (userId: string) => {
  await sleep(MOCK_DELAY_MS);
  logger.info(logEvents.instanceTerminateAttempt, { userId });

  const record = getInstanceByUser(userId);
  if (!record) {
    logger.warn(logEvents.instanceTerminateMissing, { userId });
    throw new Error("No active instance found");
  }

  removeInstanceForUser(userId);
  logger.info(logEvents.instanceTerminateSuccess, {
    userId,
    instanceId: record.uuid,
  });
  return record.uuid;
};
