// ─── DATA ───────────────────────────────────────────────────────────
let BARS = [];
let EVENTS = [];

const CONTRIBUTION_URL = "https://github.com/coffee-tech2/le-bar-zine/issues/new";
const SUPPORT_URL = "https://github.com/sponsors/coffee-tech2";

function issueUrl(title, body){
  const params = new URLSearchParams({ title, body });
  return `${CONTRIBUTION_URL}?${params.toString()}`;
}

const EVENT_CONTRIBUTION_URL = issueUrl(
  "Proposer un event",
  [
    "Titre :",
    "Date / heure :",
    "Lieu :",
    "Lien source :",
    "Pourquoi c'est dans l'esprit du Bar Zine :"
  ].join("\n")
);
const BAR_CONTRIBUTION_URL = issueUrl(
  "Proposer un bar",
  [
    "Nom du lieu :",
    "Quartier :",
    "Lien officiel / Instagram :",
    "Pourquoi il mérite une fiche :",
    "Bon pour :"
  ].join("\n")
);
const CORRECTION_CONTRIBUTION_URL = issueUrl(
  "Corriger ou compléter une fiche",
  [
    "Fiche concernée :",
    "Info à corriger / ajouter :",
    "Source :"
  ].join("\n")
);

// ─── MOODS CONFIG ────────────────────────────────────────────────────
// Chaque mood a : clé, label, sous-titre, et mots-clés de matching explicites
const MOODS = [
  {
    key:"date",
    label:"Avant concert",
    sub:"boire proche, partir facile",
    keywords:["date","calme","posé","intime","rendez-vous","tranquille"],
    excludeSection:"night",
    preferLow:true // préférer sound bas
  },
  {
    key:"calme",
    label:"Après manif",
    sub:"débriefer sans forcer",
    keywords:["calme","discussion","posé","tranquille","solo","brunch","parc","café"],
    excludeSection:"night",
    preferLow:true
  },
  {
    key:"apéro",
    label:"Verre dehors",
    sub:"terrasse, lac, trottoir",
    keywords:["apéro","terrasse","extérieur","lac","soleil","parc","dehors"],
    requireTerrace:true
  },
  {
    key:"groupe",
    label:"Point de ralliement",
    sub:"central, simple, lisible",
    keywords:["groupe","pub","central","simple","afterwork","bière","food"],
    excludeSection:"night"
  },
  {
    key:"solo",
    label:"Coin calme",
    sub:"parler, lire, souffler",
    keywords:["solo","café","brunch","journée","calme","pause","refuge"],
    excludeSection:"night",
    preferLow:true
  },
  {
    key:"nuit",
    label:"Continuer après",
    sub:"nuit, salle, danse",
    keywords:["nuit","club","concert","danse","tard","musique","sortie"],
    requireSection:"night"
  },
  {
    key:"culture",
    label:"Scène locale",
    sub:"concert, prog, collectif",
    keywords:["culture","concert","musique","scène","programmation","salle"],
    preferSection:"night"
  }
];

const TABS = [
  ["all","Radar"],
  ["agenda","Ce soir"],
  ["support","Participer"]
];

// ─── STATE ───────────────────────────────────────────────────────────
let saved = readSaved();
let state = { query:"", mood:"", tab:"all" };

