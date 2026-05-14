import type { AdminInstance } from "../domain/types";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

export const listAdminInstances = async (): Promise<AdminInstance[]> => {
  logger.info(logEvents.adminInstancesList, { count: 0 });
  // TODO: Call backend endpoint when available
  return [];
};

export const forceTerminateInstance = async (instanceId: string) => {
  logger.info(logEvents.adminInstancesForceTerminateAttempt, { instanceId });
  throw new Error("Force termination not yet implemented");
};
