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

export const toResponseFnDecl = (name = "toResponse", dusky = "$Dusky$") => `
function ${name} (
  req: ${dusky}.HTTPRequest,
  response: ${dusky}.HTTPResponse | Response | ${dusky}.HTTPError | Error | void
): Response {
  if (response instanceof ${dusky}.HTTPResponse) return new Response("Teapot (ToResponse)");
  if (response instanceof Response) {
    return new Response(response.body, {
      ...response,
      headers: req.headers
    })
  }
  if (response instanceof ${dusky}.HTTPError) return ${name}(req, response.toResponse());
  if (response instanceof Error)
    return ${name}(req, ${dusky}.HTTPError.fromError(response).toResponse());

  throw new Error("Unreachable code");
}`;
