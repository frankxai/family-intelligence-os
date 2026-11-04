// Only catalog identifiers can enter storage. All four spaces simulate one household on one browser.
export const KEY = "starlight.family.fieldday.v1";
export const activities = {
  lunch: "Kitchen lunch",
  walk: "Garden walk",
  games: "Games night",
  picnic: "Park picnic",
  reading: "Reading hour",
  market: "Market visit",
};
export const slots = ["09:00", "10:30", "12:30", "14:00", "16:00", "18:30"];
export const palettes = {
  orchard: ["#eae9c8", "#f5ae61", "#809977", "#365d4c"],
  coast: ["#d9e9eb", "#f2ba88", "#7da8af", "#345b6d"],
  dusk: ["#e9d9d8", "#f6b977", "#ae8398", "#64506f"],
};
export const scenes = ["valley", "islands", "dunes"];
const own = (object, key) =>
  typeof key === "string" && Object.hasOwn(object, key);
const validArt = (art) =>
  art && own(palettes, art.palette) && scenes.includes(art.scene);
const copyArt = ({ palette, scene }) => ({ palette, scene });
export function initial() {
  return {
    plan: [
      { id: "lunch", time: "12:30" },
      { id: "walk", time: "16:00" },
    ],
    careDone: false,
    checkIn: false,
    art: { palette: "orchard", scene: "valley" },
    pendingArt: null,
    sharedArt: null,
  };
}
export function restore(raw) {
  try {
    const data = JSON.parse(raw);
    if (!data || !Array.isArray(data.plan)) return initial();
    const clean = initial();
    const seen = new Set();
    clean.plan = data.plan
      .filter(
        (item) =>
          item &&
          own(activities, item.id) &&
          slots.includes(item.time) &&
          !seen.has(item.id) &&
          seen.add(item.id),
      )
      .map(({ id, time }) => ({ id, time }));
    clean.careDone = data.careDone === true;
    clean.checkIn = data.checkIn === true;
    if (validArt(data.art)) clean.art = copyArt(data.art);
    if (validArt(data.pendingArt)) clean.pendingArt = copyArt(data.pendingArt);
    if (validArt(data.sharedArt)) clean.sharedArt = copyArt(data.sharedArt);
    return clean;
  } catch {
    return initial();
  }
}
export function household(state) {
  return {
    plan: [...state.plan].sort((a, b) => a.time.localeCompare(b.time)),
    checkIn: state.checkIn,
    sharedArt: state.sharedArt && copyArt(state.sharedArt),
  };
}
export function addActivity(state, id, time) {
  if (
    !own(activities, id) ||
    !slots.includes(time) ||
    state.plan.some((item) => item.id === id)
  )
    return false;
  state.plan.push({ id, time });
  return true;
}
