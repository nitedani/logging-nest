import { Formatter } from "@nitedani/logging-core";

export class NestFormatter extends Formatter {
  transform(info, opts) {
    if (typeof info === "object" && info.context) {
      // Dont log messages from the default ExceptionsHandler,
      // to avoid duplicate error messages

      if (JSON.stringify(info.context).includes("ExceptionsHandler")) {
        return false;
      }
    }

    return super.transform(info, opts);
  }
}
