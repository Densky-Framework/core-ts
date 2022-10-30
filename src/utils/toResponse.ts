import { HTTPError } from "../http/HTTPError.ts";
import { HTTPRequest } from "../http/HTTPRequest.ts";
import { HTTPResponse } from "../http/HTTPResponse.ts";

export function toResponse(
  req: HTTPRequest,
  response: HTTPResponse | Response | HTTPError | Error | void,
): Response {
  // TODO
  if (response instanceof HTTPResponse) {
    return new Response("Teapot (ToResponse)");
  }
  if (response instanceof Response) {
    return new Response(response.body, {
      ...response,
      headers: req.headers,
    });
  }
  if (response instanceof HTTPError) {
    return toResponse(req, response.toResponse());
  }
  if (response instanceof Error) {
    return toResponse(req, HTTPError.fromError(response).toResponse());
  }

  throw new Error("Unreachable code");
}

export const toResponseFnDecl = (name = "toResponse", densky = "$Densky$") => `
function ${name} (
  req: ${densky}.HTTPRequest,
  response: ${densky}.HTTPResponse | Response | ${densky}.HTTPError | Error | void
): Response {
  if (response instanceof ${densky}.HTTPResponse) return new Response("Teapot (ToResponse)");
  if (response instanceof Response) {
    return new Response(response.body, {
      ...response,
      headers: req.headers
    })
  }
  if (response instanceof ${densky}.HTTPError) return ${name}(req, response.toResponse());
  if (response instanceof Error)
    return ${name}(req, ${densky}.HTTPError.fromError(response).toResponse());

  throw new Error("Unreachable code");
}`;
