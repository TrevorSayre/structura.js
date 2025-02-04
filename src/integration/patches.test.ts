import { describe, expect, it } from "vitest";
import { applyPatches, produceWithPatches } from "..";

describe.concurrent("test patch production", () => {
  it("should return the right patches on array push", async () => {
    const myObj: number[][] = [[], [], [], []];
    const [result, patches] = produceWithPatches(myObj, (draft) => {
      draft[0].push(0);
      draft[0].push(1);
      draft[0].push(2);
    });
    expect(result[0]).not.toBe(myObj[0]);
    expect(patches).toEqual([
      {
        p: "0",
        action: 8,
        next: [
          { v: 0, p: "0", action: 0 },
          { v: 1, p: "length", action: 0 },
        ],
      },
      {
        p: "0",
        action: 8,
        next: [
          { v: 1, p: "1", action: 0 },
          { v: 2, p: "length", action: 0 },
        ],
      },
      {
        p: "0",
        action: 8,
        next: [
          { v: 2, p: "2", action: 0 },
          { v: 3, p: "length", action: 0 },
        ],
      },
    ]);
  });
  it("should return the right patches on array manual adding", async () => {
    const myObj: number[][] = [[], [], [], []];
    const [result, patches] = produceWithPatches(myObj, (draft) => {
      draft[0][0] = 0;
      draft[0][1] = 1;
      draft[0][2] = 2;
    });
    expect(result[0]).not.toBe(myObj[0]);
    expect(patches).toEqual([
      { p: "0", action: 8, next: [{ v: 0, p: "0", action: 0 }] },
      { p: "0", action: 8, next: [{ v: 1, p: "1", action: 0 }] },
      { p: "0", action: 8, next: [{ v: 2, p: "2", action: 0 }] },
    ]);
  });
  it("should return the right patches on object set", async () => {
    const myObj: { [k: string]: number }[] = [{ A: 1 }];
    const [result, patches] = produceWithPatches(myObj, (draft) => {
      draft[0].B = 2;
      draft[0].C = 3;
      draft[0].D = 4;
      draft[0].E = 5;
    });
    expect(result[0]).not.toBe(myObj[0]);
    expect(patches).toEqual([
      { p: "0", action: 8, next: [{ v: 2, p: "B", action: 0 }] },
      { p: "0", action: 8, next: [{ v: 3, p: "C", action: 0 }] },
      { p: "0", action: 8, next: [{ v: 4, p: "D", action: 0 }] },
      { p: "0", action: 8, next: [{ v: 5, p: "E", action: 0 }] },
    ]);
  });
  it("should apply the patches correctly with object/array", async () => {
    const makeObj: () => { [k: string]: number }[] = () => [{ A: 1 }];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      delete draft[0].A;
      draft[0].B = 2;
      draft.push({ C: 3 });
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([{ B: 2 }, { C: 3 }]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with array reverse", async () => {
    const makeObj: () => { [k: string]: number }[] = () => [{ A: 1 }, { A: 2 }];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft.reverse();
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([{ A: 2 }, { A: 1 }]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with array splice", async () => {
    const makeObj: () => { [k: string]: number }[] = () => [{ A: 1 }, { A: 4 }];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft.splice(1, 0, { A: 2 }, { A: 3 });
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([{ A: 1 }, { A: 2 }, { A: 3 }, { A: 4 }]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with producer return", async () => {
    const makeObj: () => number[] = () => [0];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      return [draft[0], 1];
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([0, 1]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with map", async () => {
    const makeObj: () => Map<string, number>[] = () => [new Map()];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft[0].set("A", 1);
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([new Map([["A", 1]])]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with set", async () => {
    const makeObj: () => Set<{ [k: string]: number }>[] = () => [new Set()];
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft[0].add({ A: 1 });
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual([new Set([{ A: 1 }])]);
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with map clear", async () => {
    const makeObj: () => Map<string, number> = () =>
      new Map([
        ["A", 1],
        ["B", 2],
        ["C", 3],
      ]);
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft.clear();
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual(new Map());
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
  it("should apply the patches correctly with set clear", async () => {
    // attention! : if the objects referred are not the same, this will not work!
    const base = [{ A: 1 }, { A: 2 }, { A: 3 }];
    const makeObj: () => Set<{ [k: string]: number }> = () => new Set(base);
    const myObj = makeObj();
    const [, patches, inverse] = produceWithPatches(makeObj(), (draft) => {
      draft.clear();
    });
    const result = applyPatches(myObj, patches);
    expect(result).toEqual(new Set());
    const undone = applyPatches(result, inverse);
    expect(undone).toEqual(makeObj());
  });
});
