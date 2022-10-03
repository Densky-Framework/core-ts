import { DevServer } from "dusky";
import { routesPath } from "./config.ts";

const server = new DevServer({ port: 8000, verbose: true, routesPath });

server.start();
