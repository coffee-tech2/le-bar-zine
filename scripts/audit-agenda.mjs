import fs from "node:fs";

const events = JSON.parse(fs.readFileSync("data/events.json", "utf8"));
const weakMarkers = ["info prudente", "à compléter", "consolider", "selon source"];
const monthIndex = {
  janvier:0, fevrier:1, février:1, mars:2, avril:3, mai:4, juin:5,
  juillet:6, aout:7, août:7, septembre:8, octobre:9, novembre:10, decembre:11, décembre:11
};

function normalize(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function makeDay(year, monthName, day){
  const month = monthIndex[normalize(monthName)];
  if(month === undefined) return null;
  return new Date(Number(year), month, Number(day));
}

function eventRange(event){
  if(["ouvert", "récurrent", "à compléter"].includes(event.status)) return null;
  const label = normalize(event.date_label);
  let match = label.match(/(\d{1,2})\s+([a-z]+)\s*-\s*(\d{1,2})\s+([a-z]+)\s+(20\d{2})/);
  if(match) return { start:makeDay(match[5], match[2], match[1]), end:makeDay(match[5], match[4], match[3]) };
  match = label.match(/(\d{1,2})\s*-\s*(\d{1,2})\s+([a-z]+)\s+(20\d{2})/);
  if(match) return { start:makeDay(match[4], match[3], match[1]), end:makeDay(match[4], match[3], match[2]) };
  match = label.match(/(\d{1,2})\s+([a-z]+)\s+(20\d{2})/);
  if(match){
    const day = makeDay(match[3], match[2], match[1]);
    return { start:day, end:day };
  }
  match = event.id.match(/(20\d{2})-(\d{2})-(\d{2})/);
  if(match){
    const day = new Date(Number(match[1]), Number(match[2]) - 1, Number(match[3]));
    return { start:day, end:day };
  }
  return null;
}

function localDay(date = new Date()){
  return new Date(date.getFullYear(), date.getMonth(), date.getDate());
}

const today = localDay();
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 7);

const past = [];
const incomplete = [];
const unsourced = [];
const thisWeek = [];

for(const event of events){
  const text = JSON.stringify(event).toLowerCase();
  const range = eventRange(event);
  if(range?.end && range.end < today) past.push(event);
  if(event.status === "à compléter" || weakMarkers.some(marker => text.includes(marker))) incomplete.push(event);
  if(!event.source || !event.url) unsourced.push(event);
  if(range?.start && range.start >= today && range.start <= nextWeek) thisWeek.push(event);
}

function print(title, items){
  console.log(`\n${title} (${items.length})`);
  if(!items.length){
    console.log("- rien à signaler");
    return;
  }
  for(const event of items){
    console.log(`- ${event.date_label} — ${event.title} [${event.status}]`);
  }
}

console.log(`Agenda audit — ${events.length} entrées`);
print("Events passés", past);
print("À compléter / prudents", incomplete);
print("Sans source ou URL", unsourced);
print("À vérifier cette semaine", thisWeek);
