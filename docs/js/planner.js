// Builds a multi-week plan from a profile, and works out each session's sets, reps and weights.
import { MUSCLES, WARMUP, COOLDOWN } from './exercises.js';
import { allExercises, isAvailable, exById, lastLogFor, uid } from './store.js';

export const PLAN_WEEKS = 12;
export const EX_PER_DAY = 4;   // exercises per workout day (not counting warm-up and cardio finisher)
export const SETS = 4;         // sets per exercise
const PLAN_FMT = 2;            // bump when the plan shape changes (see upgradePlan)

export const GOALS = {
  hypertrophy: { name: 'Build muscle', compound: { sets: 3, reps: [8, 10], rest: 90 }, iso: { sets: 3, reps: [10, 12], rest: 60 }, cardio: 0, factor: 1 },
  strength: { name: 'Strength', compound: { sets: 4, reps: [4, 6], rest: 150 }, iso: { sets: 3, reps: [8, 10], rest: 90 }, cardio: 0, factor: 1.1 },
  fatloss: { name: 'Lose fat / tone', compound: { sets: 3, reps: [10, 12], rest: 60 }, iso: { sets: 3, reps: [12, 15], rest: 45 }, cardio: 15, factor: 0.85 },
  general: { name: 'General fitness', compound: { sets: 3, reps: [8, 12], rest: 75 }, iso: { sets: 2, reps: [10, 15], rest: 60 }, cardio: 10, factor: 0.9 },
};

export const LEVELS = { beginner: 'Beginner', intermediate: 'Intermediate', advanced: 'Advanced' };
const LEVEL_NUM = { beginner: 1, intermediate: 2, advanced: 3 };
const LEVEL_F = { beginner: 0.6, intermediate: 1, advanced: 1.3 };

export const FOCUS = {
  glutes: { name: 'Glutes', pats: ['glute'] },
  legs: { name: 'Legs', pats: ['quad-iso', 'ham-iso'] },
  arms: { name: 'Arms', pats: ['biceps', 'triceps'] },
  chest: { name: 'Chest', pats: ['chest-iso'] },
  back: { name: 'Back', pats: ['h-pull'] },
  shoulders: { name: 'Shoulders', pats: ['side-delt'] },
  core: { name: 'Core / abs', pats: ['core'] },
  calves: { name: 'Calves', pats: ['calf'] },
};

