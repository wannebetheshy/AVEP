import type { AdminInstance } from "../domain/types";
import { API_ENDPOINTS, ApiClient } from "./apiClient";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

const parseAdminInstance = (data: {
  uuid: string;
  user_id: string;
  username: string;
  task_id: string;
  task_name: string;
  status: string;
  url: string;
  created_at: string;
  expires_at: string;
  time_remaining_ms: number;
  extensions_count?: number;
}): AdminInstance => ({
  uuid: data.uuid,
  userId: data.user_id,
  username: data.username,
  taskId: data.task_id,
  taskName: data.task_name,
  status: data.status === "running" ? "active" : (data.status as AdminInstance["status"]),
  url: data.url,
  createdAt: new Date(data.created_at),
  expiresAt: new Date(data.expires_at),
  timeRemainingMs: data.time_remaining_ms,
  extensionsCount: data.extensions_count ?? 0,
});

export const listAdminInstances = async (): Promise<AdminInstance[]> => {
  const response = await ApiClient.get<{
    status: string;
    items: Parameters<typeof parseAdminInstance>[0][];
  }>(API_ENDPOINTS.adminInstances);

  logger.info(logEvents.adminInstancesList, { count: response.items.length });
  return response.items.map(parseAdminInstance);
};

export const forceTerminateInstance = async (instanceId: string) => {
  logger.info(logEvents.adminInstancesForceTerminateAttempt, { instanceId });

  const response = await ApiClient.delete<{
    status: string;
    message: string;
    instance_uuid: string;
  }>(`${API_ENDPOINTS.adminInstances}/${instanceId}`);

  logger.info(logEvents.adminInstancesForceTerminateSuccess, {
    instanceId: response.instance_uuid,
  });

  return response.instance_uuid;
};
