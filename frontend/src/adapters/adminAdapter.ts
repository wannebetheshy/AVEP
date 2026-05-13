import type { AdminInstance } from "../domain/types";
import { MOCK_DELAY_MS } from "./constants";
import { logEvents } from "./logEvents";
import { logger } from "./logger";
import {
  getAllInstances,
  getUsers,
  removeInstanceForUser,
  sleep,
  toInstance,
} from "./inMemoryStore";

export const listAdminInstances = async (): Promise<AdminInstance[]> => {
  await sleep(MOCK_DELAY_MS);

  const users = getUsers();

  const instances = getAllInstances().map(([userId, record]) => {
    const user = users.find((item) => item.id === userId);
    const instance = toInstance(record);

    return {
      ...instance,
      userId,
      username: user?.username ?? "unknown",
    };
  });

  logger.info(logEvents.adminInstancesList, { count: instances.length });
  return instances;
};

export const forceTerminateInstance = async (instanceId: string) => {
  await sleep(MOCK_DELAY_MS);
  logger.info(logEvents.adminInstancesForceTerminateAttempt, { instanceId });

  const entry = getAllInstances().find(([, record]) => record.uuid === instanceId);
  if (!entry) {
    logger.warn(logEvents.adminInstancesForceTerminateMissing, { instanceId });
    throw new Error("Instance not found");
  }

  const [userId] = entry;
  removeInstanceForUser(userId);

  logger.info(logEvents.adminInstancesForceTerminateSuccess, {
    instanceId,
    userId,
  });
  return instanceId;
};
