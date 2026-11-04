import {
  KEY,
  activities,
  slots,
  palettes,
  scenes,
  initial,
  restore,
  household,
  addActivity,
} from "./model.js";
import { printSVG } from "./art.js";

const main = document.querySelector("#main");
const status = document.querySelector("#status");
const pages = {
  home: [
    "Household",
    "01",
    "The household desk",
    "A view of the day you share.",
  ],
  together: [
    "Together",
    "02",
    "Make time together",
    "Put a plan on the shared schedule.",
  ],
  care: [
    "Care",
    "03",
    "A little daily care",
    "One routine at a time. Move at your own pace.",
  ],
  play: [
    "Play",
    "04",
    "The print studio",
    "Make a little landscape to keep or share.",
  ],
};
let state = initial();
let available = true;
try {
  state = restore(localStorage.getItem(KEY));
} catch {
  available = false;
}
let noticeTimer;
const active = () =>
  Object.hasOwn(pages, location.hash.slice(1))
    ? location.hash.slice(1)
    : "home";
const upper = (text) => text[0].toUpperCase() + text.slice(1);
function notify(text) {
  clearTimeout(noticeTimer);
  status.textContent = text;
  noticeTimer = setTimeout(() => {
    status.textContent = "";
  }, 4300);
}
function persist(message, focus) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    available = false;
  }
  render();
  if (focus) document.getElementById(focus)?.focus();
  notify(message);
}
const button = (id, label, action, cls = "primary") =>
  '<button id="' +
  id +
  '" type="button" class="' +
  cls +
  '" data-act="' +
  action +
  '">' +
  label +
  "</button>";
const card = (k, title, body) =>
  '<article class="card"><div class="eyebrow">' +
  k +
  "</div><h2>" +
  title +
  "</h2>" +
  body +
  "</article>";
const link = (page, label) =>
  '<a class="jump" href="#' +
  page +
  '">' +
  label +
  ' <span aria-hidden="true">↗</span></a>';
