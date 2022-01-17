import { ctx } from "./storage";

export class Formatter {
  transform(info, _opts) {
    const context = ctx();
    const logObj: any = {};

    if (context && context.requestId) {
      logObj.requestId = context.requestId;
    }

    if (typeof info === "object") {
      if (info.context?.includes("ExceptionsHandler")) {
        return false;
      }
      Object.assign(logObj, info);
    } else {
      logObj.message = info;
    }

    return logObj;
  }
}

export const getError = (error: any) => {
  if (typeof error === "object") {
    const { message, status, statusCode, stack, ...rest } = error;

    const _status = status || statusCode || 500;
    return {
      message,
      status: _status,
      stack,
      ...rest,
    };
  }

  return { message: error, status: 500 };
};

export const getInfo = (req, res, error?) => {
  const { method, url } = req;
  const { statusCode } = res;

  const bytesWritten = req.socket.bytesWritten - req.socket._prevBytesWritten;
  const message: string = `HTTP request served - ${statusCode} - ${method} - ${url}`;
  const toLog = {
    message,
    remote_addr: req.ip,
    timestamp: new Date(),
    protocol: req.protocol,
    request: {
      time: Date.now() - req.start,
      method,
      hostname: req.hostname,
      uri: url,
      size: req.socket.bytesRead,
      user_agent: req.headers["user-agent"],
      referer: req.headers["referer"],
    },
    response: {
      status: statusCode,
      size: res.getHeader("Content-Length") || bytesWritten,
    },
  };

  if (error) {
    const { name, stack, message /* ...rest  */ } = getError(error);
    Object.assign(toLog, {
      stack: [stack].flat(),
      error_message: message,
      error_name: name,
      //error_meta: rest,
    });
  }

  return toLog;
};
