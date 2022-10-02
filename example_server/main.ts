import { DevServer } from "../mod.ts";

const routesPath = import.meta.resolve("./src/routes/index.ts");
const server = new DevServer({ port: 8000, verbose: true, routesPath });

server.start();
