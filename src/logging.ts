import { Logger } from "./common/logger";
import { Formatter } from "./common/format";
import { setLogger, withContext } from "./common/storage";
import { LoggingInterceptor } from "./nest/http.interceptor";
import { AllExceptionsFilter } from "./nest/exception.filter";
import * as winston from "winston";
import { INestApplication } from "@nestjs/common";
import * as getMetricEmitter from "@newrelic/native-metrics";
//@ts-ignore
import LokiTransport = require("winston-loki");
/*

if (emitter.gcEnabled) {
  setInterval(() => {
    const gcMetrics = emitter.getGCMetrics();
    for (const type in gcMetrics) {
      console.log("GC type name:", type);
      console.log("GC type id:", gcMetrics[type].typeId);
      console.log("GC metrics:", gcMetrics[type].metrics);
    }
  }, 1000);
}

if (emitter.usageEnabled) {
  emitter.on("usage", (usage) => console.log(usage));
}
*/

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

  app.use((req, _res, next) => {
    req.socket._prevBytesWritten = req.socket.bytesWritten;
    next();
  });

  const logger = winston.createLogger({
    format: new Formatter(),
    transports,
  });
  setLogger(logger);
  const _logger = new Logger();

  app.useLogger(_logger);
  app.useGlobalInterceptors(new LoggingInterceptor(_logger));
  app.useGlobalFilters(new AllExceptionsFilter(_logger));

  process.on("uncaughtException", (error) => {
    _logger.error(error);
  });

  process.on("unhandledRejection", (error) => {
    _logger.error(error);
  });

  setInterval(() => {
    _logger.debug!({ memory: process.memoryUsage() });
  }, 10000);

  const emitter = getMetricEmitter({ timeout: 15000 });
  emitter.unbind();
  emitter.bind(10000);
  setInterval(() => {
    const loopMetrics = emitter.getLoopMetrics();
    _logger.debug!({ loopMetrics: loopMetrics.usage });
  }, 10000);

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
