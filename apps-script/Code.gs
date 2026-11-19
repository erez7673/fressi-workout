/**
 * Fressi Workout – Google Sheets sync backend (Google Apps Script web app).
 *
 * Setup (details in README.md):
 *  1. Create a Google Sheet, then Extensions → Apps Script, and paste this file.
 *  2. Project Settings → Script properties → add SECRET = a long password you choose.
 *     (Optional, for AI machine recognition: add ANTHROPIC_API_KEY = your Claude API key.)
 *  3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone.
 *  4. Paste the web app URL and the SECRET into the app (Profile → Sync with Google Sheets).
 *
 * Data is stored one row per item (gym, profile:<id>) as JSON split into 45,000-character cells.
 */

const SHEET = 'data';
const CHUNK = 45000;

function doPost(e) {
  try {
    const body = JSON.parse(e.postData.contents);
    const secret = PropertiesService.getScriptProperties().getProperty('SECRET');
    if (!secret || body.key !== secret) return json({ ok: false, error: 'Wrong secret key' });
    if (body.action === 'pull') return json({ ok: true, items: pull() });
    if (body.action === 'push') { push(body.items || []); return json({ ok: true }); }
    if (body.action === 'identify') return json({ ok: true, result: identify(body.image) });
    return json({ ok: false, error: 'Unknown action' });
  } catch (err) {
    return json({ ok: false, error: String(err && err.message || err) });
  }
}

function doGet() {
  return json({ ok: true, app: 'fressi-sync', hint: 'Use POST from the app.' });
}

function json(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

function sheet() {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  let sh = ss.getSheetByName(SHEET);
  if (!sh) {
    sh = ss.insertSheet(SHEET);
    sh.appendRow(['key', 'updatedAt', 'savedAt', 'json…']);
    sh.setFrozenRows(1);
  }
  return sh;
}

function pull() {
  const sh = sheet();
  const rows = sh.getDataRange().getValues().slice(1);
  const items = {};
  rows.forEach(r => {
    if (!r[0]) return;
    const text = r.slice(3).filter(c => c !== '' && c !== null).join('');
    try { items[r[0]] = { updatedAt: Number(r[1]) || 0, data: JSON.parse(text) }; } catch (e) { /* skip broken row */ }
  });
  return items;
}

function push(items) {
  const lock = LockService.getScriptLock();
  lock.waitLock(20000);
  try {
    const sh = sheet();
    const keys = sh.getRange(1, 1, Math.max(1, sh.getLastRow()), 1).getValues().map(r => r[0]);
    items.forEach(it => {
      if (!it.key || !it.data) return;
      const text = JSON.stringify(it.data);
      const chunks = [];
      for (let i = 0; i < text.length; i += CHUNK) chunks.push(text.slice(i, i + CHUNK));
      const row = [it.key, Number(it.updatedAt) || Date.now(), new Date()].concat(chunks);
      let idx = keys.indexOf(it.key);
      if (idx > 0) {
        const existing = Number(sh.getRange(idx + 1, 2).getValue()) || 0;
        if (existing > (Number(it.updatedAt) || 0)) return; // newer copy already stored
        sh.getRange(idx + 1, 1, 1, sh.getMaxColumns()).clearContent();
      } else {
        idx = sh.getLastRow();
        keys.push(it.key);
      }
      if (sh.getMaxColumns() < row.length) sh.insertColumnsAfter(sh.getMaxColumns(), row.length - sh.getMaxColumns());
      sh.getRange(idx + 1, 1, 1, row.length).setValues([row]);
    });
  } finally {
    lock.releaseLock();
  }
}

/**
 * Optional: identify a gym machine from a photo with Claude.
 * Only runs if the ANTHROPIC_API_KEY script property is set. Costs a few cents per photo.
 */
function identify(imageBase64) {
  const apiKey = PropertiesService.getScriptProperties().getProperty('ANTHROPIC_API_KEY');
  if (!apiKey) throw new Error('ANTHROPIC_API_KEY is not set in the script properties');
  if (!imageBase64) throw new Error('No image');

  const motions = ['push-forward', 'push-up', 'push-down', 'pull-toward', 'pull-down', 'arms-together', 'arms-apart',
    'raise-arms', 'shrug', 'curl', 'extend-arm', 'leg-push', 'leg-extend', 'leg-curl', 'hip-hinge', 'hip-thrust',
    'leg-back', 'legs-apart', 'legs-together', 'calf', 'core-flex', 'core-rotate', 'hold', 'cardio'];
  const schema = {
    type: 'object',
    additionalProperties: false,
    required: ['name', 'mot', 'pos', 'grip', 'feel'],
    properties: {
      name: { type: 'string', description: 'Common English name of the machine, e.g. "Seated Leg Curl"' },
      mot: { type: 'string', enum: motions },
      pos: { type: 'string', enum: ['seated', 'lying', 'incline', 'standing', 'kneeling', 'hanging'] },
      grip: { type: 'string', enum: ['handles', 'bar', 'cable', 'pad-arms', 'pad-legs', 'platform', 'dumbbell', 'strap', 'none'] },
      feel: { type: 'array', items: { type: 'string', enum: ['chest', 'back', 'shoulders', 'biceps', 'triceps', 'quads', 'hamstrings', 'glutes', 'adductors', 'calves', 'core'] } },
    },
  };

  const res = UrlFetchApp.fetch('https://api.anthropic.com/v1/messages', {
    method: 'post',
    contentType: 'application/json',
    muteHttpExceptions: true,
    headers: {
      'x-api-key': apiKey,
      'anthropic-version': '2026-10-21',
      'anthropic-beta': 'server-side-fallback-2026-07-01',
    },
    payload: JSON.stringify({
      model: 'claude-opus-5-5',
      max_tokens: 16000,
      output_config: { effort: 'low', format: { type: 'json_schema', schema: schema } },
      fallbacks: 'default',
      messages: [{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: 'image/jpeg', data: imageBase64 } },
          { type: 'text', text: 'This is a photo of a machine in a commercial gym (brands are usually Gym80 or Matrix). Identify the machine and the main exercise done on it: how the user is positioned, what they hold or push against, the movement, and the muscles worked.' },
        ],
      }],
    }),
  });

  const data = JSON.parse(res.getContentText());
  if (res.getResponseCode() !== 200) throw new Error((data.error && data.error.message) || ('HTTP ' + res.getResponseCode()));
  if (data.stop_reason === 'refusal') throw new Error('The model declined to identify this photo');
  const text = (data.content || []).filter(b => b.type === 'text').map(b => b.text).join('');
  return JSON.parse(text);
}
