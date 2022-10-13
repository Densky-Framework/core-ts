import { Promisable } from "../common.ts";
import { HTTPError, HTTPRequest, HTTPResponse } from "../http/index.ts";

export type Endpoint = (
    req: HTTPRequest
  ) => Promisable<HTTPResponse | Response | HTTPError | Error | void>

export interface IController {
  GET?: Endpoint;
  POST?: Endpoint;
  DELETE?: Endpoint;
  PATCH?: Endpoint;
  ANY?: Endpoint;
}
