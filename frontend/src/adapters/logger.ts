import { LogLayer } from "loglayer";
import { PinoTransport } from "@loglayer/transport-pino";
import { pino } from "pino";

type LogContext = Record<string, unknown>;

const DEBUG_LOGS = import.meta.env.VITE_DEBUG_LOGS === "true";

const pinoLogger = pino({
  level: DEBUG_LOGS ? "debug" : "info",
});

const logLayer = new LogLayer({
  transport: new PinoTransport({
    logger: pinoLogger,
  }),
  contextFieldName: "context",
  metadataFieldName: "metadata",
});

const withMetadata = (context?: LogContext) =>
  context ? logLayer.withMetadata(context) : logLayer;

export const logger = {
  info: (message: string, context?: LogContext) =>
    withMetadata(context).info(message),
  warn: (message: string, context?: LogContext) =>
    withMetadata(context).warn(message),
  error: (message: string, context?: LogContext) =>
    withMetadata(context).error(message),
  debug: (message: string, context?: LogContext) => {
    if (!DEBUG_LOGS) return;
    withMetadata(context).debug(message);
  },
};