// ─── UTILS ───────────────────────────────────────────────────────────
function readSaved(){
  try {
    const parsed = JSON.parse(localStorage.getItem("barZineV6Saved") || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}
function writeSaved(){
  try {
    localStorage.setItem("barZineV6Saved", JSON.stringify(saved));
  } catch {
    // Favoris indisponibles en navigation privée stricte ou stockage bloqué.
  }
}
function escapeHtml(value){
  return String(value ?? "").replace(/[&<>"']/g, char => ({
    "&":"&amp;",
    "<":"&lt;",
    ">":"&gt;",
    '"':"&quot;",
    "'":"&#39;"
  })[char]);
}
function safeUrl(value){
  const url = String(value || "").trim();
  if(!url) return "";
  try {
    const parsed = new URL(url, window.location.href);
    return ["http:", "https:"].includes(parsed.protocol) ? parsed.href : "";
  } catch {
    return "";
  }
}
function href(value){
  return escapeHtml(safeUrl(value));
}
function barRef(id){
  return escapeHtml(String(id).replace(/\\/g, "\\\\").replace(/'/g, "\\'"));
}
function asList(value){
  if(Array.isArray(value)) return value;
  return value ? [value] : [];
}
function normalizeText(value){
  return String(value ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}
function isSaved(id){ return saved.includes(id) }
function toggleSave(id, e){
  if(e) e.stopPropagation();
  saved = isSaved(id) ? saved.filter(x=>x!==id) : [...saved, id];
  writeSaved();
  render();
}
function isTerrace(b){ return String(b.services.terrasse).startsWith("oui") }
function isNight(b){ return b.section==="night" }
function isLow(b){ return b.sound && (b.sound.startsWith("bas") || b.sound === "moyen") }
function hasWeakMarker(bar){
  const text = JSON.stringify(bar).toLowerCase();
  return ["info prudente", "à compléter", "consolider", "selon source"].some(marker => text.includes(marker));
}
function editorialStatus(bar){
  if(bar.link_confidence === "à compléter" || !safeUrl(bar.website) && !safeUrl(bar.instagram)){
    return { key:"todo", label:"infos à compléter" };
  }
  if(hasWeakMarker(bar) || bar.confidence === "moyen" || bar.link_confidence === "moyen"){
    return { key:"check", label:"info prudente" };
  }
  return { key:"ok", label:"fiche solide" };
}
function eventBlob(event){
  return [
    event.title,
    event.date_label,
    event.area,
    event.venue,
    event.category,
    (event.tags || []).join(" "),
    event.description,
    event.source,
    event.status
  ].join(" ").toLowerCase();
}
function eventStatus(event){
  if(event.status === "ouvert") return { key:"ok", label:"appel ouvert" };
  if(event.status === "vérifié") return { key:"ok", label:"vérifié" };
  if(event.status === "récurrent") return { key:"check", label:"récurrent" };
  if(event.status === "à compléter") return { key:"todo", label:"à compléter" };
  return { key:"check", label:event.status || "info prudente" };
}

// Blob pour la recherche fulltext
function blob(b){
  return [
    b.name, b.area, b.type, b.section,
    asList(b.tags).join(" "), asList(b.moods).join(" "),
    asList(b.best_for).join(" "), asList(b.avoid_if).join(" "),
    asList(b.decision_for).join(" "), asList(b.decision_avoid).join(" "),
    b.short, b.music, b.sound, b.description,
    b.guide_note, asList(b.review_plus).join(" "), asList(b.review_watch).join(" ")
  ].join(" ").toLowerCase();
}
function barHook(bar){
  return bar.short || bar.description || bar.guide_note || "";
}

// ─── SCORE PAR MOOD ─────────────────────────────────────────────────
// Retourne un score de pertinence (0-10) d'un bar pour un mood donné
function moodScore(bar, moodKey){
  if(!moodKey) return bar.confidence === "bon" ? 3 : 1;
  const cfg = MOODS.find(m => m.key === moodKey);
  if(!cfg) return 0;

  // Exclusions dures
  if(cfg.excludeSection && bar.section === cfg.excludeSection) return -1;
  if(cfg.requireSection && bar.section !== cfg.requireSection) return -1;
  if(cfg.requireTerrace && !isTerrace(bar)) return -1;

  let score = 0;

  // Match keywords dans le blob du bar
  const b = blob(bar);
  cfg.keywords.forEach(kw => {
    if(b.includes(kw.toLowerCase())) score += 1.5;
  });

  // Match dans moods[] explicite du bar (champ JSON)
  bar.moods.forEach(bm => {
    cfg.keywords.forEach(kw => {
      if(bm.toLowerCase().includes(kw.toLowerCase())) score += 2;
    });
  });

  // Bonus confiance
  if(bar.confidence === "bon") score += 1.5;

  // Bonus terrasse si mood apéro
  if(cfg.requireTerrace && isTerrace(bar)) score += 1;

  // Bonus/malus son
  if(cfg.preferLow){
    if(isLow(bar)) score += 1.5;
    else if(bar.sound && bar.sound.includes("élevé")) score -= 1;
  }

  // Bonus section nuit si mood culture
  if(cfg.preferSection && bar.section === cfg.preferSection) score += 1;

  return score;
}

function recommendationReason(bar, moodKey){
  const cfg = MOODS.find(m => m.key === moodKey);
  if(!cfg) return bar.best_for[0] || bar.guide_note || "";

  if(cfg.requireTerrace && isTerrace(bar)) return "Terrasse confirmée dans la fiche";
  if(cfg.requireSection === "night") return "Classé dans les lieux de nuit";
  if(cfg.preferLow && isLow(bar)) return "Niveau sonore plutôt compatible";
  if(cfg.preferSection && bar.section === cfg.preferSection) return "Programmation culturelle ou musicale";

  const text = blob(bar);
  const keyword = cfg.keywords.find(kw => text.includes(kw.toLowerCase()));
  if(keyword) return `Match mood : ${keyword}`;

  return bar.best_for[0] || bar.guide_note || "";
}

// ─── FILTRAGE ────────────────────────────────────────────────────────
function filtered(){
  return BARS.filter(b => {
    // Recherche texte
    if(state.query && !blob(b).includes(state.query.toLowerCase())) return false;
    // Mood : exclure les bars qui scorent -1
    if(state.mood && moodScore(b, state.mood) < 0) return false;
    // Tabs
    if(state.tab === "terrasses" && !isTerrace(b)) return false;
    if(state.tab === "night" && !isNight(b)) return false;
  if(state.tab === "bars" && isNight(b)) return false;
  if(state.tab === "saved" && !isSaved(b.id)) return false;
  if(state.tab === "support") return false;
    return true;
  }).sort((a, b) => {
    // Tri par score si un mood est actif
    if(state.mood) return moodScore(b, state.mood) - moodScore(a, state.mood);
    return 0;
  });
}

function filteredEvents(){
  return EVENTS.filter(event => {
    if(state.query && !eventBlob(event).includes(state.query.toLowerCase())) return false;
    return true;
  });
}

const EVENT_SECTIONS = [
  {
    key:"dated",
    title:"Agenda daté",
    note:"concerts · fêtes · sorties"
  },
  {
    key:"queer",
    title:"Pride / queer",
    note:"safe spaces · luttes · culture"
  },
  {
    key:"recurring",
    title:"Récurrents & lieux à surveiller",
    note:"autogéré · cantines · chorales"
  },
  {
    key:"calls",
    title:"Appels & contributions",
    note:"à compléter avec le terrain"
  }
];

function eventSectionKey(event){
  const text = eventBlob(event);
  if(event.status === "ouvert" || event.category === "repérage") return "calls";
  if(event.status === "récurrent") return "recurring";
  if(text.includes("pride") || text.includes("queer") || text.includes("lgbt") || text.includes("fières")) return "queer";
  return "dated";
}

function barById(id){
  return BARS.find(bar => bar.id === id);
}

function nearbyBarsForEvent(event, limit = 5){
  const eventText = normalizeText(eventBlob(event));
  const venueText = normalizeText(`${event.venue || ""} ${event.area || ""}`);
  const terms = venueText.split(/[^a-z0-9]+/).filter(term => term.length > 2);

  const scored = BARS.map(bar => {
    const barText = normalizeText(blob(bar));
    let score = 0;

    if(eventText.includes(normalizeText(bar.name))) score += 12;
    terms.forEach(term => {
      if(barText.includes(term)) score += 4;
    });
    asList(bar.tags).forEach(tag => {
      const normalizedTag = normalizeText(tag);
      if(normalizedTag && eventText.includes(normalizedTag)) score += 2;
    });
    if(!isNight(bar)) score += 1;
    if(isLow(bar)) score += 1;

    return { bar, score };
  }).filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score || a.bar.name.localeCompare(b.bar.name));

  const fallback = BARS.filter(bar => !isNight(bar)).slice(0, limit);
  return (scored.length ? scored.map(item => item.bar) : fallback).slice(0, limit);
}

function eventPlanCards(event){
  if(event.status === "ouvert" || event.status === "à compléter") return [];
  const nearby = nearbyBarsForEvent(event);
  const drink = nearby.find(bar => !isNight(bar)) || nearby[0];
  const settle = nearby.find(bar => !isNight(bar) && isLow(bar)) || drink;
  const eventText = eventBlob(event);
  const after = nearby.find(bar => isNight(bar) && !eventText.includes(bar.name.toLowerCase())) || nearby[1] || nearby[0];
  const closest = nearby[0];
  const rawPlans = [
    { label:"Boire avant", bar:drink, hint:"un verre sans trop réfléchir" },
    { label:"Se poser avant", bar:settle, hint:"arriver tôt sans courir" },
    { label:"Continuer après", bar:after, hint:"si la soirée déborde" },
    { label:"Près du lieu", bar:closest, hint:"repère autour de l'event" }
  ];

  const seen = new Set();
  return rawPlans.filter(plan => {
    if(!plan.bar) return false;
    const key = `${plan.label}-${plan.bar.id}`;
    if(seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function relatedEventsForBar(bar){
  return EVENTS.filter(event => {
    const text = eventBlob(event);
    if(event.status === "ouvert" || event.status === "à compléter") return false;
    if(text.includes(bar.name.toLowerCase())) return true;
    if(bar.id === "base-bar" && (text.includes("docks") || text.includes("sévelin") || text.includes("sevelin"))) return true;
    if(bar.id === "tao" && text.includes("flon")) return true;
    if(bar.id === "montbenon" && text.includes("montbenon")) return true;
    if(bar.id === "cafe-grancy" && text.includes("tivoli")) return true;
    if(bar.id === "great-escape" && (text.includes("bourg") || text.includes("montbenon") || text.includes("riponne"))) return true;
    if(bar.id === "pointu" && (text.includes("riponne") || text.includes("montbenon"))) return true;
    if(bar.id === "nabi" && (text.includes("gare") || text.includes("plateforme") || text.includes("tivoli"))) return true;
    return false;
  }).slice(0, 5);
}

function renderEventCard(event){
  const status = eventStatus(event);
  const plans = eventPlanCards(event);
  return `
    <article class="event-card">
      <div>
        <p class="event-date">${escapeHtml(event.date_label)} · ${escapeHtml(event.area)}</p>
        <h2>${escapeHtml(event.title)}</h2>
        <p class="event-place">${escapeHtml(event.venue)}</p>
      </div>
      <p>${escapeHtml(event.description)}</p>
      <div class="tags">
        ${(event.tags || []).slice(0,6).map(tag => `<span class="tag">${escapeHtml(tag)}</span>`).join("")}
        <span class="status status-${status.key}">${escapeHtml(status.label)}</span>
      </div>
      ${plans.length ? `
        <div class="event-plans">
          <p>Plans autour</p>
          <div>
            ${plans.map(plan => `
              <button type="button" onclick="window.openDetail('${barRef(plan.bar.id)}')">
                <span>${escapeHtml(plan.label)}</span>
                <strong>${escapeHtml(plan.bar.name)}</strong>
                <em>${escapeHtml(plan.hint)}</em>
              </button>
            `).join("")}
          </div>
        </div>
      ` : ''}
      ${safeUrl(event.url) ? `<a class="event-link" href="${href(event.url)}" target="_blank" rel="noopener">Envoyer / voir la source →</a>` : ''}
    </article>
  `;
}

function renderTonightStrip(){
  const strip = document.getElementById("tonightStrip");
  if(!strip) return;
  if(state.tab === "support" || state.tab === "saved"){
    strip.innerHTML = "";
    strip.hidden = true;
    return;
  }

  const spotlight = EVENTS
    .filter(event => event.status === "vérifié")
    .slice(0, 2);

  strip.hidden = !spotlight.length;
  strip.innerHTML = spotlight.length ? `
    <div class="tonight-head">
      <span>Ce soir à Lausanne →</span>
    </div>
    <div class="tonight-list">
      ${spotlight.map(event => {
        const plans = eventPlanCards(event);
        const mainPlan = plans[0];
        return `
          <article class="tonight-card">
            <p>${escapeHtml(event.date_label)} · ${escapeHtml(event.area)}</p>
            <h2>${escapeHtml(event.title)}</h2>
            <button type="button" ${mainPlan ? `onclick="window.openDetail('${barRef(mainPlan.bar.id)}')"` : `onclick="window.goPulse('events')"`}>
              ${escapeHtml(event.venue)} · plans autour →
            </button>
          </article>
        `;
      }).join("")}
    </div>
  ` : "";
}

function renderPulse(){
  const pulseEvents = document.getElementById("pulseEvents");
  const pulseBars = document.getElementById("pulseBars");
  if(!pulseEvents || !pulseBars) return;

  const verifiedEvents = EVENTS.filter(event => event.status === "vérifié").length;
  const recurringEvents = EVENTS.filter(event => event.status === "récurrent").length;
  const nightPlaces = BARS.filter(isNight).length;
  const terracePlaces = BARS.filter(isTerrace).length;

  pulseEvents.textContent = `${verifiedEvents} datés · ${recurringEvents} récurrents`;
  pulseBars.textContent = `${BARS.length} fiches · ${nightPlaces} scènes · ${terracePlaces} terrasses`;
}

function renderSavedShortcut(){
  const savedCount = document.getElementById("savedCount");
  if(savedCount) savedCount.textContent = String(saved.length);
  const shortcut = document.querySelector(".saved-shortcut");
  if(shortcut) shortcut.classList.toggle("active", state.tab === "saved");
}

// ─── RENDER CONTROLS ─────────────────────────────────────────────────
function renderControls(){
  document.getElementById("moodGrid").innerHTML = MOODS.map(m =>
    `<button class="mood-btn ${state.mood===m.key?'active':''}" onclick="window.setMood('${barRef(m.key)}')" aria-pressed="${state.mood===m.key}">${escapeHtml(m.label)}<em>${escapeHtml(m.sub)}</em></button>`
  ).join("");

  document.getElementById("tabs").innerHTML = TABS.map(([k,l]) => {
    return `<button class="tab ${state.tab===k?'active':''}" onclick="window.setTab('${barRef(k)}')" aria-pressed="${state.tab===k}">${escapeHtml(l)}</button>`;
  }).join("");
}

function renderIntroPanel(){
  return `
    <section class="zine-panel">
      <div>
        <p class="kicker">Culture lausannoise · relais communautaire · agenda vivant</p>
        <h2>À relayer, pas à lisser.</h2>
        <p>Concerts, scènes locales, événements associatifs, manifs, appels, lieux alternatifs et formats qui passent souvent sous les radars classiques. L'objectif : rendre visible, sourcer proprement, et relier chaque event à des plans autour.</p>
      </div>
      <div class="panel-actions">
        <a href="${escapeHtml(EVENT_CONTRIBUTION_URL)}" target="_blank" rel="noopener">Proposer un event</a>
        <a href="${escapeHtml(SUPPORT_URL)}" target="_blank" rel="noopener">Soutenir le zine</a>
      </div>
    </section>
  `;
}

function renderAgenda(){
  const events = filteredEvents();
  const groupedEvents = EVENT_SECTIONS.map(section => ({
    ...section,
    events: events.filter(event => eventSectionKey(event) === section.key)
  })).filter(section => section.events.length);

  document.getElementById("grid").innerHTML = `
    ${renderIntroPanel()}
    <section class="agenda-list">
      ${groupedEvents.length ? groupedEvents.map(section => `
        <div class="event-section">
          <div class="event-section-title">
            <h3>${escapeHtml(section.title)}</h3>
            <span>${section.events.length} · ${escapeHtml(section.note)}</span>
          </div>
          ${section.events.map(renderEventCard).join("")}
        </div>
      `).join("") : '<div class="empty">Aucun event ne match cette recherche.</div>'}
    </section>
  `;
  document.getElementById("sideText").textContent = `${events.length} événement${events.length>1?'s':''} / appels`;
  document.getElementById("sideList").innerHTML = groupedEvents.map(section =>
    `<div class="side-item">${escapeHtml(section.title)}<em>${section.events.length} entrée${section.events.length>1?'s':''}</em></div>`
  ).join("") || events.slice(0,4).map(event =>
    `<div class="side-item">${escapeHtml(event.title)}<em>${escapeHtml(event.date_label)}</em></div>`
  ).join("");
}

function renderSupport(){
  document.getElementById("grid").innerHTML = `
    <section class="support-board">
      <div class="support-lead">
        <p class="kicker">Communauté · contributions · économie claire</p>
        <h2>Faire vivre le radar.</h2>
        <p>Le Bar Zine peut grandir par contributions : events proposés, fiches complétées, relais de collectifs, soutiens volontaires et partenariats clairement marqués. Pas de faux avis, pas de classement acheté, pas de pub déguisée.</p>
      </div>
      <div class="support-options">
        <article>
          <h3>Proposer un event</h3>
          <p>Concert, projection, manif, lecture, expo, soirée, appel ou format local qui mérite d'être relayé.</p>
          <a href="${escapeHtml(EVENT_CONTRIBUTION_URL)}" target="_blank" rel="noopener">Soumettre un event →</a>
        </article>
        <article>
          <h3>Proposer un bar</h3>
          <p>Ajouter un lieu lausannois qui colle à l'esprit du radar : utile, vivant, accessible, situé.</p>
          <a href="${escapeHtml(BAR_CONTRIBUTION_URL)}" target="_blank" rel="noopener">Soumettre un bar →</a>
        </article>
        <article>
          <h3>Compléter une fiche</h3>
          <p>Ajouter une info fiable sur un bar, une programmation, un service, une accessibilité ou une source officielle.</p>
          <a href="${escapeHtml(CORRECTION_CONTRIBUTION_URL)}" target="_blank" rel="noopener">Signaler une info →</a>
        </article>
        <article>
          <h3>Soutenir le zine</h3>
          <p>Financer l'hébergement, la veille, le temps de tri, les sorties terrain et les futures éditions culturelles.</p>
          <a href="${escapeHtml(SUPPORT_URL)}" target="_blank" rel="noopener">Brancher le soutien →</a>
        </article>
      </div>
    </section>
  `;
  document.getElementById("sideText").textContent = "Communauté : proposer, corriger, soutenir, relayer.";
  document.getElementById("sideList").innerHTML = `
    <div class="side-item">Events<em>concerts / manifs / appels</em></div>
    <div class="side-item">Fiches<em>bars / sources / services</em></div>
    <div class="side-item">Soutiens<em>lecteurs / éditions</em></div>
  `;
}

// ─── RENDER GRID ─────────────────────────────────────────────────────
function renderGrid(){
  if(state.tab === "agenda"){
    renderAgenda();
    return;
  }
  if(state.tab === "support"){
    renderSupport();
    return;
  }

  const data = filtered();
  const moodCfg = MOODS.find(m => m.key === state.mood);
  const emptyMessage = state.tab === "saved"
    ? "Aucun FAV pour l'instant."
    : "Rien ici. Change de mood ou de recherche.";

  document.getElementById("grid").innerHTML = data.length
    ? data.map(b => `
      <article class="card" onclick="window.openDetail('${barRef(b.id)}')">
        <div class="card-left">
          <h2 class="name">${escapeHtml(b.name)}</h2>
          <div class="meta">${escapeHtml(b.area)} · ${escapeHtml(b.type)}</div>
        </div>
        <div class="card-body">
          <p class="hook">${escapeHtml(barHook(b))}</p>
          ${state.mood ? `<p class="reason">${escapeHtml(recommendationReason(b, state.mood))}</p>` : ''}
          <div class="card-fit">
            <span>Bon pour</span>
            <strong>${escapeHtml((asList(b.decision_for).length ? asList(b.decision_for) : asList(b.best_for)).slice(0,2).join(" · ") || b.guide_note || "sortie simple")}</strong>
          </div>
          <div class="card-fit muted">
            <span>Évite si</span>
            <strong>${escapeHtml((asList(b.decision_avoid).length ? asList(b.decision_avoid) : asList(b.avoid_if)).slice(0,1).join(" · ") || "rien de bloquant dans la fiche")}</strong>
          </div>
          <div class="tags">
            ${asList(b.tags).slice(0,3).map(t=>`<span class="tag">${escapeHtml(t)}</span>`).join("")}
            ${isTerrace(b)?'<span class="tag">terrasse ✓</span>':''}
          </div>
          <div class="card-open">Ouvrir la fiche →</div>
        </div>
        <button class="save-btn ${isSaved(b.id)?'saved':''}" onclick="window.toggleSave('${barRef(b.id)}',event)" aria-label="${isSaved(b.id)?'Retirer des favoris':'Ajouter aux favoris'}">${isSaved(b.id)?'♥':'♡'}</button>
      </article>
    `).join("")
    : `<div class="empty">${escapeHtml(emptyMessage)}</div>`;

  // Sidebar
  const top4 = data.slice(0, 4);
  document.getElementById("sideText").textContent = state.tab === "saved"
    ? `${data.length} FAV gardé${data.length>1?'s':''} sous la main.`
    : state.mood
      ? `Mood : ${moodCfg ? moodCfg.label : state.mood} — ${data.length} résultat${data.length>1?'s':''}`
      : "Choisis un mood pour une sélection orientée.";
  document.getElementById("sideList").innerHTML = top4.map(b =>
    `<div class="side-item" onclick="window.openDetail('${barRef(b.id)}')">${escapeHtml(b.name)}<em>${escapeHtml(asList(b.best_for)[0]||b.area)}</em></div>`
  ).join("");
}

// ─── CHOISIS POUR MOI (algo V6) ──────────────────────────────────────
window.chooseForMe = function(){
  // Pool : filtrés par mood (excl. sections incompatibles)
  let pool = filtered();
  if(!pool.length) pool = [...BARS];

  // Scorer et trier
  const scored = pool
    .map(b => ({ bar:b, score: moodScore(b, state.mood) }))
    .filter(x => x.score >= 0)
    .sort((a,b) => b.score - a.score);

  // Prendre le top — cohérence avant diversité
  // On prend les 6 meilleurs puis on garde les 3 premiers (pas de shuffle ici)
  // Sauf si plusieurs ont le même score : on donne un léger shuffle dans le top 4
  const top6 = scored.slice(0, 6);

  // Shuffle léger dans les ex-aequo du top pour ne pas figer la sélection
  const topScore = top6[0]?.score || 0;
  const topTied = top6.filter(x => x.score >= topScore - 0.5);
  const rest = top6.filter(x => x.score < topScore - 0.5);

  // Shuffle uniquement les ex-aequo
  topTied.sort(() => Math.random() - 0.5);
  const finalTop3 = [...topTied, ...rest].slice(0, 3).map(x => x.bar);

  const moodCfg = MOODS.find(m => m.key === state.mood);
  document.getElementById("pickMoodLabel").textContent = state.mood
    ? `Mood actif : ${moodCfg ? moodCfg.label : state.mood}`
    : "Sélection générale — fiabilité";

  document.getElementById("pickList").innerHTML = finalTop3.map((b, i) => `
    <article class="pick-card" onclick="window.openDetail('${barRef(b.id)}');window.closePick();">
      <div class="pick-num">0${i+1}</div>
      <h3>${escapeHtml(b.name)}</h3>
      <p>${escapeHtml(b.description)}</p>
      <div class="pick-why">→ ${escapeHtml(recommendationReason(b, state.mood) || b.best_for[0] || b.guide_note)}</div>
    </article>
  `).join("");

  document.getElementById("pickModal").classList.add("open");
};

window.closePick = function(){
  document.getElementById("pickModal").classList.remove("open");
};

// ─── FICHE BAR ───────────────────────────────────────────────────────
window.openDetail = function(id){
  const b = BARS.find(x => x.id === id);
  if(!b) return;

  // Lien agenda officiel : préférence website > instagram > google
  const websiteUrl = safeUrl(b.website);
  const instagramUrl = safeUrl(b.instagram);
  const agendaUrl = websiteUrl || instagramUrl || `https://www.google.com/search?q=${encodeURIComponent(b.name+' Lausanne agenda')}`;
  const completeUrl = issueUrl(
    `Compléter fiche : ${b.name}`,
    [
      `Fiche : ${b.name}`,
      "Info à ajouter / corriger :",
      "Source :"
    ].join("\n")
  );
  const linkedEventUrl = issueUrl(
    `Proposer un event lié : ${b.name}`,
    [
      `Lieu lié : ${b.name}`,
      "Titre de l'event :",
      "Date / heure :",
      "Lien source :"
    ].join("\n")
  );

  // Bloc agenda
  const hasEvents = (b.events||[]).length > 0;
  let agendaHtml = '';
  if(hasEvents){
    agendaHtml = (b.events||[]).map(ev => `
      <div class="agenda-block">
        <div class="agenda-block-text">
          <strong>${escapeHtml(ev.title)}</strong>
          <span>${escapeHtml(ev.date)} · ${escapeHtml(ev.source)}</span>
        </div>
        ${safeUrl(ev.url) ? `<a class="agenda-go" href="${href(ev.url)}" target="_blank" rel="noopener">Voir →</a>` : ''}
      </div>
    `).join('');
  } else {
    agendaHtml = `<p class="agenda-empty">Pas d'événement renseigné — programme à consulter directement sur leurs canaux.</p>`;
  }
  const linkedEvents = relatedEventsForBar(b);
  const nearbyEventsHtml = linkedEvents.length ? `
    <div class="nearby-events">
      <h3>Events autour / liés</h3>
      ${linkedEvents.map(event => `
        <article>
          <span>${escapeHtml(event.date_label)} · ${escapeHtml(event.area)}</span>
          <strong>${escapeHtml(event.title)}</strong>
          <em>${escapeHtml(event.venue)}</em>
          ${safeUrl(event.url) ? `<a href="${href(event.url)}" target="_blank" rel="noopener">Source →</a>` : ''}
        </article>
      `).join("")}
    </div>
  ` : '';
  const detailContextHtml = linkedEvents.length ? `
    <div class="detail-context">
      <div>
        <span>À combiner avec</span>
        <strong>${linkedEvents.length} event${linkedEvents.length>1?'s':''} autour</strong>
      </div>
      <div class="detail-context-list">
        ${linkedEvents.slice(0,3).map(event => `
          <a href="${href(event.url)}" target="_blank" rel="noopener">
            <span>${escapeHtml(event.date_label)}</span>
            <strong>${escapeHtml(event.title)}</strong>
          </a>
        `).join("")}
      </div>
    </div>
  ` : '';

  document.getElementById("detailContent").innerHTML = `
    <div class="detail-head">
      <h2 class="detail-title">${escapeHtml(b.name)}</h2>
      <div class="detail-meta">${escapeHtml(b.area)} · ${escapeHtml(b.type)} · ${escapeHtml(b.sound)}</div>
      <div class="detail-actions">
        <button class="detail-save" onclick="window.toggleSave('${barRef(b.id)}',event)">
          ${isSaved(b.id) ? '♥ Enregistré' : '♡ Enregistrer'}
        </button>
        <a class="agenda-link" href="${escapeHtml(agendaUrl)}" target="_blank" rel="noopener">
          Voir la programmation →
        </a>
        <a class="agenda-link detail-community" href="${escapeHtml(completeUrl)}" target="_blank" rel="noopener">
          Compléter la fiche →
        </a>
      </div>
      <div class="agenda-label">Événements et horaires à consulter directement auprès du lieu.</div>
    </div>

    <p class="lead-text">${escapeHtml(b.description)}</p>
    ${detailContextHtml}

    <div class="progressive">

      <details class="fold" open>
        <summary>L'essentiel</summary>
        <div class="fold-content sections">
          <div class="box">
            <h3>Bon pour</h3>
            <div class="pills">${b.best_for.map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</div>
          </div>
          <div class="box">
            <h3>À éviter si</h3>
            <div class="pills">${b.avoid_if.map(x=>`<span class="pill">${escapeHtml(x)}</span>`).join("")}</div>
          </div>
        </div>
      </details>

      <details class="fold">
        <summary>Ambiance & musique</summary>
        <div class="fold-content sections">
          <div class="box"><h3>Musique</h3><p>${escapeHtml(b.music)}</p></div>
          <div class="box"><h3>Niveau sonore</h3><p>${escapeHtml(b.sound)}</p></div>
          <div class="box"><h3>Conseil</h3><p>${escapeHtml(b.guide_note)}</p></div>
          <div class="box">
            <h3>Fiabilité</h3>
            <div class="status-row">
              <span class="confidence ${escapeHtml(b.confidence)}">${escapeHtml(b.confidence)}</span>
              <span class="status status-${editorialStatus(b).key}">${escapeHtml(editorialStatus(b).label)}</span>
            </div>
            <p style="margin-top:8px;font-size:13px;color:var(--muted)">${escapeHtml((b.sources||[]).join(" · "))}</p>
          </div>
        </div>
      </details>

      <details class="fold">
        <summary>Ce qui ressort</summary>
        <div class="fold-content sections">
          <div class="box">
            <h3>Souvent apprécié</h3>
            <ul>${b.review_plus.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
          </div>
          <div class="box">
            <h3>À garder en tête</h3>
            <ul>${b.review_watch.map(x=>`<li>${escapeHtml(x)}</li>`).join("")}</ul>
          </div>
        </div>
      </details>

      <details class="fold">
        <summary>Services</summary>
        <div class="fold-content">
          <div class="service-grid">
            ${Object.entries(b.services).map(([k,v])=>`<div class="service">${escapeHtml(k)}<b>${escapeHtml(v)}</b></div>`).join("")}
          </div>
        </div>
      </details>

      <details class="fold">
        <summary>Programmation</summary>
        <div class="fold-content">
          <div class="agenda-section">
            ${agendaHtml}
            ${nearbyEventsHtml}
            <div class="agenda-block" style="margin-top:12px;background:var(--paper-dark)">
              <div class="agenda-block-text">
                <strong>Agenda officiel</strong>
                <span>Programme complet sur les canaux du lieu</span>
              </div>
              <a class="agenda-go" href="${escapeHtml(agendaUrl)}" target="_blank" rel="noopener">Ouvrir →</a>
            </div>
            <div class="agenda-block contribution-block">
              <div class="agenda-block-text">
                <strong>Event à ajouter ?</strong>
                <span>Proposer une date liée à ce lieu pour le radar culturel</span>
              </div>
              <a class="agenda-go" href="${escapeHtml(linkedEventUrl)}" target="_blank" rel="noopener">Proposer →</a>
            </div>
          </div>
        </div>
      </details>

    </div>

    <div class="cta">
      <a href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.name+' Lausanne')}" target="_blank" rel="noopener">Voir sur la carte</a>
      ${websiteUrl ? `<a href="${escapeHtml(websiteUrl)}" target="_blank" rel="noopener">Site officiel</a>` : ''}
      ${instagramUrl ? `<a href="${escapeHtml(instagramUrl)}" target="_blank" rel="noopener">Instagram</a>` : ''}
      ${(!websiteUrl && !instagramUrl) ? `<a href="https://www.google.com/search?q=${encodeURIComponent(b.name+' Lausanne')}" target="_blank" rel="noopener">Chercher infos</a>` : ''}
    </div>
  `;

  document.getElementById("detail").classList.add("open");
  document.getElementById("detail").scrollTo(0, 0);
};

window.closeDetail = function(){
  document.getElementById("detail").classList.remove("open");
};

// ─── NAVIGATION ──────────────────────────────────────────────────────
window.setMood = function(m){
  state.mood = state.mood === m ? "" : m;
  render();
};
window.setTab = function(t){
  state.tab = t;
  render();
};

window.openSaved = function(){
  state.tab = "saved";
  state.mood = "";
  state.query = "";
  const searchInput = document.getElementById("searchInput");
  if(searchInput) searchInput.value = "";
  render();
  document.getElementById("grid")?.scrollIntoView({ behavior:"smooth", block:"start" });
};

window.goPulse = function(target){
  const searchInput = document.getElementById("searchInput");
  state.query = "";
  if(searchInput) searchInput.value = "";

  if(target === "events"){
    state.tab = "agenda";
    state.mood = "";
  } else if(target === "support"){
    state.tab = "support";
    state.mood = "";
  } else if(target === "culture"){
    state.tab = "all";
    state.mood = "culture";
  } else {
    state.tab = "all";
    state.mood = "";
  }

  render();
  document.getElementById("grid")?.scrollIntoView({ behavior:"smooth", block:"start" });
};

document.getElementById("searchInput").addEventListener("input", e => {
  state.query = e.target.value.trim();
  render();
});

// Fermer modal sur Escape
document.addEventListener("keydown", e => {
  if(e.key === "Escape"){
    document.getElementById("pickModal").classList.remove("open");
    document.getElementById("detail").classList.remove("open");
  }
});

// ─── RENDER PRINCIPAL ────────────────────────────────────────────────
function render(){
  renderSavedShortcut();
  renderPulse();
  renderControls();
  renderTonightStrip();
  renderGrid();
}

async function loadJson(path){
  const response = await fetch(path);
  if(!response.ok) throw new Error(`Impossible de charger ${path} (${response.status})`);
  return response.json();
}

async function init(){
  try {
    const [bars, events] = await Promise.all([
      loadJson("data/bars.json"),
      loadJson("data/events.json")
    ]);
    BARS = bars;
    EVENTS = events;
    render();
  } catch(error) {
    console.error(error);
    document.getElementById("grid").innerHTML = '<div class="empty">Impossible de charger les données. Lance le site avec un serveur local.</div>';
  }
}

init();
