// My Plan, day preview, active workout and summary screens.
import { state, profile, exById, photoFor, isAvailable, touchProfile, save, lastLogFor } from './store.js';
import { esc, icon, thumb, register, sheet, closeSheet, toast, fmtClock, fmtKg, fmtDate, fmtDur, setLabel, themeButton } from './ui.js';
import { currentWeek, planProgress, dayFocus, phaseOf, buildSession, estimateMinutes, estimateCalories, swapOptions, generatePlan, sortDay, itemArea, editKey, AREAS, setDayAreas, exPerDay, dayCap, warmOptions, warmPref, sessionBudget, TEMPLATES, TPL_PHASES, generateTemplatePlan, templateExNames } from './planner.js';
import { MUSCLES, PATTERN_NAMES } from './exercises.js';
import * as W from './workout.js';
import { rerender } from './app.js';
import { scheduleSync } from './sync.js';

let viewWeek = null;

// Close button for the top-right corner of a bottom sheet.
const closeX = `<button class="iconbtn sheet-x" data-act="sheet-close" aria-label="Close">${icon.x}</button>`;

const avatar = (p) => `<div class="hdr-btns">${themeButton()}<button class="avatar" style="--c:${p.color}" data-act="switch-profile" aria-label="Switch profile">${esc(p.name[0] || '?')}</button></div>`;

// ───────────── My Plan ─────────────
export function planView() {
  const p = profile();
  if (!p.plan) {
    return { html: `<header class="top"><h1>Hi ${esc(p.name)}</h1>${avatar(p)}</header>
      <div class="card center"><p>You don't have a plan yet.</p><button class="btn primary" data-act="make-plan">Build my plan</button>
      <button class="btn" data-act="tpl-open">Or choose a ready-made plan</button></div>` };
  }
  const plan = p.plan;
  const cw = currentWeek(plan);
  const w = Math.min(plan.weeks, viewWeek || cw);
  const pct = planProgress(plan);
  const nextIdx = plan.days.findIndex((_, d) => !plan.done[`${w}-${d}`]);
  const doneThisWeek = plan.days.filter((_, d) => plan.done[`${w}-${d}`]).length;

  const segs = Array.from({ length: plan.weeks }, (_, i) => {
    const wk = i + 1;
    const n = plan.days.filter((_, d) => plan.done[`${wk}-${d}`]).length;
    const fill = n / plan.days.length * 100;
    return `<button class="seg ${wk === w ? 'cur' : ''}" data-act="pick-week" data-w="${wk}" aria-label="Week ${wk}"><i style="width:${fill}%"></i></button>`;
  }).join('');

  const cards = plan.days.map((day, d) => {
    const done = plan.done[`${w}-${d}`];
    const next = d === nextIdx;
    const warn = day.items.some(it => { const ex = exById(it.exId); return !ex || !isAvailable(ex); });
    return `<a class="daycard ${done ? 'done' : ''} ${next ? 'next' : ''}" href="#/day/${w}/${d}">
      <span class="tick">${done ? icon.check : ''}</span>
      <span class="dc-body"><b>${esc(day.name)}</b><small>${esc(dayFocus(day))}</small>${warn ? '<em class="warn">Some equipment is off – tap to swap</em>' : ''}</span>
      ${next ? '<span class="nextpill">Next</span>' : ''}
    </a>`;
  }).join('');

  return {
    html: `<header class="top">
        <div><h1>Week ${w} <span class="dim">of ${plan.weeks}</span></h1>
        <button class="sub linklike" data-act="plan-info">${esc(plan.name)} ${icon.chev}</button></div>
        ${avatar(p)}
      </header>
      <div class="weekbar">${segs}</div>
      <p class="phase">${esc(phaseOf(w).name)} · ${doneThisWeek}/${plan.days.length} done${w !== cw ? ` · <button class="linklike" data-act="pick-week" data-w="${cw}">back to current week</button>` : ''}</p>
      <div class="days">${cards}</div>
      <div class="statrow">
        <div class="stat"><b>${pct}%</b><small>Plan complete</small></div>
        <div class="stat"><b>${p.history.length}</b><small>Workouts logged</small></div>
        <div class="stat"><b>${p.stats.minutes}′</b><small>Per session</small></div>
      </div>`,
  };
}