function timeline(plan, editable) {
  if (!plan.length) return '<p class="empty">The sample schedule is clear.</p>';
  return (
    '<ol class="timeline">' +
    plan
      .map(
        ({ id, time }) =>
          "<li><time>" +
          time +
          "</time><span>" +
          activities[id] +
          "</span>" +
          (editable
            ? '<button class="textBtn" data-remove="' +
              id +
              '" aria-label="Remove ' +
              activities[id] +
              '">Remove</button>'
            : '<i aria-hidden="true"></i>') +
          "</li>",
      )
      .join("") +
    "</ol>"
  );
}
function home() {
  const h = household(state);
  const item = h.plan[0];
  const next = item ? activities[item.id] : "Open afternoon";
  const summary = item
    ? "First on the sample schedule · " + item.time
    : "Add an activity in Together.";
  const review = state.pendingArt
    ? '<div class="miniPrint">' +
      printSVG(state.pendingArt) +
      '</div><p>A studio print is ready for a household review.</p><div class="actions">' +
      button("approve", "Approve print", "approve") +
      button("decline", "Decline", "decline", "secondary") +
      "</div>"
    : "<p>Studio prints appear here when someone offers one for review.</p>";
  const shared = h.sharedArt
    ? '<div class="miniPrint">' +
      printSVG(h.sharedArt) +
      "</div><p>Your household edition.</p>" +
      button("unpublish", "Remove shared print", "unpublish", "secondary")
    : "<p>Approved artwork will appear here.</p>";
  return (
    '<section class="hero"><div class="heroCopy"><span class="eyebrow">THE DAYBOOK &nbsp; / &nbsp; 01</span><h2>' +
    next +
    "</h2><p>" +
    summary +
    "</p>" +
    link("together", "Open schedule") +
    '</div><div class="heroArt">' +
    printSVG({ scene: "valley", palette: "orchard" }) +
    '<small>FIELD PRINT &nbsp; № 01</small></div></section><div class="grid">' +
    card("TOGETHER", "On the calendar", timeline(h.plan, false)) +
    card(
      "CARE",
      "Shared check-in",
      "<p>" +
        (h.checkIn ? "Available for a call." : "No check-in shared.") +
        "</p>" +
        link("care", "Explore Care"),
    ) +
    card("STUDIO", "Review tray", review) +
    card("PLAY", "The family wall", shared) +
    "</div>"
  );
}
function together() {
  const plan = household(state).plan;
  const choices = Object.entries(activities).filter(
    ([id]) => !plan.some((a) => a.id === id),
  );
  const form = choices.length
    ? '<form id="planForm"><label for="activity">Activity</label><select id="activity" name="activity">' +
      choices
        .map(([id, name]) => '<option value="' + id + '">' + name + "</option>")
        .join("") +
      '</select><label for="time">Start time</label><select name="time" id="time">' +
      slots.map((t) => "<option>" + t + "</option>").join("") +
      '</select><button class="primary" type="submit">Add to schedule</button></form>'
    : "<p>Every sample activity is scheduled. Remove one to use it again.</p>";
  return (
    '<div class="grid">' +
    card("SHARED PLANNER", "The sample day", timeline(plan, true)) +
    card("ADD A PLAN", "Pick a moment", form) +
    "</div>"
  );
}
function care() {
  return (
    '<div class="grid care">' +
    card(
      "PERSONAL ROUTINE",
      "Morning medication",
      '<p>Practice logging a sample routine. No reminders are sent.</p><div class="stamp">' +
        (state.careDone
          ? "✓ &nbsp; Sample marked done"
          : "○ &nbsp; Ready to check off") +
        "</div>" +
        button(
          "routine",
          state.careDone ? "Undo sample check" : "Mark sample done",
          "routine",
        ) +
        "<small>Only visible in the Care view.</small>",
    ) +
    card(
      "HOUSEHOLD CHECK-IN",
      "Have time for a call?",
      '<p>Choose whether “Available for a call” appears on the household desk.</p><div class="stamp">' +
        (state.checkIn
          ? "● &nbsp; Shared with household"
          : "○ &nbsp; Unshared") +
        "</div>" +
        button(
          "checkin",
          state.checkIn ? "Withdraw check-in" : "Share sample check-in",
          "checkin",
          "secondary",
        ),
    ) +
    card(
      "CONNECTIONS",
      "Wearable & companion",
      "<p>Device readings and personal AI conversations require an individually authorized account. This edition has no connected device or model.</p>",
    ) +
    "</div>"
  );
}
const select = (key, label, items, value) =>
  '<label for="' +
  key +
  '">' +
  label +
  '</label><select id="' +
  key +
  '">' +
  items
    .map(
      (v) =>
        '<option value="' +
        v +
        '"' +
        (v === value ? " selected" : "") +
        ">" +
        upper(v) +
        "</option>",
    )
    .join("") +
  "</select>";
