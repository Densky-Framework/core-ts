import { DevServer } from "dusky";

const routesPath = import.meta.resolve("./src/routes");
const server = new DevServer({ port: 8000, verbose: true, routesPath });

server.start();
