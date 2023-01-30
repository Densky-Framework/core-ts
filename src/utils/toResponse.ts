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

  if (response instanceof Error) {
    response = HTTPError.fromError(response); // type -> HTTPError
  }

  if (response instanceof HTTPError) {
    response = response.toResponse(); // type -> Response
  }

  if (response instanceof Response) {
    const headers = [...req.headers.entries(), ...response.headers.entries()];

    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(headers),
    });
  }

  throw new Error("Unreachable code");
}

export const toResponseFnDecl = (name = "toResponse", densky = "$Densky$") => `
function ${name} (
  req: ${densky}.HTTPRequest,
  response: ${densky}.HTTPResponse | Response | ${densky}.HTTPError | Error | void
): Response {
  if (response instanceof ${densky}.HTTPResponse) 
    return new Response("Teapot (ToResponse)");

  if (response instanceof Error) 
    response = ${densky}.HTTPError.fromError(response);

  if (response instanceof ${densky}.HTTPError) 
    response = response.toResponse();

  if (response instanceof Response) 
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries([...req.headers.entries(), ...response.headers.entries()]),
    });

  throw new Error("Unreachable code");
}`;
