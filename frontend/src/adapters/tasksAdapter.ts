import type { Task } from "../domain/types";
import { MOCK_DELAY_MS } from "./constants";
import { logEvents } from "./logEvents";
import { logger } from "./logger";
import { getTasks, sleep } from "./inMemoryStore";

export const listAvailableTasks = async (): Promise<Task[]> => {
  await sleep(MOCK_DELAY_MS);
  const tasks = getTasks();
  logger.info(logEvents.tasksList, { count: tasks.length });
  return tasks;
};