const same = (a, b) => a && b && a.palette === b.palette && a.scene === b.scene;
function play() {
  const pending = same(state.art, state.pendingArt);
  return (
    '<section class="workbench"><div class="proof">' +
    printSVG(state.art) +
    "<div><span>FIELD EDITIONS</span><span>" +
    upper(state.art.scene) +
    " / " +
    upper(state.art.palette) +
    '</span></div></div><div class="press"><span class="eyebrow">PRINTMAKER &nbsp; / &nbsp; 01</span><h2>Make a field print</h2>' +
    select("scene", "Landscape", scenes, state.art.scene) +
    select("palette", "Ink palette", Object.keys(palettes), state.art.palette) +
    button("download", "Download SVG", "download") +
    '</div></section><div class="grid">' +
    card(
      "FAMILY WALL",
      "Offer your print",
      "<p>Save a copy to the review tray. A grown-up in the Household view can approve it for the wall.</p>" +
        (pending
          ? '<p class="stamp">Waiting for review</p>'
          : button("offer", "Offer for review", "offer", "secondary")) +
        (state.pendingArt
          ? button("withdraw", "Withdraw pending print", "withdraw", "textBtn")
          : ""),
    ) +
    card(
      "STUDIO NOTES",
      "Made on this device",
      "<p>Choose a landscape and ink palette to make one of nine original prints. The studio runs locally without a model, photo upload, or chat account.</p>",
    ) +
    "</div>"
  );
}
function render() {
  const page = active();
  const [name, no, title, sub] = pages[page];
  document.title = name + " · Starlight Family";
  document.querySelector("#nav").innerHTML = Object.entries(pages)
    .map(
      ([key, [label, n]]) =>
        '<a href="#' +
        key +
        '"' +
        (key === page ? ' aria-current="page"' : "") +
        "><b>" +
        n +
        "</b>" +
        label +
        "</a>",
    )
    .join("");
  main.innerHTML =
    '<div class="intro"><div class="eyebrow">FAMILY FIELD GUIDE &nbsp; / &nbsp; ' +
    no +
    "</div><h1>" +
    title +
    "</h1><p>" +
    sub +
    "</p></div>" +
    { home, together, care, play }[page]() +
    '<aside class="localNote"><strong>Sample household.</strong> All four views are available to anyone using this browser. ' +
    (available
      ? "Changes stay in this browser."
      : "Storage is unavailable. Changes last until you leave this page.") +
    " No accounts or device sync.</aside>";
}
document.querySelector(".skip").addEventListener("click", (event) => {
  event.preventDefault();
  main.focus();
});
window.addEventListener("hashchange", () => {
  render();
  main.focus();
});
window.addEventListener("storage", (e) => {
  if (e.key === KEY || e.key === null) {
    try {
      state = restore(localStorage.getItem(KEY));
      render();
    } catch {
      available = false;
      render();
    }
  }
});
main.addEventListener("submit", (e) => {
  if (e.target.id !== "planForm") return;
  e.preventDefault();
  const values = new FormData(e.target);
  if (addActivity(state, values.get("activity"), values.get("time")))
    persist("Added to the shared schedule.", "activity");
});
main.addEventListener("change", (e) => {
  if (!["scene", "palette"].includes(e.target.id)) return;
  const key = e.target.id;
  const options = key === "scene" ? scenes : Object.keys(palettes);
  if (!options.includes(e.target.value)) return;
  state.art = { ...state.art, [key]: e.target.value };
  persist("Print updated.", key);
});
main.addEventListener("click", (e) => {
  const target = e.target.closest("button");
  if (!target) return;
  if (target.dataset.remove) {
    state.plan = state.plan.filter((a) => a.id !== target.dataset.remove);
    persist("Removed from the schedule.", "activity");
    return;
  }
  switch (target.dataset.act) {
    case "routine":
      state.careDone = !state.careDone;
      persist("Sample routine updated.", "routine");
      break;
    case "checkin":
      state.checkIn = !state.checkIn;
      persist(
        state.checkIn ? "Check-in shared." : "Check-in withdrawn.",
        "checkin",
      );
      break;
    case "offer":
      state.pendingArt = { ...state.art };
      persist("Print offered for review.", "withdraw");
      break;
    case "withdraw":
      state.pendingArt = null;
      persist("Pending print withdrawn.", "offer");
      break;
    case "approve":
      if (state.pendingArt) {
        state.sharedArt = { ...state.pendingArt };
        state.pendingArt = null;
        persist("Print added to the family wall.", "unpublish");
      }
      break;
    case "decline":
      state.pendingArt = null;
      persist("Print declined.", "main");
      break;
    case "unpublish":
      state.sharedArt = null;
      persist("Print removed from the wall.", "main");
      break;
    case "download": {
      const url = URL.createObjectURL(
        new Blob([printSVG(state.art)], { type: "image/svg+xml" }),
      );
      const a = document.createElement("a");
      a.href = url;
      a.download =
        "field-print-" + state.art.scene + "-" + state.art.palette + ".svg";
      a.click();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      notify("Print ready to download.");
      break;
    }
  }
});
document.querySelector("#reset").addEventListener("click", () => {
  if (
    window.confirm(
      "Restore the sample day and clear the prints, plans, and check-in in this browser?",
    )
  ) {
    state = initial();
    persist("Sample day restored.", "reset");
  }
});
render();
