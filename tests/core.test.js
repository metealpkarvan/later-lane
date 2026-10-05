import test from "node:test";
import assert from "node:assert/strict";
import * as C from "../src/core.js";
const today = "2026-10-05";
const item = (id = "one", over = {}) => ({
  id,
  title: "Çay kültürü",
  url: "https://example.com/" + id,
  reason: "Bir aile sohbetinde kullanacağım",
  minutes: 5,
  priority: 2,
  status: "inbox",
  added: "2026-10-01",
  deadline: "",
  takeaway: "",
  ...over,
});
test("valid archive round trips", () => {
  const a = { items: [item()] };
  assert.deepEqual(C.validate(JSON.parse(JSON.stringify(a))), a);
});
test("normalizes URL serialization", () =>
  assert.equal(
    C.validate({ items: [item("one", { url: "https://EXAMPLE.COM" })] })
      .items[0].url,
    "https://example.com/",
  ));
for (const url of [
  "javascript:alert(1)",
  "data:text/html,hi",
  "file:///etc/passwd",
  "https://user:secret@example.com",
  "not a url",
])
  test("reject unsafe URL " + url, () => assert.equal(C.safeUrl(url), ""));
test("accepts leap day", () =>
  assert.equal(C.date("2024-02-29"), "2024-02-29"));
for (const date of [
  "2026-02-29",
  "2026-13-01",
  "2026-04-31",
  "2026-1-1",
  "yesterday",
])
  test("reject invalid date " + date, () => assert.throws(() => C.date(date)));
test("review date remains active through that day", () =>
  assert.equal(C.expired(item("a", { deadline: today }), today), false));
test("passed date asks for reconsideration", () =>
  assert.equal(C.expired(item("a", { deadline: "2026-10-04" }), today), true));
test("expired read record is not pending", () =>
  assert.equal(
    C.expired(item("a", { deadline: "2026-10-04", status: "read" }), today),
    false,
  ));
test("tray excludes expired and completed items", () => {
  const rows = [
    item("a", { deadline: "2026-10-04" }),
    item("b", { status: "read" }),
    item("c"),
  ];
  assert.deepEqual(
    C.chooseTray(rows, 15, today).items.map((r) => r.id),
    ["c"],
  );
});
test("tray never exceeds three cards", () =>
  assert.equal(
    C.chooseTray(
      ["a", "b", "c", "d"].map((id) => item(id)),
      90,
      today,
    ).items.length,
    3,
  ));
test("tray maximizes fitting declared priorities rather than taking first item", () => {
  const rows = [
    item("a", { minutes: 10, priority: 1 }),
    item("b", { minutes: 4, priority: 3 }),
    item("c", { minutes: 6, priority: 3 }),
  ];
  assert.deepEqual(
    C.chooseTray(rows, 10, today).items.map((r) => r.id),
    ["b", "c"],
  );
});
test("does not exceed available time", () =>
  assert.ok(
    C.chooseTray(
      ["a", "b", "c"].map((id) => item(id, { minutes: 7 })),
      15,
      today,
    ).minutes <= 15,
  ));
test("ties select a shorter tray", () =>
  assert.equal(
    C.chooseTray(
      [item("long", { minutes: 8 }), item("short", { minutes: 3 })],
      8,
      today,
    ).items[0].id,
    "short",
  ));
test("age score is capped to avoid an ancient item dominating", () =>
  assert.equal(
    C.chooseTray(
      [
        item("old", { added: "2000-01-01", priority: 1 }),
        item("now", { added: today, priority: 2 }),
      ],
      5,
      today,
    ).items[0].id,
    "now",
  ));
test("Turkish dotted/dotless search and accents match", () =>
  assert.equal(C.fold("IŞIK İÇİN ÇAY"), "isik icin cay"));
test("duplicate URL ignores edit of the same record", () =>
  assert.equal(C.duplicate([item()], item().url, "one"), false));
test("duplicate URL is detected across records", () =>
  assert.equal(C.duplicate([item()], item().url), true));
test("hash routes remain distinct", () =>
  assert.equal(
    C.duplicate(
      [item("a", { url: "https://example.com/#one" })],
      "https://example.com/#two",
    ),
    false,
  ));
for (const [name, over] of [
  ["missing purpose", { reason: "" }],
  ["bad duration", { minutes: 0 }],
  ["fractional duration", { minutes: 2.5 }],
  ["bad priority", { priority: 9 }],
  ["unknown state", { status: "gone" }],
  ["missing date", { added: "" }],
  ["oversized note", { takeaway: "x".repeat(1001) }],
])
  test("reject " + name, () =>
    assert.throws(() => C.validate({ items: [item("a", over)] })),
  );
test("duplicate IDs do not overwrite data", () =>
  assert.throws(() => C.validate({ items: [item(), item()] })));
test("capacity is bounded at 100 records", () =>
  assert.throws(() =>
    C.validate({
      items: Array.from({ length: 101 }, (_, i) => item(String(i))),
    }),
  ));
test("invalid tray budget rejected", () =>
  assert.throws(() => C.chooseTray([item()], 0, today)));
test("Markdown preserves intention and takeaway", () => {
  const m = C.markdown([item("one", { takeaway: "Bir söz yeterli." })]);
  assert.ok(m.includes("Bir aile sohbetinde"));
  assert.ok(m.includes("Bir söz yeterli."));
});
