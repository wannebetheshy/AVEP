import type { Instance } from "../domain/types";
import { API_ENDPOINTS, ApiClient } from "./apiClient";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

const parseInstance = (data: {
  uuid: string;
  task_id: string;
  task_name: string;
  status: string;
  url: string;
  created_at: string;
  expires_at: string;
  time_remaining_ms: number;
  extensions_count?: number;
}): Instance => ({
  uuid: data.uuid,
  taskId: data.task_id,
  taskName: data.task_name,
  status: data.status === "running" ? "active" : (data.status as Instance["status"]),
  url: data.url,
  createdAt: new Date(data.created_at),
  expiresAt: new Date(data.expires_at),
  timeRemainingMs: data.time_remaining_ms,
  extensionsCount: data.extensions_count ?? 0,
});

export const getInstanceStatus = async (
  userId: string,
): Promise<Instance | null> => {
  const response = await ApiClient.get<{
    status: string;
    has_active_instance: boolean;
    instance: Parameters<typeof parseInstance>[0] | null;
  }>(API_ENDPOINTS.instanceStatus);

  logger.info(logEvents.instanceStatus, { userId, active: response.has_active_instance });
  return response.has_active_instance && response.instance ? parseInstance(response.instance) : null;
};

export const deployInstance = async (
  userId: string,
  taskId: string,
): Promise<Instance> => {
  logger.info(logEvents.instanceDeployAttempt, { userId, taskId });

  const response = await ApiClient.post<{
    status: string;
    instance: Parameters<typeof parseInstance>[0];
  }>(API_ENDPOINTS.instanceDeploy, {
    task_id: taskId,
  });

  const instance = parseInstance(response.instance);

  logger.info(logEvents.instanceDeploySuccess, {
    userId,
    taskId,
    instanceId: instance.uuid,
  });

  return instance;
};

export const extendInstance = async (userId: string): Promise<Instance> => {
  logger.info(logEvents.instanceExtendAttempt, { userId });

  const response = await ApiClient.post<{
    status: string;
    instance: Parameters<typeof parseInstance>[0];
    new_expires_at: string;
    new_time_remaining_ms: number;
  }>(API_ENDPOINTS.instanceExtend, {});

  const instance = parseInstance(response.instance);

  logger.info(logEvents.instanceExtendSuccess, {
    userId,
    instanceId: instance.uuid,
  });

  return instance;
};

export const terminateInstance = async (userId: string): Promise<string> => {
  logger.info(logEvents.instanceTerminateAttempt, { userId });

  const response = await ApiClient.delete<{
    status: string;
    message: string;
    instance_uuid: string;
  }>(API_ENDPOINTS.instanceTerminate);

  logger.info(logEvents.instanceTerminateSuccess, {
    userId,
    instanceId: response.instance_uuid,
  });

  return response.instance_uuid;
};
