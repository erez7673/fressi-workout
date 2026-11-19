// Exercise library, exercise details, Gym Setup and the "What is this machine?" picker.
import { state, profile, allExercises, exById, photoFor, isAvailable, eqOn, touchGym, touchProfile, uid, save } from './store.js';
import { esc, icon, thumb, register, toast, resizeImage, sheet, closeSheet } from './ui.js';
import { MUSCLES, MOTIONS, PATTERN_NAMES, TEMPLATES } from './exercises.js';
import { EQUIPMENT, EQUIP_CATS } from './equipment.js';
import { POSITIONS, GRIPS, FEEL, matchExercises, customExercise, identifyWithAI } from './identify.js';
import { lineChart } from './charts.js';
import { EQUIP_PIC } from './pictures.js';
import { generatePlan, dayFocus, sessionBudget, warmPref } from './planner.js';
import { rerender } from './app.js';
import { scheduleSync } from './sync.js';

const eqThumb = (id) => {
  const pic = EQUIP_PIC[id];
  return pic
    ? `<span class="thumb pic sm"><img src="${pic.url}" alt="${esc(pic.brand + ' ' + pic.name)}" loading="lazy" referrerpolicy="no-referrer" onerror="this.remove()"></span>`
    : `<span class="thumb sm"><span class="ico">${icon.gym}</span></span>`;
};
const eqName = (id) => EQUIPMENT.find(e => e.id === id)?.name || state.gym.machines.find(m => m.id === id)?.name || id;
const eqText = (eq) => eq === 'none' ? 'No equipment' : eq.split('|').map(alt => alt.split('+').map(eqName).join(' + ')).join('  or  ');

// ───────────── Library ─────────────
let filter = { q: '', m: '', availOnly: true };

function libraryList() {
  const q = filter.q.trim().toLowerCase();
  const list = allExercises().filter(e => (!filter.m || e.m === filter.m || e.s.includes(filter.m))
    && (!q || e.name.toLowerCase().includes(q) || MUSCLES[e.m].toLowerCase().includes(q))
    && (!filter.availOnly || isAvailable(e)))
    .sort((a, b) => (filter.m && a.m !== b.m ? (a.m === filter.m ? -1 : 1) : 0) || a.name.localeCompare(b.name));
  if (!list.length) return '<p class="muted center">No exercises match.</p>';
  return list.map(e => `<a class="exrow" href="#/ex/${encodeURIComponent(e.id)}">${thumb(e, photoFor(e.id))}
    <div class="exbody"><b class="exname">${esc(e.name)}</b><small>${esc(MUSCLES[e.m])}${e.s.length ? ' · ' + e.s.map(x => MUSCLES[x]).join(', ') : ''}</small></div>
    ${icon.chev}</a>`).join('');
}

export function libraryView() {
  const muscles = Object.entries(MUSCLES).filter(([k]) => k !== 'forearms');
  return {
    html: `<header class="top"><h1>Exercises</h1></header>
      <label class="search">${icon.search}<input type="search" placeholder="Search exercises" value="${esc(filter.q)}" data-input="lib-q"></label>
      <div class="chipscroll">
        <button class="chip sel ${!filter.m ? 'on' : ''}" data-act="lib-m" data-m="">All</button>
        ${muscles.map(([k, v]) => `<button class="chip sel ${filter.m === k ? 'on' : ''}" data-act="lib-m" data-m="${k}">${v}</button>`).join('')}
      </div>
      <label class="toggle-line"><input type="checkbox" ${filter.availOnly ? 'checked' : ''} data-change="lib-avail"> Only what's available in my gym</label>
      <div class="exlist" id="liblist">${libraryList()}</div>`,
  };
}

register({
  'lib-q': (el) => { filter.q = el.value; document.getElementById('liblist').innerHTML = libraryList(); },
  'lib-m': (el) => { filter.m = el.dataset.m; rerender(); },
  'lib-avail': (el) => { filter.availOnly = el.checked; rerender(); },
});

