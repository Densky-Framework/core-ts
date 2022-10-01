export type Promisable<T> = Promise<T>| T;
export type Awaited<T> = T extends Promise<infer R> ? R : never;
