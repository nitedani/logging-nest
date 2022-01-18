import { INestApplication } from "@nestjs/common";
import {
  createLogger,
  loggerMiddleware,
  Options,
  runSamplers,
  setLogger,
  withContext,
} from "@nitedani/logging-core";
import { NestFormatter } from "./nest/formatter";
import { LoggingInterceptor } from "./nest/http.interceptor";
import { Logger } from "./nest/logger";

//@ts-ignore
import LokiTransport = require("winston-loki");

const logging = (app: INestApplication, options?: Options) => {
  const logger = createLogger(options);
  logger.format = new NestFormatter();
  setLogger(logger);

  // Create async context with requestId
  app.use(withContext);

  // Set error object on context
  // The error object is attached to the request/response log
  app.useGlobalInterceptors(new LoggingInterceptor());

  // Log request/response + context
  app.use(loggerMiddleware);

  // Set nest logger service
  app.useLogger(new Logger());

  process.on("uncaughtException", (error) => {
    logger.error(error);
  });

  process.on("unhandledRejection", (error) => {
    logger.error(error);
  });

  runSamplers();
};

export default logging;
