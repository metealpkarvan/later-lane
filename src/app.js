import * as C from "./core.js";
import * as U from "./ui.js";
const { $, t, esc } = U;
const state = U.store("later-lane", { items: [] }, C.validate);
let view = "inbox";
function budget() {
  return Math.max(1, Math.min(90, Math.trunc(Number($("budget").value) || 15)));
}
function commit(items) {
  try {
    if (state.set({ items })) {
      render();
      return true;
    }
  } catch (e) {
    U.notify(e.message);
  }
  return false;
}
function clearForm() {
  $("item-form").reset();
  $("edit-id").value = "";
  $("cancel-edit").hidden = true;
}
function render() {
  $("lead").textContent = t(
    "Kaydettiğin içerik için bir niyet ve süre seç. Later Lane, bugün gerçekten okuyabileceğin küçük bir tepsi hazırlasın.",
    "Give saved content an intention and a time estimate. Let Later Lane prepare a small tray you can actually read today.",
  );
  state.warn();
  const data = state.get().items,
    today = U.today(),
    tray = C.chooseTray(data, budget(), today),
    pending = data.filter((r) => r.status === "inbox"),
    stale = pending.filter((r) => C.expired(r, today));
  $("metrics").innerHTML = [
    [tray.items.length, t("TEPSİDE", "IN TRAY")],
    [tray.minutes + " / " + budget(), t("DAKİKA", "MINUTES")],
    [stale.length, t("YENİDEN DÜŞÜN", "RECONSIDER")],
  ]
    .map(
      ([n, s]) =>
        `<div class="metric"><strong>${n}</strong><small>${s}</small></div>`,
    )
    .join("");
  $("tray").innerHTML =
    tray.items
      .map(
        (r, i) =>
          `<article class="record"><div class="tray-number">0${i + 1}</div><h3>${esc(r.title)}</h3><p class="hint">${esc(r.reason)}</p><span class="meta">${r.minutes} ${t("dakika", "minutes")} · ${t("öncelik", "priority")} ${r.priority}</span><div class="actions"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${t("İçeriği aç", "Open content")} ↗</a><button data-action="read" data-id="${esc(r.id)}">${t("Okudum", "Read it")}</button></div></article>`,
      )
      .join("") ||
    '<div class="empty">' +
      t(
        "Bu bütçeye uygun içerik yok. Bir içerik ekle, süreyi artır veya bekleyen tarihleri gözden geçir.",
        "No content fits this budget. Add an item, increase time or reconsider waiting dates.",
      ) +
      "</div>";
  const tabs = [
    ["inbox", t("Kutuda", "Inbox")],
    ["reconsider", t("Yeniden düşün", "Reconsider")],
    ["read", t("Okunan", "Read")],
    ["released", t("Bırakılan", "Let go")],
  ];
  $("tabs").innerHTML = tabs
    .map(
      ([id, label]) =>
        `<button data-view="${id}" aria-pressed="${view === id}">${label}</button>`,
    )
    .join("");
  const q = C.fold($("search").value);
  const visible = data.filter(
    (r) =>
      (view === "reconsider" ? C.expired(r, today) : r.status === view) &&
      C.fold(r.title + " " + r.reason + " " + r.takeaway).includes(q),
  );
  $("items").innerHTML =
    visible
      .map(
        (r) =>
          `<article class="record"><div class="section-head"><h3>${esc(r.title)}</h3><span class="tag">${r.minutes} ${t("dk", "min")}</span></div><p class="hint">${esc(r.reason)}</p><div class="meta"><span>${t("Kayıt", "Saved")} ${U.dateLabel(r.added)}</span>${r.deadline ? "<span>" + t("Yeniden düşün", "Reconsider") + " " + U.dateLabel(r.deadline) + "</span>" : ""}</div>${r.takeaway ? '<p class="output">' + esc(r.takeaway) + "</p>" : ""}<div class="actions"><a href="${esc(r.url)}" target="_blank" rel="noopener noreferrer">${t("Aç", "Open")} ↗</a><button data-action="edit" data-id="${esc(r.id)}">${t("Düzenle", "Edit")}</button>${r.status === "inbox" ? `<button data-action="read" data-id="${esc(r.id)}">${t("Okudum", "Read it")}</button><button data-action="release" data-id="${esc(r.id)}">${t("Niyeti bırak", "Let it go")}</button>${C.expired(r, today) ? `<button data-action="renew" data-id="${esc(r.id)}">${t("7 gün daha", "7 more days")}</button>` : ""}` : `<button data-action="restore" data-id="${esc(r.id)}">${t("Kutuya geri al", "Return to inbox")}</button>`}<button data-action="delete" data-id="${esc(r.id)}">${t("Sil", "Delete")}</button></div></article>`,
      )
      .join("") ||
    '<div class="empty">' +
      t("Burada kayıt yok.", "No records here.") +
      "</div>";
  document.querySelectorAll("[data-view]").forEach(
    (b) =>
      (b.onclick = () => {
        view = b.dataset.view;
        render();
      }),
  );
  document
    .querySelectorAll("[data-action]")
    .forEach((b) => (b.onclick = () => action(b.dataset.action, b.dataset.id)));
}
function action(action, id) {
  const items = structuredClone(state.get().items),
    r = items.find((r) => r.id === id);
  if (!r) return;
  if (action === "edit") {
    $("edit-id").value = r.id;
    for (const field of [
      "title",
      "url",
      "reason",
      "minutes",
      "priority",
      "deadline",
    ])
      $(field).value = r[field];
    $("cancel-edit").hidden = false;
    $("title").focus();
    return;
  }
  if (action === "delete") {
    if (
      confirm(
        t(
          "Bu içerik kalıcı olarak silinsin mi?",
          "Permanently delete this item?",
        ),
      )
    )
      commit(items.filter((r) => r.id !== id));
    return;
  }
  if (action === "read") {
    const note = prompt(
      t("Aklında kalan bir cümle? İsteğe bağlı.", "One takeaway? Optional."),
      r.takeaway,
    );
    if (note === null) return;
    if (note.length > 1000) {
      U.notify(t("En fazla 1.000 karakter.", "Up to 1,000 characters."));
      return;
    }
    r.takeaway = note;
    r.status = "read";
  }
  if (action === "release") r.status = "released";
  if (action === "restore") {
    r.status = "inbox";
    r.deadline = "";
  }
  if (action === "renew") r.deadline = U.afterDays(7);
  commit(items);
}
$("item-form").onsubmit = (e) => {
  e.preventDefault();
  try {
    const old = state.get().items.find((r) => r.id === $("edit-id").value);
    const row = {
      id: old?.id || U.uid(),
      title: $("title").value,
      url: $("url").value,
      reason: $("reason").value,
      minutes: Number($("minutes").value),
      priority: Number($("priority").value),
      deadline: $("deadline").value,
      added: old?.added || U.today(),
      takeaway: old?.takeaway || "",
      status: old?.status || "inbox",
    };
    C.validate({ items: [row] });
    if (C.duplicate(state.get().items, row.url, row.id)) {
      U.notify(
        t(
          "Bu bağlantı zaten kutuda. Mevcut kaydı düzenle.",
          "This link is already saved. Edit its existing record.",
        ),
      );
      return;
    }
    const items = old
      ? state.get().items.map((r) => (r.id === old.id ? row : r))
      : [...state.get().items, row];
    if (commit(items)) clearForm();
  } catch (e) {
    U.notify(e.message);
  }
};
$("cancel-edit").onclick = clearForm;
$("budget").onchange = () => {
  $("budget").value = budget();
  render();
};
$("search").oninput = render;
$("markdown").onclick = () =>
  U.download("later-lane.md", C.markdown(state.get().items), "text/markdown");
