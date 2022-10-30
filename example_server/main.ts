import { Server } from "densky";

const pathname = new URL(import.meta.resolve("./")).pathname;
Deno.chdir(pathname);

const { default: requestHandler } = await import("./.densky/main.ts");

const server = new Server({ port: 8000, verbose: true }, requestHandler);

server.start();
