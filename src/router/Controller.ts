import { Promisable } from "../common.ts";
import { HTTPPossibleResponse, HTTPRequest } from "../http/index.ts";

export type Endpoint = (
    req: HTTPRequest
  ) => Promisable<HTTPPossibleResponse>

export interface IController {
  GET?: Endpoint;
  POST?: Endpoint;
  DELETE?: Endpoint;
  PATCH?: Endpoint;
  ANY?: Endpoint;
}
