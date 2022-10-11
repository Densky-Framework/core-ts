import { IController } from "dusky";

export default class ByeWorldController implements IController {
  GET() {
    return new Response("Bye World");
  }
}