$("demo").onclick = () => {
  if (
    state.get().items.length &&
    !confirm(
      t(
        "Kurgusal örnekler mevcut kutunun yerini alacak. Devam?",
        "Fictional samples will replace your inbox. Continue?",
      ),
    )
  )
    return;
  commit([
    {
      id: "demo1",
      title: t(
        "Bir diff’i küçük parçalara bölmek",
        "Break a diff into small pieces",
      ),
      url: "https://git-scm.com/docs/git-diff",
      reason: t(
        "Bir sonraki kod incelememde kullanmak.",
        "Use it in my next code review.",
      ),
      minutes: 7,
      priority: 3,
      added: U.afterDays(-4),
      deadline: U.afterDays(3),
      status: "inbox",
      takeaway: "",
    },
    {
      id: "demo2",
      title: t("Aile hikâyelerini dinlemek", "Listen to family stories"),
      url: "https://ich.unesco.org/en/RL/turkish-coffee-culture-and-tradition-00645",
      reason: t(
        "Pazar sohbeti için bir başlangıç bulmak.",
        "Find a starting point for Sunday’s conversation.",
      ),
      minutes: 4,
      priority: 2,
      added: U.afterDays(-8),
      deadline: "",
      status: "inbox",
      takeaway: "",
    },
    {
      id: "demo3",
      title: t("Daha erişilebilir arayüzler", "More accessible interfaces"),
      url: "https://www.w3.org/WAI/fundamentals/accessibility-intro/",
      reason: t(
        "Yeni uygulamamın odak sırasını kontrol etmek.",
        "Check focus order in my new app.",
      ),
      minutes: 4,
      priority: 2,
      added: U.afterDays(-1),
      deadline: "",
      status: "inbox",
      takeaway: "",
    },
    {
      id: "demo4",
      title: t(
        "Artık gerekmeyen bir araştırma",
        "A research topic I no longer need",
      ),
      url: "https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API",
      reason: t(
        "Önceki haftanın denemesi için kaydetmiştim.",
        "Saved for last week’s experiment.",
      ),
      minutes: 12,
      priority: 1,
      added: U.afterDays(-20),
      deadline: U.afterDays(-2),
      status: "inbox",
      takeaway: "",
    },
  ]);
  clearForm();
};
U.bindData("later-lane", state, C.validate, () => {
  clearForm();
  render();
});
U.init(render);
