import fs from "node:fs";

const bars = JSON.parse(fs.readFileSync("data/bars.json", "utf8"));
const events = JSON.parse(fs.readFileSync("data/events.json", "utf8"));

const requiredFields = [
  "id",
  "name",
  "area",
  "type",
  "section",
  "tags",
  "moods",
  "best_for",
  "avoid_if",
  "services",
  "music",
  "sound",
  "description",
  "guide_note",
  "review_plus",
  "review_watch",
  "confidence",
  "events",
  "website",
  "instagram",
  "link_confidence"
];

const requiredServices = ["terrasse", "food", "couvert", "pmr", "chauffage"];
const validSections = new Set(["bars", "night", "venue"]);
const validConfidence = new Set(["bon", "moyen"]);
const validLinkConfidence = new Set(["bon", "moyen", "à compléter"]);
const weakMarkers = ["info prudente", "à compléter", "consolider", "selon source"];
const requiredEventFields = ["id", "title", "date_label", "area", "venue", "category", "tags", "description", "source", "url", "status"];

const errors = [];
const warnings = [];
const ids = new Set();
const eventIds = new Set();

function hasWeakMarker(value){
  return weakMarkers.some(marker => String(value).toLowerCase().includes(marker));
}

function validHttpUrl(value){
  if(!value) return true;
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol);
  } catch {
    return false;
  }
}

for(const [index, bar] of bars.entries()){
  const label = bar.id || bar.name || `bar-${index}`;

  for(const field of requiredFields){
    if(!(field in bar)) errors.push(`${label}: champ manquant "${field}"`);
  }

  if(ids.has(bar.id)) errors.push(`${label}: id dupliqué`);
  ids.add(bar.id);

  if(!/^[a-z0-9-]+$/.test(bar.id || "")) errors.push(`${label}: id invalide`);
  if(!validSections.has(bar.section)) errors.push(`${label}: section invalide "${bar.section}"`);
  if(!validConfidence.has(bar.confidence)) errors.push(`${label}: confidence invalide "${bar.confidence}"`);
  if(!validLinkConfidence.has(bar.link_confidence)) errors.push(`${label}: link_confidence invalide "${bar.link_confidence}"`);

  for(const field of ["tags", "moods", "best_for", "avoid_if", "review_plus", "review_watch", "events", "sources"]){
    if(field in bar && !Array.isArray(bar[field])) errors.push(`${label}: "${field}" doit être un tableau`);
  }

  for(const field of ["tags", "moods", "best_for"]){
    if(Array.isArray(bar[field]) && bar[field].length === 0) warnings.push(`${label}: "${field}" est vide`);
  }

  for(const service of requiredServices){
    if(!bar.services || !(service in bar.services)) errors.push(`${label}: service manquant "${service}"`);
  }

  for(const field of ["website", "instagram"]){
    if(!validHttpUrl(bar[field])) errors.push(`${label}: URL invalide dans "${field}"`);
  }

  for(const event of bar.events || []){
    if(event.url && !validHttpUrl(event.url)) errors.push(`${label}: URL invalide dans events`);
  }

  if(!bar.website && !bar.instagram) warnings.push(`${label}: aucun lien officiel ou social`);
  if((bar.sources || []).length < 2) warnings.push(`${label}: sources à renforcer`);
  if(hasWeakMarker(JSON.stringify(bar))) warnings.push(`${label}: contient encore une info prudente`);
}

for(const [index, event] of events.entries()){
  const label = event.id || event.title || `event-${index}`;

  for(const field of requiredEventFields){
    if(!(field in event)) errors.push(`${label}: champ event manquant "${field}"`);
  }

  if(eventIds.has(event.id)) errors.push(`${label}: id event dupliqué`);
  eventIds.add(event.id);

  if(!/^[a-z0-9-]+$/.test(event.id || "")) errors.push(`${label}: id event invalide`);
  if(!Array.isArray(event.tags)) errors.push(`${label}: "tags" event doit être un tableau`);
  if(event.url && !validHttpUrl(event.url)) errors.push(`${label}: URL event invalide`);
  if(hasWeakMarker(JSON.stringify(event))) warnings.push(`${label}: event contient encore une info prudente ou à compléter`);
}

if(errors.length){
  console.error("Erreurs données:");
  for(const error of errors) console.error(`- ${error}`);
}

if(warnings.length){
  console.warn("Avertissements données:");
  for(const warning of warnings) console.warn(`- ${warning}`);
}

console.log(`${bars.length} fiches bars et ${events.length} entrées agenda analysées, ${errors.length} erreur(s), ${warnings.length} avertissement(s).`);

if(errors.length) process.exit(1);
