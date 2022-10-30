import { IController, HTTPResponse } from "densky";

export default class _ implements IController {
  async GET() {
    return await HTTPResponse.view("index.html");
  }
}