// ───────────── Exercise details ─────────────
export function exerciseView(id) {
  const ex = exById(id);
  const back = `<header class="bar"><button class="iconbtn" data-act="back">${icon.back}</button><h2></h2><span></span></header>`;
  if (!ex) return { html: back + '<p>Exercise not found.</p>' };
  const p = profile();
  const photo = photoFor(ex.id);
  const liked = (p.stats.likes || []).includes(ex.id);
  const disliked = (p.stats.dislikes || []).includes(ex.id);
  const avoid = ex.avoid.filter(a => (p.stats.injuries || []).includes(a));
  const pts = p.history.flatMap(h => h.items.filter(it => it.exId === ex.id).map(it => ({ x: h.date, y: Math.max(...it.sets.map(s => ex.unit === 'reps' && ex.load ? s.kg || 0 : s.reps || 0)) })));
  const machines = state.gym.machines.filter(m => (m.exerciseIds || []).includes(ex.id));
  return {
    html: `${back}
      <div class="hero">${photo ? `<img src="${photo}" alt="">` : thumb(ex, null, 'xl')}</div>
      <h1 class="title">${esc(ex.name)}</h1>
      <div class="chips">
        <span class="chip on">${esc(MUSCLES[ex.m])}</span>${ex.s.map(x => `<span class="chip">${esc(MUSCLES[x])}</span>`).join('')}
        <span class="chip">${esc(PATTERN_NAMES[ex.pat] || '')}</span>
      </div>
      <p class="muted">${icon.gym} ${esc(eqText(ex.eq))}${isAvailable(ex) ? '' : ' · <b class="warn">not in your gym setup</b>'}</p>
      ${p.plan ? `<button class="btn primary" data-act="add-to-day" data-id="${ex.id}">${icon.plus} Add to workout</button>` : ''}
      ${machines.length ? `<p class="muted">Your machine: ${machines.map(m => esc([m.name, m.brand, m.model].filter(Boolean).join(' · '))).join(', ')}</p>` : ''}
      ${avoid.length ? `<div class="card warncard">⚠️ Marked as risky for your ${avoid.join(', ')} – go light or swap it.</div>` : ''}
      <h3>How to do it</h3>
      <ol class="steps">${ex.steps.map(s => `<li>${esc(s)}</li>`).join('')}</ol>
      ${ex.tip ? `<div class="card tip">💡 ${esc(ex.tip)}</div>` : ''}
      ${ex.assist ? '<div class="card tip">On assisted machines the weight helps you – more kg = easier. The app lowers it as you get stronger.</div>' : ''}
      ${ex.perHand ? '<p class="muted">Weight shown is per dumbbell.</p>' : ''}
      <h3>Your history</h3>
      <div class="card">${lineChart(pts, { unit: ex.load ? ' kg' : '' })}</div>
      <div class="btnrow">
        <button class="btn ${liked ? 'primary' : ''}" data-act="like" data-id="${ex.id}">👍 ${liked ? 'Favourite' : 'I like this'}</button>
        <button class="btn ${disliked ? 'danger' : ''}" data-act="dislike" data-id="${ex.id}">👎 ${disliked ? 'Avoided' : 'Avoid it'}</button>
      </div>
      <p class="muted small">Likes and dislikes are used next time you rebuild your plan.</p>`,
  };
}

// "Add to workout": pick one of the plan's workout days (as many as the profile's days per week).
// Cardio exercises become that day's finisher, or the warm-up machine.
function addToDaySheet(ex) {
  const p = profile();
  const cardio = ex.pat === 'cardio';
  sheet(`<h2>Add to workout</h2>
    <p class="muted small">${esc(ex.name)}${cardio ? ' – as the cardio finisher of:' : ' – added to every week of:'}</p>
    ${p.plan.days.map((day, d) => {
      const has = cardio ? day.cardio?.exId === ex.id : day.items.some(it => it.exId === ex.id);
      return `<button class="row" data-act="add-to-day-pick" data-id="${ex.id}" data-d="${d}" ${has ? 'disabled' : ''}>
        <span><b>${esc(day.name)}</b><small>${esc(dayFocus(day))}</small></span>${has ? '<span class="pill">Already in it</span>' : icon.plus}</button>`;
    }).join('')}
    ${cardio ? `<button class="row" data-act="add-to-warm" data-id="${ex.id}"><span><b>Use as my warm-up</b><small>All workout days</small></span>${icon.plus}</button>` : ''}
    <button class="btn ghost" data-act="sheet-close">Cancel</button>`);
}

