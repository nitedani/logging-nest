import { ArgumentsHost, Catch, HttpException } from "@nestjs/common";
import { getInfo } from "../common/format";
import { Logger } from "../common/logger";

@Catch()
export class AllExceptionsFilter {
  constructor(private logger: Logger) {}

  getStatus(exception: any) {
    return exception instanceof HttpException ? exception.getStatus() : 500;
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

    if (exception instanceof HttpException) {
      if (exception.getStatus() >= 500) {
        this.logger.error(toLog);
      } else {
        this.logger.warn(toLog);
      }
    } else {
      this.logger.error(toLog);
    }
  }
}
