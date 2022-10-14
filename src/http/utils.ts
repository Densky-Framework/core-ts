import { HTTPError } from "./HTTPError.ts";
import { HTTPResponse } from "./HTTPResponse.ts";

export type HTTPPossibleResponse = HTTPResponse | Response | HTTPError | void;
