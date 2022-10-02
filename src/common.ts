export type Promisable<T> = Promise<T>| T;
export type Awaited<T> = T extends Promise<infer R> ? R : never;

export type PrimitiveObject = {
  [x: string | number]: PrimitiveObject | string | number | boolean | undefined;
};

export enum StatusCode {
  OK = 200,
  CREATED = 201,

  BAD_REQUEST = 400,

  INTERNAL_ERR = 500,
}

export const statusMessages: Record<StatusCode, string> = {
  200: "Ok",
  201: "Created",

  400: "Bad Request",

  500: "Internal Server Error",
};
