import { BaseServer } from "./BaseServer.ts";

export class DevServer extends BaseServer {
  handleRequest(_request: Deno.RequestEvent) {
    console.log(_request)
    return new Response("Hola", { status: 201 });
  }
}
