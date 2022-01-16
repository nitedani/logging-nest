import { Injectable } from "@nestjs/common";
import { WinstonLogger } from "nest-winston";
import { getLogger } from "./storage";

@Injectable()
export class Logger extends WinstonLogger {
  constructor(context?: string) {
    super(getLogger()!);
    if (context) {
      this.setContext(context);
    }
  }
}
