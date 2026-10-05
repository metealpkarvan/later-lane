export function text(value, max) {
  if (typeof value !== "string" || value.length > max || value.includes("\0"))
    throw Error("Invalid text field");
  return value;
}
export function date(value) {
  if (value === "") return "";
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value + "T12:00:00Z")) ||
    new Date(value + "T12:00:00Z").toISOString().slice(0, 10) !== value
  )
    throw Error("Invalid calendar date");
  return value;
}
export function safeUrl(value) {
  try {
    const u = new URL(value);
    return ["http:", "https:"].includes(u.protocol) &&
      !u.username &&
      !u.password
      ? u.href
      : "";
  } catch {
    return "";
  }
}
export function fold(value) {
  return String(value)
    .toLocaleLowerCase("tr")
    .replace(/ı/g, "i")
    .normalize("NFKD")
    .replace(/\p{M}/gu, "");
}
export function validate(value) {
  if (!value || !Array.isArray(value.items) || value.items.length > 100)
    throw Error("Archive supports up to 100 items");
  const ids = new Set();
  return {
    items: value.items.map((r) => {
      if (!r || typeof r !== "object") throw Error("Invalid item");
      const id = text(r.id, 100);
      if (!id || ids.has(id)) throw Error("Missing or duplicate ID");
      ids.add(id);
      const title = text(r.title, 180).trim(),
        reason = text(r.reason, 600).trim(),
        url = safeUrl(text(r.url, 3000));
      if (!title || !reason || !url)
        throw Error("Title, purpose and a public HTTP(S) URL are required");
      if (
        !Number.isInteger(r.minutes) ||
        r.minutes < 1 ||
        r.minutes > 90 ||
        ![1, 2, 3].includes(r.priority) ||
        !["inbox", "read", "released"].includes(r.status)
      )
        throw Error("Invalid duration, priority or state");
      const added = date(r.added);
      if (!added) throw Error("Capture date required");
      return {
        id,
        title,
        reason,
        url,
        minutes: r.minutes,
        priority: r.priority,
        status: r.status,
        added,
        deadline: date(r.deadline),
        takeaway: text(r.takeaway, 1000),
      };
    }),
  };
}
export function duplicate(items, url, except = "") {
  const safe = safeUrl(url);
  return items.some((r) => r.id !== except && r.url === safe);
}
export function expired(item, today) {
  date(today);
  return !!item.deadline && item.deadline < today && item.status === "inbox";
}
export function chooseTray(items, budget, today) {
  if (!Number.isInteger(budget) || budget < 1 || budget > 90)
    throw Error("Budget must be 1–90 minutes");
  date(today);
  const candidates = items.filter(
    (r) => r.status === "inbox" && !expired(r, today) && r.minutes <= budget,
  );
  const age = (r) =>
    Math.max(
      0,
      Math.min(
        30,
        Math.floor((Date.parse(today) - Date.parse(r.added)) / 86400000),
      ),
    );
  const weight = (r) => r.priority * 100 + age(r);
  let best = [],
    bestScore = 0,
    bestMinutes = 0;
  function consider(rows) {
    const minutes = rows.reduce((n, r) => n + r.minutes, 0);
    if (minutes > budget) return;
    const score = rows.reduce((n, r) => n + weight(r), 0);
    if (
      score > bestScore ||
      (score === bestScore &&
        (rows.length > best.length ||
          (rows.length === best.length && minutes < bestMinutes)))
    ) {
      best = [...rows];
      bestScore = score;
      bestMinutes = minutes;
    }
  }
  for (let a = 0; a < candidates.length; a++) {
    consider([candidates[a]]);
    for (let b = a + 1; b < candidates.length; b++) {
      consider([candidates[a], candidates[b]]);
      for (let c = b + 1; c < candidates.length; c++)
        consider([candidates[a], candidates[b], candidates[c]]);
    }
  }
  return { items: best, minutes: bestMinutes, score: bestScore };
}
export function markdown(items) {
  return [
    "# Later Lane reading record",
    "",
    ...items.flatMap((r) => [
      `## ${r.title}`,
      `Link: ${r.url}`,
      `Purpose: ${r.reason}`,
      `Estimated reading: ${r.minutes} min · State: ${r.status}`,
      `Captured: ${r.added} · Review date: ${r.deadline || "none"}`,
      `Takeaway: ${r.takeaway || "none"}`,
      "",
    ]),
  ].join("\n");
}
