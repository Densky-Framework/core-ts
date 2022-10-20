import { Server } from "dusky";
import requestHandler from "./.dusky/http.dusky.ts";

const server = new Server({ port: 8000, verbose: true }, requestHandler);

server.start();
