import { ArgumentsHost, Catch } from "@nestjs/common";
import { getInfo } from "../common/format";
import { Logger } from "../common/logger";

@Catch()
export class AllExceptionsFilter {
  constructor(private logger: Logger) {}

  getStatus(exception: any) {
    if (typeof exception === "object") {
      return exception.status || exception.statusCode || 500;
    }
    return 500;
  }

  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();
    const status = this.getStatus(exception);
    const message = exception.message;

    response.status(status).json({
      message,
      statusCode: status,
      timestamp: new Date().toISOString(),
      path: request.url,
    });

    const toLog = getInfo(request, response, exception);

    if (status >= 500) {
      this.logger.error(toLog);
    } else {
      this.logger.warn(toLog);
    }
  }
}
