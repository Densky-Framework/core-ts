import { IController } from "dusky";
import * as dusky from "dusky/common.ts";

export default class IndexController implements IController {
  GET() {
    return new Response("Index");
  }
}
