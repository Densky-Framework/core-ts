import { HTTPError } from "../http/HTTPError.ts";
import { HTTPResponse } from "../http/HTTPResponse.ts";

export function toResponse(
  response: HTTPResponse | Response | HTTPError | Error | void
): Response {
  // TODO
  if (response instanceof HTTPResponse)
    return new Response("Teapot (ToResponse)");
  if (response instanceof Response) return response;
  if (response instanceof HTTPError) return response.toResponse();
  if (response instanceof Error)
    return HTTPError.fromError(response).toResponse();

  throw new Error("Unreachable code");
}

export const toResponseFnDecl = (name = "toResponse", dusky = "$Dusky$") => `
function ${name} (
  response: ${dusky}.HTTPResponse | Response | ${dusky}.HTTPError | Error | void
): Response {
  if (response instanceof ${dusky}.HTTPResponse) return new Response("Teapot (ToResponse)");
  if (response instanceof Response) return response;
  if (response instanceof ${dusky}.HTTPError) return response.toResponse();
  if (response instanceof Error)
    return ${dusky}.HTTPError.fromError(response).toResponse();

  throw new Error("Unreachable code");
}`;