const UPPER = new Set(['h-push', 'v-push', 'h-pull', 'v-pull', 'chest-iso', 'side-delt', 'rear-delt', 'traps', 'biceps', 'triceps']);
const LOWER = new Set(['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'glute', 'adductor', 'calf']);

const DAYS = {
  fullA: { name: 'Full Body A', region: 'all', slots: ['squat', 'h-push', 'h-pull', 'v-push', 'core', 'biceps', 'triceps', 'lunge', 'calf'] },
  fullB: { name: 'Full Body B', region: 'all', slots: ['hinge', 'v-pull', 'h-push', 'lunge', 'side-delt', 'core', 'glute', 'triceps', 'biceps'] },
  fullC: { name: 'Full Body C', region: 'all', slots: ['squat', 'h-pull', 'v-push', 'glute', 'chest-iso', 'rear-delt', 'core', 'biceps', 'ham-iso'] },
  upperA: { name: 'Upper A', region: 'upper', slots: ['h-push', 'v-pull', 'v-push', 'h-pull', 'chest-iso', 'triceps', 'side-delt', 'core', 'biceps'] },
  upperB: { name: 'Upper B', region: 'upper', slots: ['v-pull', 'h-push', 'h-pull', 'v-push', 'rear-delt', 'biceps', 'triceps', 'core', 'traps'] },
  lowerA: { name: 'Lower A', region: 'lower', slots: ['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'calf', 'core', 'glute'] },
  lowerB: { name: 'Lower B', region: 'lower', slots: ['hinge', 'glute', 'squat', 'lunge', 'ham-iso', 'adductor', 'calf', 'core'] },
  push: { name: 'Push', region: 'push', slots: ['h-push', 'v-push', 'h-push', 'chest-iso', 'side-delt', 'triceps', 'triceps', 'core'] },
  pull: { name: 'Pull', region: 'pull', slots: ['v-pull', 'h-pull', 'h-pull', 'rear-delt', 'biceps', 'biceps', 'traps', 'core'] },
  legs: { name: 'Legs', region: 'lower', slots: ['squat', 'hinge', 'lunge', 'quad-iso', 'ham-iso', 'glute', 'calf', 'core'] },
  upper: { name: 'Upper', region: 'upper', slots: ['h-push', 'h-pull', 'v-push', 'v-pull', 'chest-iso', 'biceps', 'triceps', 'core'] },
  lower: { name: 'Lower', region: 'lower', slots: ['hinge', 'squat', 'glute', 'lunge', 'ham-iso', 'quad-iso', 'calf', 'core'] },
};

const SPLITS = {
  2: { name: 'Full Body', days: ['fullA', 'fullB'] },
  3: { name: 'Full Body', days: ['fullA', 'fullB', 'fullC'] },
  4: { name: 'Upper / Lower', days: ['upperA', 'lowerA', 'upperB', 'lowerB'] },
  5: { name: 'Push / Pull / Legs + Upper / Lower', days: ['push', 'pull', 'legs', 'upper', 'lower'] },
};

const PUSH_PATS = new Set(['h-push', 'v-push', 'chest-iso', 'side-delt', 'triceps', 'core']);
const PULL_PATS = new Set(['v-pull', 'h-pull', 'rear-delt', 'biceps', 'traps', 'core']);

function regionAllows(region, pat) {
  if (pat === 'core') return true;
  if (region === 'all') return true;
  if (region === 'upper') return UPPER.has(pat);
  if (region === 'lower') return LOWER.has(pat);
  if (region === 'push') return PUSH_PATS.has(pat);
  if (region === 'pull') return PULL_PATS.has(pat);
  return false;
}

// Small deterministic random so the same profile gets a stable plan.
function rng(seed) {
  let h = 2166136261;
  for (const c of String(seed)) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => { h = Math.imul(h ^ (h >>> 15), 2246822507); h = Math.imul(h ^ (h >>> 13), 3266489909); return ((h ^= h >>> 16) >>> 0) / 4294967296; };
}

export function candidates(stats, pat, exclude = []) {
  const lvl = LEVEL_NUM[stats.level] || 1;
  const injuries = stats.injuries || [];
  const dislikes = stats.dislikes || [];
  const base = allExercises().filter(e => e.pat === pat && isAvailable(e) && !exclude.includes(e.id)
    && !dislikes.includes(e.id) && !e.avoid.some(a => injuries.includes(a)));
  const fit = base.filter(e => e.lvl <= lvl);
  return fit.length ? fit : base.filter(e => e.lvl <= lvl + 1);
}

function pick(stats, pat, { exclude, used, rand, compoundFirst }) {
  const list = candidates(stats, pat, exclude);
  if (!list.length) return null;
  const likes = stats.likes || [];
  const beginner = stats.level === 'beginner';
  let best = null, bestScore = -1e9;
  for (const e of list) {
    let s = rand() * 2;
    if (likes.includes(e.id)) s += 10;
    s -= (used.get(e.id) || 0) * 4;
    if (compoundFirst && !e.iso) s += 2;
    if (beginner && ['handles', 'pad-arms', 'pad-legs', 'platform'].includes(e.grip)) s += 2;
    if (e.custom) s += 3; // prefer machines the user added
    if (s > bestScore) { bestScore = s; best = e; }
  }
  used.set(best.id, (used.get(best.id) || 0) + 1);
  return best;
}

export function sessionBudget(stats) {
  const g = GOALS[stats.goal] || GOALS.general;
  const minutes = stats.minutes || 45;
  const warm = stats.warmup ?? 5;
  const cool = 5;
  let cardio = stats.cardio ? (g.cardio || 10) : 0;
  if (minutes <= 30) cardio = Math.min(cardio, 8);
  if (minutes - warm - cool - cardio < 20) cardio = 0; // lifting comes first when time is short
  return { minutes, warm, cool, cardio, lift: Math.max(15, minutes - warm - cool - cardio) * 60 };
}

export function exerciseSeconds(rx) {
  const work = rx.unit === 'sec' ? rx.reps[1] : 40;
  return rx.sets * (work + rx.rest) + 60;
}

export function generatePlan(p) {
  const st = p.stats;
  const split = SPLITS[st.days] || SPLITS[3];
  const used = new Map();
  const budget = sessionBudget(st);
  const focusPats = (st.focus || []).flatMap(f => FOCUS[f]?.pats || []);
  const rand = rng(p.id + st.goal + st.days + (p.plan?.version || 0));

  const days = split.days.map((key, di) => {
    const t = DAYS[key];
    let slots = [...t.slots];
    // Insert focus slots after the first two big lifts.
    const extra = focusPats.filter(fp => regionAllows(t.region, fp));
    slots.splice(2, 0, ...extra);
    // Exactly EX_PER_DAY exercises (warm-up and cardio finisher come on top).
    const items = [];
    for (const pat of slots) {
      if (items.length >= EX_PER_DAY) break;
      const ex = pick(st, pat, { exclude: items.map(i => i.exId), used, rand, compoundFirst: items.length < 2 });
      if (ex) items.push({ exId: ex.id, pat });
    }
    let cardio = null;
    if (budget.cardio) {
      const c = pick(st, 'cardio', { exclude: [], used, rand });
      if (c) cardio = { exId: c.id, min: budget.cardio };
    }
    return { key, name: t.name, items, cardio };
  });

  // Sets are fixed, so shorten the rests (down to 45 s) if the longest day doesn't fit the session length.
  let restScale = 1;
  const daySec = (sc) => Math.max(...days.map(d => d.items.reduce((a, it) => a + exerciseSeconds(prescribe(st, exById(it.exId), 1, sc)), 0)));
  while (restScale > 0.3 && daySec(restScale) > budget.lift + 120) restScale = +(restScale - 0.05).toFixed(2);

  return {
    id: uid('plan'), version: (p.plan?.version || 0) + 1, createdAt: Date.now(), fmt: PLAN_FMT,
    name: `${GOALS[st.goal]?.name || 'Training'} · ${split.name}`,
    weeks: PLAN_WEEKS, goal: st.goal, days, done: {}, restScale, edits: {},
  };
}

// Plans made before the 4 × 4 format get new days; progress (done weeks) and history are kept.
export function upgradePlan(p) {
  if (!p.plan || p.plan.fmt === PLAN_FMT) return false;
  const old = p.plan;
  const fresh = generatePlan({ ...p, plan: { version: (old.version || 1) - 1 } });
  p.plan = { ...fresh, id: old.id, version: old.version, createdAt: old.createdAt, done: old.done || {} };
  return true;
}

export function dayFocus(day) {
  const names = [];
  for (const it of day.items) {
    const ex = exById(it.exId);
    if (!ex) continue;
    for (const m of [ex.m]) if (!names.includes(MUSCLES[m])) names.push(MUSCLES[m]);
  }
  if (day.cardio) names.push('Cardio');
  if (names.length <= 1) return names.join('');
  return names.slice(0, -1).join(', ') + ' & ' + names[names.length - 1];
}

// Phase of the 12-week program.
export function phaseOf(week) {
  if (week >= 12) return { key: 'deload', name: 'Deload week – lighter, recover' };
  if (week >= 9) return { key: 'peak', name: 'Phase 3 · Heavier, fewer reps' };
  if (week >= 5) return { key: 'build', name: 'Phase 2 · More volume' };
  return { key: 'base', name: 'Phase 1 · Learn & build the base' };
}

// Sets / reps / rest for an exercise in a given week. Always SETS sets; the phases change reps and weight.
export function prescribe(stats, ex, week, restScale = 1) {
  const g = GOALS[stats.goal] || GOALS.general;
  const b = ex.iso ? g.iso : g.compound;
  let reps = [...b.reps], rest = b.rest;
  const ph = phaseOf(week).key;
  if (ph === 'build') reps = reps.map(r => r + (stats.goal === 'strength' ? 1 : 2));
  if (ph === 'peak' && (stats.goal === 'strength' || stats.goal === 'hypertrophy')) reps = reps.map(r => Math.max(3, r - 2));
  if (ex.unit === 'sec') {
    const add = Math.min(30, (week - 1) * 3);
    reps = [30 + add, 45 + add];
    rest = 60;
  }
  rest = Math.max(45, Math.round(rest * restScale / 15) * 15);
  return { sets: SETS, reps, rest, unit: ex.unit };
}

const round = (v, inc) => Math.max(0, Math.round(v / inc) * inc);

export function estimateWeight(stats, ex) {
  if (!ex.load) return 0;
  const bw = stats.weight || 70;
  const sexF = stats.sex === 'female' ? 0.6 : 1;
  const lvlF = LEVEL_F[stats.level] || 1;
  const g = GOALS[stats.goal] || GOALS.general;
  if (ex.assist) {
    const assistF = { beginner: 1.3, intermediate: 1, advanced: 0.6 }[stats.level] || 1;
    return round(bw * ex.load * assistF * (stats.sex === 'female' ? 1.2 : 1), ex.inc);
  }
  return Math.max(ex.inc, round(bw * ex.load * sexF * lvlF * g.factor, ex.inc));
}

// Suggests the weight and reps for the next session based on the last time this exercise was logged.
export function suggest(p, ex, rx, week) {
  const last = lastLogFor(p, ex.id);
  let kg, reps = rx.reps[0], estimated = false, note = '';
  if (!last && p.startKg?.[ex.id] != null) {
    kg = p.startKg[ex.id]; // weight the user set in a day preview before ever logging this exercise
  } else if (!last) {
    kg = estimateWeight(p.stats, ex);
    estimated = !!ex.load;
    if (estimated) note = 'Starting estimate – tap the sets to change it.';
  } else {
    const done = last.item.sets.filter(s => s.done);
    const lastKg = done.reduce((m, s) => Math.max(m, s.kg || 0), 0);
    const top = (last.item.target?.reps || rx.reps)[1];
    const allTop = done.length >= Math.min(2, last.item.sets.length) && done.every(s => (s.reps || 0) >= top);
    const minReps = Math.min(...done.map(s => s.reps || 0));
    if (allTop && ex.load) {
      kg = ex.assist ? Math.max(0, lastKg - ex.inc) : lastKg + ex.inc;
      note = ex.assist ? 'Less assistance – you hit all reps last time!' : `+${ex.inc} kg – you hit all reps last time!`;
      reps = rx.reps[0];
    } else {
      kg = lastKg;
      reps = Math.min(rx.reps[1], Math.max(rx.reps[0], minReps + 1));
      if (!ex.load) reps = Math.min(rx.reps[1] + 5, Math.max(rx.reps[0], minReps + 1));
    }
  }
  if (phaseOf(week).key === 'deload' && kg) { kg = ex.assist ? kg * 1.15 : round(kg * 0.85, ex.inc); note = 'Deload week – lighter on purpose.'; }
  return { kg: round(kg, ex.inc), reps, estimated, note };
}

// Reps/kg the user typed in the day preview, per week + day + exercise.
export const editKey = (week, dayIdx, exId) => `${week}-${dayIdx}-${exId}`;

// Builds the concrete session (what the workout screen runs) for a plan day.
export function buildSession(p, week, dayIdx) {
  const day = p.plan.days[dayIdx];
  const st = p.stats;
  const budget = sessionBudget(st);
  const items = day.items.map(it => {
    const ex = exById(it.exId);
    if (!ex) return null;
    const rx = prescribe(st, ex, week, p.plan.restScale || 1);
    const sg = suggest(p, ex, rx, week);
    const edit = p.plan.edits?.[editKey(week, dayIdx, ex.id)];
    const sets = Array.from({ length: rx.sets }, (_, k) => {
      const e = edit?.[k];
      return { reps: e?.reps ?? sg.reps, kg: e?.kg ?? sg.kg, done: false };
    });
    return {
      exId: ex.id, name: ex.name, unit: ex.unit, rest: rx.rest, assist: ex.assist,
      target: { reps: rx.reps, kg: sg.kg }, note: edit ? 'Edited by you' : sg.note, estimated: sg.estimated && !edit,
      sets,
    };
  }).filter(Boolean);

  const warmup = st.warmup ? scaleMoves(WARMUP, st.warmup * 60) : [];
  const muscles = new Set(items.map(i => exById(i.exId)?.m).filter(Boolean));
  const cool = [...muscles].map(m => COOLDOWN[m]).filter(Boolean).slice(0, 5);
  cool.push(COOLDOWN.general);
  const cardio = day.cardio && exById(day.cardio.exId) ? { exId: day.cardio.exId, name: exById(day.cardio.exId).name, min: day.cardio.min, done: false } : null;

  return {
    id: uid('s'), profileId: p.id, planId: p.plan.id, week, dayIdx, title: day.name,
    focus: dayFocus(day), startedAt: null, items, warmup, cooldown: cool, cardio,
    budget,
  };
}

function scaleMoves(moves, totalSec) {
  const sum = moves.reduce((a, m) => a + m.sec, 0);
  const f = totalSec / sum;
  return moves.map(m => ({ name: m.name, sec: Math.max(20, Math.round(m.sec * f / 10) * 10) }));
}

export function estimateMinutes(session) {
  const lift = session.items.reduce((a, it) => a + exerciseSeconds({ sets: it.sets.length, rest: it.rest, unit: it.unit, reps: it.target.reps }), 0);
  const warm = session.warmup.reduce((a, m) => a + m.sec, 0);
  const cool = session.cooldown.reduce((a, m) => a + m.sec, 0);
  return Math.round((lift + warm + cool) / 60 + (session.cardio ? session.cardio.min : 0));
}

export function estimateCalories(stats, minutes) {
  return Math.round(5 * (stats.weight || 70) * minutes / 60); // ~5 MET resistance training
}

// ── Plan progress ──
export function currentWeek(plan) {
  for (let w = 1; w <= plan.weeks; w++) {
    for (let d = 0; d < plan.days.length; d++) if (!plan.done[`${w}-${d}`]) return w;
  }
  return plan.weeks;
}

export function planProgress(plan) {
  const total = plan.weeks * plan.days.length;
  return Math.round(Object.keys(plan.done).length / total * 100);
}

export function swapOptions(stats, plan, dayIdx, itemIdx) {
  const day = plan.days[dayIdx];
  const it = day.items[itemIdx];
  const inDay = day.items.map(i => i.exId);
  return candidates(stats, it.pat, inDay.filter(id => id !== it.exId)).filter(e => e.id !== it.exId);
}