register({
  'add-to-day': (el) => addToDaySheet(exById(el.dataset.id)),
  'add-to-day-pick': (el) => {
    const p = profile(); const ex = exById(el.dataset.id); const day = p.plan.days[+el.dataset.d];
    if (ex.pat === 'cardio') {
      day.cardio = { exId: ex.id, min: day.cardio?.min || sessionBudget(p.stats).cardio || 10 };
      toast(`Cardio finisher of ${day.name}`);
    } else {
      day.items.push({ exId: ex.id, pat: ex.pat });
      toast(`Added to ${day.name} (${day.items.length} exercises)`);
    }
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
  'add-to-warm': (el) => {
    const p = profile();
    p.warm = { ...warmPref(p), exId: el.dataset.id };
    if (!p.warm.min) p.warm.min = 5;
    touchProfile(p); scheduleSync(); closeSheet(); toast('Set as your warm-up');
  },
});

function toggleIn(arr, v) { const i = arr.indexOf(v); if (i >= 0) arr.splice(i, 1); else arr.push(v); }
register({
  'like': (el) => { const p = profile(); p.stats.likes ||= []; p.stats.dislikes ||= []; toggleIn(p.stats.likes, el.dataset.id); p.stats.dislikes = p.stats.dislikes.filter(x => x !== el.dataset.id); touchProfile(p); rerender(); },
  'dislike': (el) => { const p = profile(); p.stats.likes ||= []; p.stats.dislikes ||= []; toggleIn(p.stats.dislikes, el.dataset.id); p.stats.likes = p.stats.likes.filter(x => x !== el.dataset.id); touchProfile(p); rerender(); },
});

// ───────────── Gym Setup ─────────────
export function gymView() {
  const total = EQUIPMENT.length + state.gym.machines.length;
  const on = EQUIPMENT.filter(e => eqOn(e.id)).length + state.gym.machines.filter(m => m.on !== false).length;
  const machines = state.gym.machines;
  return {
    html: `<header class="top"><div><h1>Gym Setup</h1><p class="sub">Fressi Jätkäsaari · ${on}/${total} items on</p></div></header>
      <button class="btn primary big" data-act="go" data-href="#/identify">${icon.camera} Add a machine with a photo</button>
      <p class="muted small">Items marked <span class="pill warnpill">confirm</span> weren't visible in the gym photos – tick them on or off next time you're there. The plan only uses items that are on.</p>
      ${machines.length ? `<h3>My machines</h3><div class="exlist">${machines.map(m => {
        const exs = (m.exerciseIds || []).map(exById).filter(Boolean);
        return `<div class="exrow">${m.photo ? `<div class="thumb md"><img src="${m.photo}" alt=""></div>` : thumb(exs[0])}
          <div class="exbody"><b class="exname">${esc(m.name)}</b><small>${esc([m.brand, m.model].filter(Boolean).join(' · '))}</small>
          <div class="chips">${exs.map(e => `<a class="chip on" href="#/ex/${encodeURIComponent(e.id)}">${esc(e.name)}</a>`).join('')}</div></div>
          <button class="iconbtn" data-act="machine-menu" data-id="${m.id}">${icon.dots}</button></div>`;
      }).join('')}</div>` : ''}
      ${EQUIP_CATS.map(cat => `<h3>${esc(cat)}</h3><div class="card list">${EQUIPMENT.filter(e => e.cat === cat).map(e => `
        <label class="eqrow"><span class="eqname">${eqThumb(e.id)}<span>${esc(e.name)}${e.seen ? '' : ' <span class="pill warnpill">confirm</span>'}</span></span>
        <input type="checkbox" class="switch" ${eqOn(e.id) ? 'checked' : ''} data-change="eq-toggle" data-id="${e.id}"></label>`).join('')}</div>`).join('')}
      <div class="card"><p><b>Changed the equipment?</b> Rebuild your plan so it only uses what's on.</p><button class="btn" data-act="rebuild-plan">Rebuild my plan</button></div>`,
  };
}

register({
  'eq-toggle': (el) => { state.gym.enabled[el.dataset.id] = el.checked; touchGym(); scheduleSync(); },
  'rebuild-plan': () => {
    if (!confirm('Rebuild your plan with the current equipment? Your logged history is kept, but plan progress restarts at week 1.')) return;
    const p = profile(); p.plan = generatePlan(p); touchProfile(p); scheduleSync(); toast('Plan rebuilt'); location.hash = '#/plan';
  },
  'machine-menu': (el) => {
    const m = state.gym.machines.find(x => x.id === el.dataset.id);
    sheet(`<h2>${esc(m.name)}</h2>
      ${m.photo ? `<img class="sheet-photo" src="${m.photo}" alt="">` : ''}
      <button class="row" data-act="machine-rename" data-id="${m.id}"><b>Rename</b></button>
      <button class="row" data-act="machine-toggle" data-id="${m.id}"><b>${m.on === false ? 'Mark as available' : 'Mark as not available'}</b></button>
      <button class="row danger" data-act="machine-del" data-id="${m.id}">${icon.trash}<b>Delete machine</b></button>`);
  },
  'machine-rename': (el) => {
    const m = state.gym.machines.find(x => x.id === el.dataset.id);
    const n = prompt('Machine name', m.name);
    if (n) { m.name = n.trim(); const cx = state.gym.customEx.find(e => e.eq === m.id); if (cx) cx.name = m.name; touchGym(); scheduleSync(); }
    closeSheet(); rerender();
  },
  'machine-toggle': (el) => { const m = state.gym.machines.find(x => x.id === el.dataset.id); m.on = m.on === false; touchGym(); scheduleSync(); closeSheet(); rerender(); },
  'machine-del': (el) => {
    if (!confirm('Delete this machine and its photo? Custom exercises made for it are removed too.')) return;
    const id = el.dataset.id;
    state.gym.machines = state.gym.machines.filter(x => x.id !== id);
    state.gym.customEx = state.gym.customEx.filter(e => e.eq !== id);
    touchGym(); scheduleSync(); closeSheet(); rerender();
  },
});

// ───────────── "What is this machine?" picker ─────────────
let wiz = null;
const newWiz = () => ({ step: 0, photo: null, name: '', brand: '', model: '', pos: '', grip: '', mot: '', feel: [] });

const STEPS = ['Photo', 'Position', 'Contact', 'Movement', 'Feel', 'Result'];

export function identifyView() {
  wiz ||= newWiz();
  const st = wiz.step;
  const dots = STEPS.map((s, i) => `<i class="${i <= st ? 'on' : ''}"></i>`).join('');
  const choice = (field, map) => `<div class="choices">${Object.entries(map).map(([k, v]) => `<button class="choice ${wiz[field] === k ? 'on' : ''}" data-act="wiz-pick" data-f="${field}" data-v="${k}">${esc(v)}</button>`).join('')}</div>`;
  let body = '';
  if (st === 0) {
    body = `<h2>Take a photo of the machine</h2>
      <p class="muted">It's saved with the machine so you both recognise it later.</p>
      <label class="photo-drop">${wiz.photo ? `<img src="${wiz.photo}" alt="">` : `${icon.camera}<span>Tap to take a photo</span>`}
        <input type="file" accept="image/*" capture="environment" data-change="wiz-photo" hidden></label>
      <label class="field"><span>Name (if you know it)</span><input value="${esc(wiz.name)}" data-input="wiz-text" data-f="name" placeholder="e.g. Seated row"></label>
      <div class="two">
        <label class="field"><span>Brand</span><select data-change="wiz-text" data-f="brand"><option value="">Unknown</option>${['Gym80', 'Matrix', 'Other'].map(b => `<option ${wiz.brand === b ? 'selected' : ''}>${b}</option>`).join('')}</select></label>
        <label class="field"><span>Model (on the frame plate)</span><input value="${esc(wiz.model)}" data-input="wiz-text" data-f="model" placeholder="optional"></label>
      </div>
      ${state.settings.aiEnabled ? `<button class="btn" data-act="wiz-ai" ${wiz.photo ? '' : 'disabled'}>✨ Identify with AI</button>` : ''}
      <button class="btn primary big" data-act="wiz-next">Next</button>`;
  } else if (st === 1) {
    body = `<h2>How is your body positioned?</h2>${choice('pos', POSITIONS)}`;
  } else if (st === 2) {
    body = `<h2>What do you hold or push against?</h2>${choice('grip', GRIPS)}`;
  } else if (st === 3) {
    body = `<h2>What movement do you make?</h2><p class="muted">Try the machine with no weight if you're not sure.</p>${choice('mot', MOTIONS)}`;
  } else if (st === 4) {
    body = `<h2>Where do you feel it? <small class="muted">(optional, pick any)</small></h2>
      <div class="choices grid">${Object.entries(FEEL).map(([k, v]) => `<button class="choice ${wiz.feel.includes(k) ? 'on' : ''}" data-act="wiz-feel" data-v="${k}">${esc(v)}</button>`).join('')}</div>
      <button class="btn primary big" data-act="wiz-next">Show matches</button>`;
  } else {
    const matches = matchExercises(wiz);
    body = `<h2>Is it one of these?</h2>
      ${wiz.photo ? `<img class="wiz-photo" src="${wiz.photo}" alt="">` : ''}
      ${matches.length ? matches.map(({ ex }) => `<div class="card match">
        <div class="exrow flat">${thumb(ex)}<div class="exbody"><b class="exname">${esc(ex.name)}</b><small>${esc(MUSCLES[ex.m])} · ${esc(eqText(ex.eq))}</small></div></div>
        <ol class="steps small">${ex.steps.slice(0, 3).map(s => `<li>${esc(s)}</li>`).join('')}</ol>
        <button class="btn primary" data-act="wiz-save" data-ex="${ex.id}">Yes, this is it</button></div>`).join('')
      : '<p class="muted">No close match in the library.</p>'}
      <div class="card"><p><b>None of these?</b> Create a custom exercise from your answers – the app writes short instructions for this type of movement.</p>
      <button class="btn" data-act="wiz-custom">Create custom exercise</button></div>`;
  }
  return {
    full: true,
    html: `<header class="bar"><button class="iconbtn" data-act="wiz-back">${icon.back}</button><h2>What is this machine?</h2><button class="iconbtn" data-act="wiz-cancel">${icon.x}</button></header>
      <div class="wizdots">${dots}</div>${body}`,
  };
}

function saveMachine(exerciseIds, extra = {}) {
  const m = { id: uid('m'), name: wiz.name.trim() || extra.name || 'My machine', brand: wiz.brand, model: wiz.model.trim(), photo: wiz.photo, exerciseIds, on: true, createdAt: Date.now(), answers: { pos: wiz.pos, grip: wiz.grip, mot: wiz.mot, feel: wiz.feel } };
  state.gym.machines.push(m);
  return m;
}

register({
  'wiz-back': () => { if (!wiz || wiz.step === 0) { wiz = null; history.back(); return; } wiz.step--; rerender(); },
  'wiz-cancel': () => { wiz = null; location.hash = '#/gym'; },
  'wiz-next': () => {
    if (wiz.step === 3 && !wiz.mot) return toast('Pick a movement');
    wiz.step = Math.min(5, wiz.step + 1); rerender();
  },
  'wiz-pick': (el) => { wiz[el.dataset.f] = el.dataset.v; wiz.step++; rerender(); },
  'wiz-feel': (el) => { toggleIn(wiz.feel, el.dataset.v); rerender(); },
  'wiz-text': (el) => { wiz[el.dataset.f] = el.value; },
  'wiz-photo': async (el) => {
    const f = el.files?.[0];
    if (!f) return;
    try { wiz.photo = await resizeImage(f); rerender(); } catch (e) { toast('Could not read that photo'); }
  },
  'wiz-ai': async () => {
    toast('Asking AI…');
    try {
      const r = await identifyWithAI(wiz.photo);
      if (!r) return toast('AI is not set up');
      Object.assign(wiz, { name: wiz.name || r.name || '', pos: r.pos || '', grip: r.grip || '', mot: r.mot || '', feel: r.feel || [] });
      wiz.step = r.mot ? 5 : 1; rerender();
    } catch (e) { toast('AI failed: ' + e.message); }
  },
  'wiz-save': (el) => {
    const ex = exById(el.dataset.ex);
    // Turn on the equipment this exercise needs (first option).
    for (const id of ex.eq.split('|')[0].split('+')) if (id !== 'none') state.gym.enabled[id] = true;
    saveMachine([ex.id], { name: ex.name });
    touchGym(); scheduleSync();
    wiz = null;
    toast('Machine saved');
    location.hash = `#/ex/${encodeURIComponent(ex.id)}`;
  },
  'wiz-custom': () => {
    if (!wiz.mot) return toast('Pick a movement first');
    const m = saveMachine([], { name: `${PATTERN_NAMES[TEMPLATES[wiz.mot]?.pat] || 'Custom'} machine` });
    const cx = customExercise(m, wiz);
    m.exerciseIds = [cx.id];
    state.gym.customEx.push(cx);
    touchGym(); scheduleSync();
    wiz = null;
    toast('Custom exercise created');
    location.hash = `#/ex/${encodeURIComponent(cx.id)}`;
  },
});
