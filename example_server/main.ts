import { Server } from "dusky";
import { outdirPath } from "./config.ts";
import requestHandler from "./.dusky/dusky.main.ts"

const server = new Server({ port: 8000, verbose: true, routesPath: outdirPath }, requestHandler);

server.start();
