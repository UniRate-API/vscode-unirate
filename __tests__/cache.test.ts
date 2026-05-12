import { TTLCache } from "../src/cache";

describe("TTLCache", () => {
  it("stores and retrieves values until they expire", () => {
    let now = 1000;
    const c = new TTLCache<number>(() => now);
    c.set("a", 42, 100);
    expect(c.get("a")).toBe(42);
    now = 1101;
    expect(c.get("a")).toBeUndefined();
  });

  it("treats a non-positive ttl as a no-op", () => {
    const c = new TTLCache<number>();
    c.set("a", 42, 0);
    expect(c.get("a")).toBeUndefined();
    c.set("b", 42, -5);
    expect(c.get("b")).toBeUndefined();
  });

  it("clears all entries", () => {
    const c = new TTLCache<number>();
    c.set("a", 1, 1000);
    c.set("b", 2, 1000);
    c.clear();
    expect(c.size()).toBe(0);
  });

  it("deduplicates concurrent fetches of the same key", async () => {
    const c = new TTLCache<number>();
    let calls = 0;
    const loader = async () => {
      calls++;
      await new Promise((r) => setTimeout(r, 5));
      return 7;
    };
    const [a, b, d] = await Promise.all([
      c.fetch("k", 10_000, loader),
      c.fetch("k", 10_000, loader),
      c.fetch("k", 10_000, loader),
    ]);
    expect([a, b, d]).toEqual([7, 7, 7]);
    expect(calls).toBe(1);
  });

  it("caches successful fetches and serves them without calling the loader", async () => {
    const c = new TTLCache<number>();
    let calls = 0;
    const loader = async () => {
      calls++;
      return 3;
    };
    expect(await c.fetch("k", 10_000, loader)).toBe(3);
    expect(await c.fetch("k", 10_000, loader)).toBe(3);
    expect(calls).toBe(1);
  });

  it("does not cache failed fetches", async () => {
    const c = new TTLCache<number>();
    let calls = 0;
    const loader = async () => {
      calls++;
      throw new Error("boom");
    };
    await expect(c.fetch("k", 10_000, loader)).rejects.toThrow("boom");
    await expect(c.fetch("k", 10_000, loader)).rejects.toThrow("boom");
    expect(calls).toBe(2);
  });
});
