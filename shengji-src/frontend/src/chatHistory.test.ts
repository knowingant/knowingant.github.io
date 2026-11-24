import { CHAT_HISTORY_LINES, loadChat, saveChat } from "./chatHistory";

class MemoryStorage {
  private data = new Map<string, string>();
  get length(): number {
    return this.data.size;
  }
  key(i: number): string | null {
    return Array.from(this.data.keys())[i] ?? null;
  }
  getItem(k: string): string | null {
    return this.data.get(k) ?? null;
  }
  setItem(k: string, v: string): void {
    this.data.set(k, v);
  }
  removeItem(k: string): void {
    this.data.delete(k);
  }
}

const line = (n: number) => ({ from: "a", message: `m${n}` });

beforeEach(() => {
  (global as any).window = { localStorage: new MemoryStorage() };
});

test("keeps the last lines of a room and nothing of another", () => {
  const many = Array.from({ length: CHAT_HISTORY_LINES + 20 }, (_, i) =>
    line(i),
  );
  saveChat("room1", many);
  saveChat("room2", [line(1)]);
  const back = loadChat("room1");
  expect(back).toHaveLength(CHAT_HISTORY_LINES);
  expect(back[back.length - 1].message).toBe(`m${many.length - 1}`);
  expect(loadChat("room2")).toHaveLength(1);
  expect(loadChat("nowhere")).toEqual([]);
});

test("drops saved chat that is too old", () => {
  saveChat("room1", [line(1)]);
  const now = Date.now();
  const spy = jest.spyOn(Date, "now").mockReturnValue(now + 13 * 3600 * 1000);
  expect(loadChat("room1")).toEqual([]);
  spy.mockRestore();
  expect(loadChat("room1")).toEqual([]);
});
