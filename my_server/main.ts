import { Server } from "../mod.ts";

const server = new Server({ port: 8000, verbose: true });

server.start();