register({
  'pick-week': (el) => { viewWeek = +el.dataset.w; rerender(); },
  'make-plan': () => { const p = profile(); p.plan = generatePlan(p); touchProfile(p); scheduleSync(); rerender(); toast('Plan ready!'); },
  'plan-info': () => {
    const p = profile(); const plan = p.plan;
    sheet(`<h2>${esc(plan.name)}</h2>
      <p class="muted">${plan.weeks} weeks · ${plan.days.length} days per week · ${p.stats.minutes} min sessions</p>
      ${plan.template ? `<ul class="plain"><li><b>Every day:</b> ${dayCap(p)} exercises, plus warm-up${plan.days[0]?.cardio ? ', a short walk' : ''} and cooldown. Tap any day to swap, add or remove exercises and to change sets, reps and kg.</li>
        ${TPL_PHASES.map(([a, b]) => `<li><b>${a}:</b> ${b}</li>`).join('')}</ul>`
      : `<ul class="plain">
        <li><b>Every day:</b> ${exPerDay(p.stats)} exercise${exPerDay(p.stats) > 1 ? 's' : ''} × 4 sets, plus warm-up${p.stats.cardio ? ', cardio finisher' : ''} and cooldown. Open a day to choose its muscle areas or change the warm-up.</li>
        <li><b>Weeks 1–4:</b> learn the movements, find your working weights.</li>
        <li><b>Weeks 5–8:</b> more reps per set.</li>
        <li><b>Weeks 9–11:</b> ${['strength', 'hypertrophy'].includes(p.stats.goal) ? 'heavier with fewer reps' : 'keep building reps and weight'}.</li>
        <li><b>Week 12:</b> deload – lighter so your body recovers.</li>
      </ul>`}
      <p class="muted">The app raises the weight automatically when you hit the top of the rep range on every set. Tap the sets on a day to change reps or kg.</p>
      <button class="btn" data-act="tpl-open">Ready-made plans</button>
      <button class="btn" data-act="go" data-href="#/profile">Plan settings</button>`);
  },
  'tpl-open': () => {
    const cur = profile().plan?.template;
    sheet(`<h2>Ready-made plans</h2>
      <p class="muted small">Fixed full-body plans for women starting out around 50+. They follow research on strength training for this age: whole body, machines first, 4–6 exercises a day, 2–3 sets of 10–15 reps, light start. You can still swap, add or remove exercises and change sets, reps and kg on every day.</p>
      ${Object.entries(TEMPLATES).map(([k, t]) => `<div class="card">
        <b>${esc(t.name)}</b>${cur === k ? ' <span class="pill">Current</span>' : ''}
        <p class="muted small">${esc(t.blurb)}</p>
        <ul class="plain">${t.days.map((_, di) => `<li><b>Day ${'ABC'[di]}:</b> ${esc(templateExNames(k, di).join(', '))}</li>`).join('')}</ul>
        <button class="btn primary" data-act="tpl-use" data-k="${k}">${cur === k ? 'Restart this plan' : 'Use this plan'}</button></div>`).join('')}
      <button class="btn ghost" data-act="sheet-close">Cancel</button>`);
  },
  'tpl-use': (el) => {
    const p = profile();
    if (p.plan && Object.keys(p.plan.done).length && !confirm('A new plan restarts at week 1 (your history is kept). Continue?')) return;
    p.plan = generateTemplatePlan(p, el.dataset.k);
    viewWeek = null;
    touchProfile(p); scheduleSync(); closeSheet(); location.hash = '#/plan'; rerender(); toast('Plan ready!');
  },
  'switch-profile': () => {
    const list = Object.values(state.profiles);
    sheet(`<h2>Who's training?</h2>
      ${list.map(p => `<button class="row" data-act="use-profile" data-id="${p.id}"><span class="avatar sm" style="--c:${p.color}">${esc(p.name[0])}</span><b>${esc(p.name)}</b>${p.id === state.activeProfile ? '<span class="pill">Active</span>' : ''}</button>`).join('')}
      <button class="btn" data-act="go" data-href="#/onboard">${icon.plus} Add a profile</button>`);
  },
  'use-profile': (el) => { state.activeProfile = el.dataset.id; viewWeek = null; save(); closeSheet(); rerender(); },
});

// ───────────── Day preview ─────────────
let preview = null;

