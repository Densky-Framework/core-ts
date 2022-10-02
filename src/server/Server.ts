import { Promisable } from "../common.ts";
import { BaseServer } from "./BaseServer.ts";

export class Server extends BaseServer {
  handleRequest(request: Deno.RequestEvent): Promisable<void> {
    request.respondWith(new Response("Hola", { status: 201 }))
  }
}
