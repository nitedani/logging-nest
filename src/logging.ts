import { INestApplication } from "@nestjs/common";
import * as winston from "winston";
import { Formatter, getInfo } from "./common/format";
import { Logger } from "./common/logger";
import { runSamplers } from "./common/sampler";
import { ctx, setLogger, withContext } from "./common/storage";
import { LoggingInterceptor } from "./nest/http.interceptor";

//@ts-ignore
import LokiTransport = require("winston-loki");

const consoleTransport = new winston.transports.Console({
  format: winston.format.simple(),
});

interface Options {
  console: boolean;
  loki?: {
    host: string;
    labels: { [key: string]: string };
    level?: string;
  };
}

const createLoggerMiddleware = (logger) => (req, res, next) => {
  req.start = Date.now();
  req.socket._prevBytesWritten = req.socket.bytesWritten;
  next();

  res.once("finish", () => {
    const error = ctx()!.error;
    const toLog = getInfo(req, res, error);

    if (res.statusCode < 400 && res.statusCode >= 200) {
      logger.log(toLog);
    } else {
      if (res.statusCode >= 500) {
        logger.error(toLog);
      } else {
        logger.warn(toLog);
      }
    }
  });
};

const logging = (app: INestApplication, options?: Options) => {
  app.use(withContext);
  const transports: winston.transport[] = [];
  if (options?.console) {
    transports.push(consoleTransport);
  }
  if (options?.loki) {
    const { host, labels, level } = options.loki;
    const lokiTransport = new LokiTransport({
      host,
      labels,
      format: winston.format.json(),
      level: level || "debug",
    });
    transports.push(lokiTransport);
  }

  const logger = winston.createLogger({
    format: new Formatter(),
    transports,
  });
  setLogger(logger);
  const _logger = new Logger();

  app.use(createLoggerMiddleware(_logger));
  app.useLogger(_logger);
  app.useGlobalInterceptors(new LoggingInterceptor());

  process.on("uncaughtException", (error) => {
    _logger.error(error);
  });

  process.on("unhandledRejection", (error) => {
    _logger.error(error);
  });

  runSamplers();

  /*
    app.use(async (req, res: Response, next) => {
      const context = ctx();
      req.start = Date.now();

      const errorListener = (error) => {
        const _context = ctx();

        if (!_context || _context.requestId !== context.requestId) {
          return;
        }

        console.log(context, _context);
        const json = getErrorJson(error);
        res.status(json.status).json(json);
      };

      process.addListener("unhandledRejection", errorListener);
      process.addListener("uncaughtException", errorListener);
      res.once("close", () => {
        process.removeListener("unhandledRejection", errorListener);
        process.removeListener("uncaughtException", errorListener);
      });

      const result = await next();

      const info = getInfo(req, res);
      _logger.log(info);
    });
    */
};

export default logging;
