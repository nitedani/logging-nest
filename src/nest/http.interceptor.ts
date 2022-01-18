import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { ctx } from "@nitedani/logging-core";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  public intercept(
    _context: ExecutionContext,
    call$: CallHandler
  ): Observable<unknown> {
    return call$.handle().pipe(
      tap({
        next: () => {},
        error: (error) => {
          ctx()!.error = error;
        },
      })
    );
  }
}
