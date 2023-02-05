// deno-lint-ignore-file no-explicit-any
import * as bdd from "https://deno.land/std@0.159.0/testing/bdd.ts";
import {
  addMatchers,
  expect as expect_,
  Expected as Expected_,
} from "https://deno.land/x/expect@v0.2.10/expect.ts";
import {
  toBeInstanceOf,
  toEqual,
} from "https://deno.land/x/expect@v0.2.10/matchers.ts";

export interface Expected extends Expected_ {
  toBeSet(size?: number): void;
}
export const expect = expect_ as ((value: any) => Expected);

export { addMatchers, bdd };

export { mock } from "https://deno.land/x/expect@v0.2.10/mod.ts";
addMatchers({
  toBeSet(value: any, size?: number) {
    const instanceOf_ = toBeInstanceOf(value, Set);
    if (!instanceOf_.pass) return instanceOf_;

    if (typeof size === "number") {
      const equal = toEqual(value.size, size);
      if (!equal.pass) return equal;
    }

    return { pass: true };
  },
});
