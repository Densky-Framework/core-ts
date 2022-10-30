import { Server } from "densky";
import "./config.ts"

const server = new Server({ port: 8000, verbose: true }, requestHandler);

server.start();
