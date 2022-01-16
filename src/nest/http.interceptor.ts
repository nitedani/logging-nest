import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { getInfo } from "../common/format";
import { Logger } from "../common/logger";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private logger: Logger) {}

  public intercept(
    context: ExecutionContext,
    call$: CallHandler
  ): Observable<unknown> {
    const req = context.switchToHttp().getRequest();
    const res = context.switchToHttp().getResponse();
    req.start = Date.now();

    return call$.handle().pipe(
      tap((): void => {
        const toLog = getInfo(req, res);
        this.logger.log(toLog);
      })
    );
  }
}
