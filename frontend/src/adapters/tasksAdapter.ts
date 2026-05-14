import type { Task } from "../domain/types";
import { API_ENDPOINTS, ApiClient } from "./apiClient";
import { logEvents } from "./logEvents";
import { logger } from "./logger";

export const listTasks = async (): Promise<Task[]> => {
  const response = await ApiClient.get<{
    status: string;
    tasks: Task[];
  }>(API_ENDPOINTS.tasks);

  logger.info(logEvents.tasksList, { count: response.tasks.length });
  return response.tasks;
};

export const listAvailableTasks = listTasks;