export function dayView(w, d) {
  const p = profile();
  const plan = p.plan;
  if (!plan || !plan.days[d]) return { html: '<p>Not found</p>' };
  preview = buildSession(p, w, d);
  const day = plan.days[d];
  const mins = estimateMinutes(preview);
  const done = plan.done[`${w}-${d}`];
  const rec = done && p.history.find(h => h.id === done);

  // Grouped under a header per muscle area (the plan keeps bigger muscles first).
  let lastArea = null;
  const items = preview.items.map((it, i) => {
    const ex = exById(it.exId);
    const avail = isAvailable(ex);
    const area = itemArea(day, day.items.find(x => x.exId === it.exId) || { exId: it.exId });
    const header = area !== lastArea ? `<h4 class="exgroup">${esc(AREAS[area]?.name || '')}</h4>` : '';
    lastArea = area;
    return `${header}<div class="exrow">
      <a href="#/ex/${encodeURIComponent(ex.id)}">${thumb(ex, photoFor(ex.id))}</a>
      <div class="exbody">
        <a href="#/ex/${encodeURIComponent(ex.id)}" class="exname">${esc(ex.name)}</a>
        <button class="chips editable" data-act="edit-sets" data-w="${w}" data-d="${d}" data-i="${i}" aria-label="Edit reps and weight">${it.sets.map(s => `<span class="chip">${setLabel(s, it.unit)}</span>`).join('')}<span class="chip edit">${icon.edit} Edit</span></button>
        ${!avail ? '<em class="warn">Equipment marked as not available – swap it</em>' : it.note ? `<small class="note">${esc(it.note)}</small>` : ''}
      </div>
      <button class="iconbtn" data-act="ex-menu" data-d="${d}" data-i="${i}" aria-label="Options">${icon.dots}</button>
    </div>
    <div class="rest">Rest: ${it.rest} s</div>`;
  }).join('');

  return {
    cls: 'with-cta',
    html: `<header class="bar"><button class="iconbtn" data-act="back">${icon.back}</button><h2>${esc(day.name)}</h2><span></span></header>
      <button class="chips editable lead-chips" data-act="areas-open" data-d="${d}" aria-label="Choose muscle areas">${(day.muscles?.length ? day.muscles.map(a => AREAS[a]?.name) : [dayFocus(day)]).filter(Boolean).map(n => `<span class="chip on">${esc(n)}</span>`).join('')}<span class="chip edit">${icon.edit} Muscle areas</span></button>
      <div class="statrow">
        <div class="stat">${icon.clock}<b>${mins} min</b><small>Workout time</small></div>
        <div class="stat">${icon.fire}<b>${estimateCalories(p.stats, mins)}</b><small>Calories (est.)</small></div>
      </div>
      <p class="phase">Week ${w} · ${esc(phaseOf(w).name)}</p>
      ${rec ? `<a class="card donecard" href="#/summary/${rec.id}">${icon.check} Done on ${fmtDate(rec.date)} – view log</a>` : ''}
      <h3>Warm-up</h3>
      ${preview.warm ? `<div class="exrow"><a href="#/ex/${encodeURIComponent(preview.warm.exId)}">${thumb(exById(preview.warm.exId))}</a>
          <div class="exbody"><b class="exname">${esc(preview.warm.name)}</b>
          <button class="chips editable" data-act="warm-open" aria-label="Change warm-up"><span class="chip">${preview.warm.min} min</span><span class="chip edit">${icon.edit} Change</span></button></div></div>
        ${preview.warmup.length ? `<button class="row mobility-btn" data-act="mobility-open" data-w="${w}" data-d="${d}">${icon.info}<span><b>Then a quick mobility routine</b><small>${preview.warmup.length} moves · ${Math.round(preview.warmup.reduce((a, m) => a + m.sec, 0) / 60)} min</small></span><span class="chev">›</span></button>` : ''}`
      : `<button class="btn" data-act="warm-open">${icon.plus} Add a warm-up</button>`}
      <h3>Exercise List</h3>
      <div class="exlist">${items}</div>
      <h3>Cardio finisher</h3>
      ${preview.cardio ? `<div class="exrow"><a href="#/ex/${encodeURIComponent(preview.cardio.exId)}">${thumb(exById(preview.cardio.exId))}</a>
          <div class="exbody"><b class="exname">${esc(preview.cardio.name)}</b>
          <button class="chips editable" data-act="cardio-open" data-d="${d}" aria-label="Change cardio finisher"><span class="chip">${preview.cardio.min} min</span><span class="chip edit">${icon.edit} Change</span></button></div></div>`
      : `<button class="btn" data-act="cardio-open" data-d="${d}">${icon.plus} Add a cardio finisher</button>`}
      <h3>Cooldown stretches</h3>
      <ul class="moves">${preview.cooldown.map(m => `<li>${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul>
      <div class="cta"><button class="btn primary big" data-act="start-day" data-w="${w}" data-d="${d}">${state.session?.startedAt ? 'Start (replaces current workout)' : done ? 'Do it again' : 'Start'}</button></div>`,
  };
}

// Bottom sheet to change the reps / kg of each set before the workout.
function openSetEditor(w, d, i) {
  const p = profile();
  const it = buildSession(p, w, d).items[i];
  if (!it) return;
  const ex = exById(it.exId);
  const edited = !!p.plan.edits?.[editKey(w, d, it.exId)];
  const attrs = (k, f) => `data-change="pv-set" data-w="${w}" data-d="${d}" data-ex="${it.exId}" data-k="${k}" data-f="${f}"`;
  sheet(`<h2>${esc(it.name)}</h2>
    <p class="muted small">Week ${w} · target ${it.target.reps[0]}–${it.target.reps[1]} ${it.unit === 'sec' ? 's' : 'reps'}. Changing a set also changes the sets after it.</p>
    <table class="sets"><thead><tr><th>Set</th><th>${it.unit === 'sec' ? 'Sec' : 'Reps'}</th><th>${it.assist ? 'Assist kg' : 'Kg'}</th></tr></thead><tbody>
    ${it.sets.map((s, k) => `<tr><td><span class="setno">${k + 1}</span></td>
      <td><input type="number" inputmode="numeric" min="0" value="${s.reps}" ${attrs(k, 'reps')}></td>
      <td>${ex.load || s.kg ? `<input type="number" inputmode="decimal" min="0" step="0.5" value="${fmtKg(s.kg)}" ${attrs(k, 'kg')}>` : '<span class="muted">body weight</span>'}</td></tr>`).join('')}
    </tbody></table>
    ${edited ? `<button class="btn ghost" data-act="pv-reset" data-w="${w}" data-d="${d}" data-i="${i}" data-ex="${it.exId}">Back to the app's suggestion</button>` : ''}
    <button class="btn primary" data-act="sheet-close">Done</button>`);
}

// Bottom sheet to pick the muscle areas of a workout day; saving picks new exercises for those areas.
let areaSel = null;
function openAreas(d) {
  const day = profile().plan.days[d];
  areaSel ||= [...(day.muscles || [])];
  sheet(`<h2>${esc(day.name)}: muscle areas</h2>
    <p class="muted small">Pick one or more. The app chooses ${dayCap(profile())} exercise(s) for them (set the number under Profile → Build your custom plan) from the equipment in your gym. You can still swap or remove single exercises afterwards.</p>
    <div class="choices grid">${Object.entries(AREAS).map(([k, a]) => `<button class="choice ${areaSel.includes(k) ? 'on' : ''}" data-act="areas-toggle" data-d="${d}" data-k="${k}">${esc(a.name)}</button>`).join('')}</div>
    <button class="btn primary" data-act="areas-save" data-d="${d}" ${areaSel.length ? '' : 'disabled'}>Pick exercises for these areas</button>
    ${day.muscles?.length ? `<button class="btn ghost" data-act="areas-clear" data-d="${d}">Let the app choose the areas</button>` : ''}`);
}

// Bottom sheet to pick the warm-up machine and how long it runs.
function openWarm() {
  const p = profile();
  const wp = warmPref(p);
  const opts = warmOptions();
  sheet(`<h2>Warm-up</h2>
    <p class="muted small">Used for all your workout days. In the workout, tap Start and the app beeps when the time is up.</p>
    <label class="field"><span>Minutes</span>
      <div class="stepper"><button class="pillbtn dark" data-act="warm-min" data-v="-1" aria-label="One minute less">−</button>
      <input type="number" inputmode="numeric" min="0" max="60" value="${wp.min}" data-change="warm-min-set">
      <button class="pillbtn dark" data-act="warm-min" data-v="1" aria-label="One minute more">+</button></div></label>
    <h3>Machine</h3>
    ${opts.length ? opts.map(e => `<button class="row ${e.id === wp.exId ? 'sel' : ''}" data-act="warm-pick" data-ex="${e.id}">${thumb(e, photoFor(e.id), 'sm')}<span><b>${esc(e.name)}</b></span>${e.id === wp.exId ? '<span class="pill">Selected</span>' : ''}</button>`).join('')
      : '<p class="muted">No cardio machines are on in Gym Setup.</p>'}
    <button class="btn primary" data-act="sheet-close">Done</button>`);
}

// Bottom sheet to pick the cardio finisher machine and minutes for one workout day (all weeks).
function openCardio(d) {
  const p = profile();
  const c = p.plan.days[d]?.cardio;
  const opts = warmOptions();
  const min = c?.min ?? 0;
  sheet(`${closeX}<h2>Cardio finisher</h2>
    <p class="muted small">Used on ${esc(p.plan.days[d].name)} in every week. Set the minutes to 0 to leave it out.</p>
    <label class="field"><span>Minutes</span>
      <div class="stepper"><button class="pillbtn dark" data-act="cardio-min" data-d="${d}" data-v="-1" aria-label="One minute less">−</button>
      <input type="number" inputmode="numeric" min="0" max="60" value="${min}" data-change="cardio-min-set" data-d="${d}">
      <button class="pillbtn dark" data-act="cardio-min" data-d="${d}" data-v="1" aria-label="One minute more">+</button></div></label>
    <h3>Machine</h3>
    ${opts.length ? opts.map(e => `<button class="row ${e.id === c?.exId ? 'sel' : ''}" data-act="cardio-pick" data-d="${d}" data-ex="${e.id}">${thumb(e, photoFor(e.id), 'sm')}<span><b>${esc(e.name)}</b></span>${e.id === c?.exId ? '<span class="pill">Selected</span>' : ''}</button>`).join('')
      : '<p class="muted">No cardio machines are on in Gym Setup.</p>'}
    <button class="btn primary" data-act="sheet-close">Done</button>`);
}

function saveCardio(d, patch) {
  const p = profile();
  const day = p.plan.days[d];
  const opts = warmOptions();
  const cur = day.cardio || {};
  // A new finisher starts on the usual length for the profile's goal, on the first machine that's on.
  const next = { exId: cur.exId || opts[0]?.id, min: cur.exId ? cur.min : (sessionBudget(p.stats).cardio || 10), ...patch };
  if (!next.exId) return;
  next.min = Math.max(0, Math.min(60, Math.round(next.min || 0)));
  day.cardio = next;
  // Also update a workout of this day that's open but whose finisher hasn't started yet.
  const s = state.session;
  if (s?.startedAt && s.profileId === p.id && s.planId === p.plan.id && s.dayIdx === d && !(s.cardio?.endAt || s.cardio?.done)) {
    const ex = exById(next.exId);
    s.cardio = next.min > 0 && ex ? { exId: ex.id, name: ex.name, min: next.min, done: false } : null;
    save();
  }
  touchProfile(p); scheduleSync(); rerender(); openCardio(d);
}

// Pop-up with the mobility moves that follow the warm-up machine.
function openMobility(w, d) {
  const moves = buildSession(profile(), w, d).warmup;
  sheet(`${closeX}<h2>Quick mobility routine</h2>
    <p class="muted small">Do these right after the warm-up machine.</p>
    <ul class="moves">${moves.map(m => `<li>${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul>
    <button class="btn primary" data-act="sheet-close">Done</button>`);
}

function saveWarm(patch) {
  const p = profile();
  p.warm = { ...warmPref(p), ...patch };
  p.warm.min = Math.max(0, Math.min(60, Math.round(p.warm.min || 0)));
  // Also update a workout that's open but whose warm-up hasn't started yet.
  const s = state.session;
  if (s?.startedAt && s.profileId === p.id && !(s.warm?.endAt || s.warm?.done)) {
    const ex = exById(p.warm.exId);
    s.warm = p.warm.min > 0 && ex ? { exId: ex.id, name: ex.name, min: p.warm.min, done: false } : null;
    save();
  }
  touchProfile(p); scheduleSync(); rerender(); openWarm();
}

register({
  'areas-open': (el) => { areaSel = null; openAreas(+el.dataset.d); },
  'areas-toggle': (el) => {
    const k = el.dataset.k; const i = areaSel.indexOf(k);
    if (i >= 0) areaSel.splice(i, 1); else areaSel.push(k);
    openAreas(+el.dataset.d);
  },
  'areas-save': (el) => {
    const p = profile(); const d = +el.dataset.d;
    setDayAreas(p, d, areaSel);
    areaSel = null;
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
    toast('New exercises picked for all weeks');
  },
  'areas-clear': (el) => {
    const p = profile(); setDayAreas(p, +el.dataset.d, []);
    areaSel = null; touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
  'warm-open': () => openWarm(),
  'warm-pick': (el) => saveWarm({ exId: el.dataset.ex }),
  'warm-min': (el) => saveWarm({ min: warmPref(profile()).min + +el.dataset.v }),
  'warm-min-set': (el) => saveWarm({ min: +el.value || 0 }),
  'cardio-open': (el) => openCardio(+el.dataset.d),
  'cardio-pick': (el) => saveCardio(+el.dataset.d, { exId: el.dataset.ex }),
  'cardio-min': (el) => { const d = +el.dataset.d; saveCardio(d, { min: (profile().plan.days[d].cardio?.min || 0) + +el.dataset.v }); },
  'cardio-min-set': (el) => saveCardio(+el.dataset.d, { min: +el.value || 0 }),
  'mobility-open': (el) => openMobility(+el.dataset.w, +el.dataset.d),
  'start-day': (el) => {
    if (state.session?.startedAt && !confirm('A workout is already in progress. Discard it and start this one?')) return;
    const p = profile();
    const s = buildSession(p, +el.dataset.w, +el.dataset.d);
    W.start(s);
    location.hash = '#/session';
  },
  'ex-menu': (el) => {
    const d = +el.dataset.d, i = +el.dataset.i;
    const p = profile();
    const it = p.plan.days[d].items[i];
    const ex = exById(it.exId);
    const opts = swapOptions(p.stats, p.plan, d, i);
    const area = AREAS[itemArea(p.plan.days[d], it)]?.name || '';
    sheet(`${closeX}<h2>${esc(ex.name)}</h2>
      <button class="row" data-act="go" data-href="#/ex/${encodeURIComponent(ex.id)}">${icon.info}<b>How to do it</b></button>
      <h3>Swap for another ${esc(area)} exercise <small class="muted">(${opts.length})</small></h3>
      ${opts.length ? opts.map(o => `<button class="row" data-act="swap" data-d="${d}" data-i="${i}" data-ex="${o.id}">${thumb(o, photoFor(o.id), 'sm')}<span><b>${esc(o.name)}</b><small>${esc(MUSCLES[o.m])}</small></span></button>`).join('') : '<p class="muted">No alternatives with your current gym setup.</p>'}
      <button class="row danger" data-act="remove-ex" data-d="${d}" data-i="${i}">${icon.trash}<b>Remove from this day</b></button>`);
  },
  'edit-sets': (el) => openSetEditor(+el.dataset.w, +el.dataset.d, +el.dataset.i),
  'pv-set': (el) => {
    const w = +el.dataset.w, d = +el.dataset.d, exId = el.dataset.ex, k = +el.dataset.k, f = el.dataset.f;
    const p = profile();
    const it = buildSession(p, w, d).items.find(x => x.exId === exId);
    if (!it) return;
    const sets = it.sets.map(s => ({ reps: s.reps, kg: s.kg }));
    const v = Math.max(0, +el.value || 0);
    // Carry the change to the following sets, like in the workout screen.
    for (let j = k; j < sets.length; j++) {
      sets[j][f] = v;
      const inp = document.querySelector(`#sheet input[data-k="${j}"][data-f="${f}"]`);
      if (inp && j > k) inp.value = f === 'kg' ? fmtKg(v) : v;
    }
    p.plan.edits ||= {};
    p.plan.edits[editKey(w, d, exId)] = sets;
    // Before the first log, a typed weight also becomes the starting weight for later weeks.
    if (f === 'kg' && !lastLogFor(p, exId)) { p.startKg ||= {}; p.startKg[exId] = v; }
    touchProfile(p); scheduleSync(); rerender();
  },
  'pv-reset': (el) => {
    const p = profile(); const { w, d, ex, i } = el.dataset;
    delete p.plan.edits?.[editKey(+w, +d, ex)];
    if (p.startKg) delete p.startKg[ex];
    touchProfile(p); scheduleSync(); rerender(); openSetEditor(+w, +d, +i);
  },
  'swap': (el) => {
    const p = profile();
    const day = p.plan.days[+el.dataset.d];
    const ex = exById(el.dataset.ex);
    day.items[+el.dataset.i] = { exId: ex.id, pat: ex.pat };
    sortDay(day);
    touchProfile(p); scheduleSync(); closeSheet(); rerender(); toast('Exercise swapped for all weeks');
  },
  'remove-ex': (el) => {
    const p = profile();
    p.plan.days[+el.dataset.d].items.splice(+el.dataset.i, 1);
    touchProfile(p); scheduleSync(); closeSheet(); rerender();
  },
});

// ───────────── Active workout ─────────────
let openItem = null;

export function sessionView() {
  const s = state.session;
  if (!s?.startedAt) return { html: `<header class="bar"><button class="iconbtn" data-act="back">${icon.back}</button><h2>Workout</h2><span></span></header><div class="card center"><p>No workout in progress.</p><a class="btn primary" href="#/plan">Go to my plan</a></div>` };
  const cur = s.items[s.cur.i];
  const set = cur?.sets[s.cur.s];
  const ex = exById(cur?.exId);
  if (openItem === null || openItem >= s.items.length) openItem = s.cur.i;
  const allDone = s.items.every(it => it.sets.every(x => x.done));
  const resting = s.phase === 'rest';

  let head;
  const wc = s.warm;
  if (wc?.endAt && !wc.done) {
    head = `<div class="hd">
      <small>WARM-UP · ${esc(wc.name)} · ${wc.min} min</small>
      <div class="bigtime" data-t="warm">${fmtClock(Math.ceil((wc.endAt - Date.now()) / 1000))}</div>
      <p>The phone beeps when the time is up.</p>
      <div class="hd-btns"><button class="pillbtn light" data-act="timer-stop" data-k="warm">Finish warm-up now</button></div></div>`;
  } else if (resting) {
    head = `<div class="hd rest-hd">
      <small>REST · next: ${esc(cur.name)} · set ${s.cur.s + 1}/${cur.sets.length}</small>
      <div class="bigtime" data-t="rest">${fmtClock(Math.ceil(W.restLeft()))}</div>
      <div class="restbar"><i data-t="restbar"></i></div>
      <div class="hd-btns">
        <button class="pillbtn" data-act="rest-add" data-v="-15">−15 s</button>
        <button class="pillbtn" data-act="rest-add" data-v="15">+15 s</button>
        <button class="pillbtn light" data-act="rest-skip">Skip rest</button>
      </div></div>`;
  } else if (allDone || s.phase === 'ready') {
    head = `<div class="hd"><div class="bigline">All sets done 🎉</div><p>Finish with ${s.cardio && !s.cardio.done ? 'cardio and ' : ''}the cooldown, then tap Finish.</p>
      <div class="hd-btns"><button class="pillbtn light" data-act="finish">Finish workout</button></div></div>`;
  } else {
    const timed = cur.unit === 'sec';
    head = `<div class="hd">
      <div class="hd-row">
        <div class="bigline">${timed ? `${set.reps}<span class="x">s</span>` : `${set.reps}<span class="x">×</span>`}${set.kg || !timed ? `<span class="kgbox">${fmtKg(set.kg)} kg</span>` : ''}</div>
        <div class="roundbtns">
          <button class="round" data-act="pause" aria-label="Pause">${s.paused ? icon.play : icon.pause}</button>
          <button class="round" data-act="log-cur" aria-label="Log set">${icon.check}</button>
        </div>
      </div>
      <div class="hd-name"><b>${esc(cur.name)}</b><button class="iconbtn inv" data-act="go" data-href="#/ex/${encodeURIComponent(cur.exId)}">${icon.info}</button></div>
      <small>Set ${s.cur.s + 1} of ${cur.sets.length} · ${timed ? 'hold' : 'set'} timer <b data-t="work">${fmtClock(W.workElapsed())}</b>${s.paused ? ' · PAUSED' : ''}</small>
    </div>`;
  }

  const items = s.items.map((it, i) => {
    const e = exById(it.exId);
    const doneN = it.sets.filter(x => x.done).length;
    if (i !== openItem) {
      return `<div class="exrow ${doneN === it.sets.length ? 'complete' : ''}" data-act="open-item" data-i="${i}">
        ${thumb(e, photoFor(it.exId))}
        <div class="exbody"><b class="exname">${esc(it.name)}</b>
        <div class="chips">${it.sets.map(x => `<span class="chip ${x.done ? 'on' : ''}">${setLabel(x, it.unit)}</span>`).join('')}</div></div>
        <span class="count">${doneN}/${it.sets.length}</span>
      </div><div class="rest">Rest: ${fmtClock(it.rest)}</div>`;
    }
    const unitLbl = it.unit === 'sec' ? 'Sec' : 'Reps';
    return `<div class="exopen">
      <div class="exrow flat">${thumb(e, photoFor(it.exId))}<div class="exbody"><a class="exname blue" href="#/ex/${encodeURIComponent(it.exId)}">${esc(it.name)}</a>${it.note ? `<small class="note">${esc(it.note)}</small>` : ''}</div>
        <button class="iconbtn" data-act="sess-menu" data-i="${i}">${icon.dots}</button></div>
      <table class="sets"><thead><tr><th>Set</th><th>${unitLbl}</th><th>${it.assist ? 'Assist kg' : 'Kg'}</th><th>Log</th></tr></thead><tbody>
      ${it.sets.map((x, si) => {
        const isCur = s.cur.i === i && s.cur.s === si && !x.done;
        return `<tr class="${x.done ? 'done' : ''} ${isCur ? 'cur' : ''}">
          <td><button class="setno" data-act="jump" data-i="${i}" data-s="${si}">${si + 1}</button></td>
          <td><input type="number" inputmode="numeric" min="0" value="${x.reps}" data-change="set-val" data-i="${i}" data-s="${si}" data-f="reps"></td>
          <td><input type="number" inputmode="decimal" min="0" step="0.5" value="${fmtKg(x.kg)}" data-change="set-val" data-i="${i}" data-s="${si}" data-f="kg"></td>
          <td><button class="logbtn ${x.done ? 'on' : ''}" data-act="log-row" data-i="${i}" data-s="${si}" aria-label="Log set ${si + 1}">${icon.check}</button></td>
        </tr>`;
      }).join('')}
      </tbody></table>
      <button class="linklike small" data-act="add-set" data-i="${i}">${icon.plus} Add set</button>
    </div><div class="rest">Rest: ${fmtClock(it.rest)}</div>`;
  }).join('');

  const fresh = s.items.every(it => it.sets.every(x => !x.done));
  // Timed cardio card, used for the warm-up machine (k = 'warm') and the finisher (k = 'cardio').
  const timerCard = (k, label) => {
    const c = s[k];
    if (!c) return '';
    const running = c.endAt && !c.done;
    return `<div class="card cardio-card">
      <a href="#/ex/${encodeURIComponent(c.exId)}">${thumb(exById(c.exId), photoFor(c.exId), 'sm')}</a>
      <div><b>${esc(c.name)}</b><small>${label} · ${c.min} min${c.done ? ' · done ✓' : ''}</small></div>
      ${running ? `<b class="bigtime sm" data-t="${k}">${fmtClock(Math.ceil((c.endAt - Date.now()) / 1000))}</b><button class="pillbtn" data-act="timer-stop" data-k="${k}">Stop</button>`
        : `${k === 'warm' ? `<button class="iconbtn" data-act="warm-open" aria-label="Change warm-up">${icon.edit}</button>` : !c.done && s.planId === profile().plan.id ? `<button class="iconbtn" data-act="cardio-open" data-d="${s.dayIdx}" aria-label="Change cardio finisher">${icon.edit}</button>` : ''}<button class="pillbtn dark" data-act="timer-start" data-k="${k}">${c.done ? 'Again' : 'Start'}</button>`}
    </div>`;
  };
  const warm = `${timerCard('warm', 'Warm-up')}
    ${s.warmup.length ? `<details class="card moves-card" ${fresh ? 'open' : ''}><summary><b>Then: quick mobility</b> · ${Math.round(s.warmup.reduce((a, m) => a + m.sec, 0) / 60)} min</summary>
    <ul class="moves">${s.warmup.map((m, k) => `<li class="${m.done ? 'struck' : ''}" data-act="tick-move" data-list="warmup" data-k="${k}">${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul></details>` : ''}`;

  const cardio = timerCard('cardio', 'Finisher');

  const cool = `<details class="card moves-card" ${allDone ? 'open' : ''}><summary><b>Cooldown</b> · stretches</summary>
    <ul class="moves">${s.cooldown.map((m, k) => `<li class="${m.done ? 'struck' : ''}" data-act="tick-move" data-list="cooldown" data-k="${k}">${esc(m.name)}<span>${fmtDur(m.sec)}</span></li>`).join('')}</ul></details>`;

  return {
    full: true, cls: 'session',
    html: `<div class="sess-head ${resting ? 'resting' : ''}">
        <div class="sess-top"><button class="iconbtn inv" data-act="go" data-href="#/plan">${icon.back}</button><span>${esc(s.title)} · <b data-t="elapsed">${fmtClock(W.elapsed())}</b></span><span class="hdr-btns"><a class="iconbtn inv" href="#/timer" aria-label="Timer">${icon.timer}</a><button class="iconbtn inv" data-act="sess-options">${icon.dots}</button></span></div>
        ${head}
      </div>
      <div class="sess-body">
        ${warm}
        <div class="exlist">${items}</div>
        ${cardio}
        ${cool}
        <button class="btn primary big" data-act="finish">Finish workout</button>
        <button class="btn ghost" data-act="discard">Discard workout</button>
      </div>`,
  };
}

function readRow(i, si) {
  const row = document.querySelector(`input[data-i="${i}"][data-s="${si}"][data-f="reps"]`);
  const kg = document.querySelector(`input[data-i="${i}"][data-s="${si}"][data-f="kg"]`);
  const set = state.session.items[i].sets[si];
  return { reps: row ? +row.value || 0 : set.reps, kg: kg ? +kg.value || 0 : set.kg };
}

function doLog(i, si) {
  const s = state.session;
  const set = s.items[i].sets[si];
  if (set.done) { W.unlogSet(i, si); rerender(); return; }
  W.unlockAudio();
  const v = readRow(i, si);
  const r = W.logSet(i, si, v.reps, v.kg);
  openItem = s.cur.i;
  if (r === 'finished') toast('All sets logged! 💪');
  rerender();
}

register({
  'log-cur': () => { const s = state.session; doLog(s.cur.i, s.cur.s); },
  'log-row': (el) => doLog(+el.dataset.i, +el.dataset.s),
  'set-val': (el) => {
    const s = state.session; const i = +el.dataset.i, si = +el.dataset.s, f = el.dataset.f;
    const it = s.items[i];
    const v = +el.value || 0;
    it.sets[si][f] = v;
    // Carry a changed value to the following sets that aren't logged yet.
    for (let k = si + 1; k < it.sets.length; k++) if (!it.sets[k].done) it.sets[k][f] = v;
    save(); rerender();
  },
  'pause': () => { W.togglePause(); rerender(); },
  'rest-add': (el) => { W.addRest(+el.dataset.v); rerender(); },
  'rest-skip': () => { W.skipRest(); rerender(); },
  'open-item': (el) => {
    const i = +el.dataset.i; openItem = i;
    const it = state.session.items[i];
    const si = it.sets.findIndex(x => !x.done);
    if (si >= 0 && state.session.phase !== 'rest') W.jumpTo(i, si);
    rerender();
  },
  'jump': (el) => { W.jumpTo(+el.dataset.i, +el.dataset.s); openItem = +el.dataset.i; rerender(); },
  'add-set': (el) => {
    const it = state.session.items[+el.dataset.i];
    const last = it.sets[it.sets.length - 1];
    it.sets.push({ reps: last.reps, kg: last.kg, done: false });
    save(); rerender();
  },
  'tick-move': (el) => { const m = state.session[el.dataset.list][+el.dataset.k]; m.done = !m.done; save(); rerender(); },
  'timer-start': (el) => { W.startTimer(el.dataset.k); if (el.dataset.k === 'warm') window.scrollTo(0, 0); rerender(); },
  'timer-stop': (el) => { W.timerDone(el.dataset.k); rerender(); },
  'sess-menu': (el) => {
    const i = +el.dataset.i; const it = state.session.items[i];
    sheet(`<h2>${esc(it.name)}</h2>
      <button class="row" data-act="go" data-href="#/ex/${encodeURIComponent(it.exId)}">${icon.info}<b>How to do it</b></button>
      <button class="row" data-act="set-rest" data-i="${i}" data-v="-15"><b>Rest −15 s</b><small>now ${it.rest} s</small></button>
      <button class="row" data-act="set-rest" data-i="${i}" data-v="15"><b>Rest +15 s</b></button>
      <button class="row" data-act="del-set" data-i="${i}"><b>Remove last set</b></button>
      <button class="row danger" data-act="skip-ex" data-i="${i}"><b>Skip this exercise today</b></button>`);
  },
  'set-rest': (el) => { const it = state.session.items[+el.dataset.i]; it.rest = Math.max(15, it.rest + +el.dataset.v); save(); closeSheet(); rerender(); },
  'del-set': (el) => { const it = state.session.items[+el.dataset.i]; if (it.sets.length > 1) it.sets.pop(); save(); closeSheet(); rerender(); },
  'skip-ex': (el) => {
    const s = state.session; s.items.splice(+el.dataset.i, 1);
    if (!s.items.length) { closeSheet(); W.discard(); location.hash = '#/plan'; return; }
    const ni = s.items.findIndex(it => it.sets.some(x => !x.done));
    s.cur = { i: Math.max(0, ni), s: ni >= 0 ? s.items[ni].sets.findIndex(x => !x.done) : 0 };
    openItem = s.cur.i; save(); closeSheet(); rerender();
  },
  'sess-options': () => sheet(`<h2>Workout</h2>
      <button class="row" data-act="toggle-sound"><b>Sound</b><span class="pill">${state.settings.sound ? 'On' : 'Off'}</span></button>
      <button class="row" data-act="test-beep"><b>Test beep</b></button>
      <button class="row danger" data-act="discard"><b>Discard workout</b></button>`),
  'toggle-sound': () => { state.settings.sound = !state.settings.sound; save(); closeSheet(); },
  'test-beep': () => { W.unlockAudio(); W.beep(3); },
  'finish': () => {
    const s = state.session;
    const left = s.items.reduce((a, it) => a + it.sets.filter(x => !x.done).length, 0);
    const logged = s.items.reduce((a, it) => a + it.sets.filter(x => x.done).length, 0);
    if (!logged) { if (confirm('No sets logged. Discard this workout?')) { W.discard(); location.hash = '#/plan'; } return; }
    if (left && !confirm(`${left} set(s) not logged. Finish anyway?`)) return;
    closeSheet();
    const rec = W.finish();
    openItem = null;
    scheduleSync(500);
    location.hash = `#/summary/${rec.id}`;
  },
  'discard': () => {
    if (!confirm('Discard this workout? Logged sets will be lost.')) return;
    closeSheet(); W.discard(); openItem = null; location.hash = '#/plan';
  },
});

// ───────────── Summary ─────────────
export function summaryView(id) {
  const p = profile();
  const rec = p.history.find(h => h.id === id);
  if (!rec) return { html: `<header class="bar"><button class="iconbtn" data-act="back">${icon.back}</button><h2>Workout</h2><span></span></header><p>Not found.</p>` };
  const sets = rec.items.reduce((a, it) => a + it.sets.length, 0);
  const volume = Math.round(rec.items.reduce((a, it) => a + it.sets.reduce((b, x) => b + (it.unit === 'reps' ? x.reps * x.kg : 0), 0), 0));
  // Personal records: best weight this session vs. all earlier sessions.
  const prs = [];
  const idx = p.history.indexOf(rec);
  for (const it of rec.items) {
    if (it.unit !== 'reps') continue;
    const best = Math.max(...it.sets.map(x => x.kg || 0));
    if (!best) continue;
    const prev = p.history.slice(0, idx).flatMap(h => h.items.filter(x => x.exId === it.exId)).flatMap(x => x.sets.map(y => y.kg || 0));
    if (prev.length && best > Math.max(...prev)) prs.push(`${it.name}: ${fmtKg(best)} kg`);
  }
  const mins = Math.round(rec.duration / 60);
  return {
    html: `<header class="bar"><button class="iconbtn" data-act="go" data-href="#/plan">${icon.back}</button><h2>${esc(rec.title)}</h2><span></span></header>
      <p class="lead">${fmtDate(rec.date)}${rec.week ? ` · Week ${rec.week}` : ''}</p>
      <div class="statrow">
        <div class="stat"><b>${mins} min</b><small>Duration</small></div>
        <div class="stat"><b>${sets}</b><small>Sets</small></div>
        <div class="stat"><b>${volume.toLocaleString('en')}</b><small>kg lifted</small></div>
      </div>
      <div class="card"><b>${icon.fire} ${estimateCalories(p.stats, mins)} kcal</b> <span class="muted">estimated</span></div>
      ${prs.length ? `<div class="card pr"><b>🏆 New personal bests</b><ul class="plain">${prs.map(x => `<li>${esc(x)}</li>`).join('')}</ul></div>` : ''}
      <h3>Log</h3>
      <div class="exlist">${rec.items.map(it => `<div class="exrow">${thumb(exById(it.exId), photoFor(it.exId))}<div class="exbody"><b class="exname">${esc(it.name)}</b><div class="chips">${it.sets.map(x => `<span class="chip on">${setLabel(x, it.unit)}</span>`).join('')}</div></div></div>`).join('')}
      ${rec.cardio ? `<div class="exrow">${thumb(exById(rec.cardio.exId))}<div class="exbody"><b class="exname">${esc(exById(rec.cardio.exId)?.name || 'Cardio')}</b><div class="chips"><span class="chip on">${rec.cardio.min} min</span></div></div></div>` : ''}</div>
      <button class="btn primary big" data-act="go" data-href="#/plan">Done</button>
      <button class="btn ghost" data-act="del-record" data-id="${rec.id}">Delete this log</button>`,
  };
}

register({
  'del-record': (el) => {
    if (!confirm('Delete this workout log? This cannot be undone.')) return;
    const p = profile();
    p.history = p.history.filter(h => h.id !== el.dataset.id);
    if (p.plan) for (const k of Object.keys(p.plan.done)) if (p.plan.done[k] === el.dataset.id) delete p.plan.done[k];
    touchProfile(p); scheduleSync(); location.hash = '#/plan';
  },
});
