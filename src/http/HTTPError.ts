import { PrimitiveObject, StatusCode, statusMessages } from "../common.ts";
import { HTTPResponse } from "./HTTPResponse.ts";

export class HTTPError {
  readonly message: string;

  name?: string;
  details?: PrimitiveObject;

  constructor(statusCode: StatusCode, message?: string);
  constructor(statusCode: number, message: string);
  constructor(readonly statusCode: number, message?: string) {
    if (message === undefined) {
      this.message = statusMessages[statusCode as StatusCode] ?? "";
    } else {
      this.message = message;
    }
  }

  withName(name?: string): this {
    this.name = name;
    return this;
  }

  withDetails(details?: PrimitiveObject): this {
    this.details = details;
    return this;
  }

  toJSON() {
    return {
      name: this.name,
      details: this.details,
      message: this.message,
    };
  }

  toResponse(): Response {
    return HTTPResponse.fromJSON(this.toJSON(), {
      status: this.statusCode,
      statusText: statusMessages[this.statusCode as StatusCode] ?? this.message,
    });
  }

  static fromError(
    error: Error,
    statusCode: number | StatusCode = StatusCode.INTERNAL_ERR,
  ): HTTPError {
    return new HTTPError(statusCode, error.message)
      .withName(error.name)
      .withDetails({
        stack: error.stack ?? "",
      });
  }
}
