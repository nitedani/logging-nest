import { INestApplication } from "@nestjs/common";
import {
  createLogger,
  loggerMiddleware,
  Options,
  runSamplers,
  setLogger,
  createTracer,
  withContext,
} from "@nitedani/logging-core";
import Graceful from "node-graceful";
import { NestFormatter } from "./nest/formatter";
import { LoggingInterceptor } from "./nest/http.interceptor";
import { Logger } from "./nest/logger";

const logging = (app: INestApplication, options: Options) => {
  Graceful.on("exit", () => app.close());

  const logger = createLogger(options);
  logger.format = new NestFormatter();
  setLogger(logger);

  const tracer = createTracer(options);
  tracer
    .start()
    .then(() => {
      logger.info("Tracing initialized");
    })
    .catch((error) => {
      logger.error(error);
    });

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
