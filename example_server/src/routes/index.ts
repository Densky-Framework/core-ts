import { IController } from "dusky";

export default class IndexController implements IController {
  GET() {
    return new Response("Index");
  }
}
