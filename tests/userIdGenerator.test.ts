import { generateIdFromNumber } from "@/utils/userIdGenerator";

describe("user id generator", () => {
  test("generate id from numbers", () => {
    expect(generateIdFromNumber(-100)).toBe(generateIdFromNumber(-100));
    expect(generateIdFromNumber(10)).toBe(generateIdFromNumber(10));
  });
});
