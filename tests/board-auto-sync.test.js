'use strict';

const fs = require('fs');
const path = require('path');
const assert = require('assert');

const htmlPath = path.join(__dirname, '..', 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');

const idleMatch = html.match(/var BOARD_AUTO_SYNC_IDLE_MS = (\d+) \* (\d+) \* (\d+);/);
assert.ok(idleMatch, 'BOARD_AUTO_SYNC_IDLE_MS 상수가 있어야 한다');
const IDLE = Number(idleMatch[1]) * Number(idleMatch[2]) * Number(idleMatch[3]);
assert.strictEqual(IDLE, 10 * 60 * 1000);
assert.doesNotMatch(html, /12 \* 60 \* 1000/);

const startMark = '/* board-auto-sync:start */';
const endMark = '/* board-auto-sync:end */';
const start = html.indexOf(startMark);
const end = html.indexOf(endMark);
assert.ok(start !== -1 && end > start, 'index.html에 자동 동기화 판단 함수가 있어야 한다');
const source = html.slice(start + startMark.length, end);
const api = new Function(
  source +
    '\nreturn { boardAutoSyncWaitMs_, planBoardAutoSyncTick_, boardAutoSyncFieldBlocks_ };'
)();

assert.strictEqual(api.boardAutoSyncWaitMs_(0, 5_000, IDLE), IDLE);
assert.strictEqual(api.boardAutoSyncWaitMs_(1_000, 1_000, IDLE), IDLE);
assert.strictEqual(api.boardAutoSyncWaitMs_(1_000, 1_000 + 3 * 60 * 1000, IDLE), 7 * 60 * 1000);
assert.strictEqual(api.boardAutoSyncWaitMs_(1_000, 1_000 + IDLE, IDLE), IDLE);
assert.strictEqual(api.boardAutoSyncWaitMs_(1_000, 1_000 + IDLE + 5 * 60 * 1000, IDLE), IDLE);
assert.ok(api.boardAutoSyncWaitMs_(1_000, 1_000 + IDLE - 1, IDLE) > 0);

function ctx(over) {
  return Object.assign({
    visible: true,
    canSync: true,
    inputBusy: false,
    lastBoardSyncAt: 10_000,
    now: 10_000 + IDLE,
    idleMs: IDLE,
  }, over);
}

assert.deepStrictEqual(api.planBoardAutoSyncTick_(ctx()), { load: true, schedule: false, waitMs: 0 });
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ now: 10_000 + IDLE - 1 })).load, false);
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ now: 10_000 + 12 * 60 * 1000 })).load, true);
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ visible: false })).load, false);
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ visible: false })).schedule, false);
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ canSync: false })).load, false);
assert.strictEqual(api.planBoardAutoSyncTick_(ctx({ inputBusy: true })).load, false);
assert.strictEqual(api.planBoardAutoSyncTick_(null).load, false);

const blocked = api.planBoardAutoSyncTick_(ctx({ inputBusy: true }));
assert.strictEqual(blocked.load, false);
assert.strictEqual(blocked.schedule, true);
assert.strictEqual(blocked.waitMs, IDLE);

const early = api.planBoardAutoSyncTick_(ctx({ now: 10_000 + 4 * 60 * 1000 }));
assert.strictEqual(early.load, false);
assert.strictEqual(early.schedule, true);
assert.strictEqual(early.waitMs, 6 * 60 * 1000);

assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'search', { searchFocused: true }), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('', '', { searchPending: true }), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('TEXTAREA', '', {}), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('SELECT', '', {}), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'text', {}), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'search', {}), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', '', {}), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('DIV', '', { contentEditable: true }), true);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'checkbox', {}), false);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'radio', {}), false);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('INPUT', 'button', {}), false);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('BUTTON', '', {}), false);
assert.strictEqual(api.boardAutoSyncFieldBlocks_('', '', {}), false);

// 보이는 채로 두면 마지막 동기화 후 10분마다 한 번씩만 부른다.
(function simulateVisibleIdle() {
  let now = 1_000_000;
  let last = now;
  let timerAt = null;
  const loads = [];
  function schedule(waitMs) {
    assert.strictEqual(timerAt, null, '타이머는 한 개만');
    const wait = typeof waitMs === 'number' ? waitMs : api.boardAutoSyncWaitMs_(last, now, IDLE);
    assert.ok(wait > 0 && wait <= IDLE);
    timerAt = now + wait;
  }
  schedule();
  const end = now + 40 * 60 * 1000;
  let steps = 0;
  while (timerAt != null && timerAt <= end) {
    assert.ok(++steps < 10, '10분보다 자주 돌면 안 된다');
    now = timerAt;
    timerAt = null;
    const plan = api.planBoardAutoSyncTick_(ctx({
      lastBoardSyncAt: last,
      now: now,
    }));
    if (plan.load) {
      assert.ok(now - last >= IDLE);
      loads.push(now);
      last = now;
      schedule();
    } else if (plan.schedule) {
      schedule(plan.waitMs);
    }
  }
  assert.deepStrictEqual(loads, [
    1_000_000 + IDLE,
    1_000_000 + IDLE * 2,
    1_000_000 + IDLE * 3,
    1_000_000 + IDLE * 4,
  ]);
})();

// 숨겨진 탭에서는 부르지 않고, 타이머도 다시 걸지 않는다.
(function simulateHidden() {
  const last = 2_000_000;
  const now = last + IDLE + 60_000;
  const plan = api.planBoardAutoSyncTick_(ctx({
    visible: false,
    lastBoardSyncAt: last,
    now: now,
  }));
  assert.deepStrictEqual(plan, { load: false, schedule: false, waitMs: 0 });
})();

// 막혀 있으면 서버를 부르지 않는다. 다음 확인은 10분 뒤다.
(function simulateBlocked() {
  const last = 3_000_000;
  const now = last + IDLE;
  const plan = api.planBoardAutoSyncTick_(ctx({
    canSync: false,
    inputBusy: true,
    lastBoardSyncAt: last,
    now: now,
  }));
  assert.strictEqual(plan.load, false);
  assert.strictEqual(plan.waitMs, IDLE);
})();

assert.strictEqual((html.match(/var _boardAutoSyncTimer = null;/g) || []).length, 1);
assert.strictEqual((html.match(/setTimeout\(runBoardAutoSyncTimer_/g) || []).length, 1);
assert.strictEqual((html.match(/loadBoard\(\{ silent: true \}\)/g) || []).length, 2);

const sectionStart = html.indexOf(startMark);
const sectionEnd = html.indexOf('function renderMemberChips()');
assert.ok(sectionEnd > sectionStart);
const section = html.slice(sectionStart, sectionEnd);
assert.doesNotMatch(section, /setInterval\(/);
assert.match(section, /function scheduleNextBoardAutoSync_\(waitMs\) \{\s*if \(_boardAutoSyncTimer\) \{\s*clearTimeout\(_boardAutoSyncTimer\);\s*_boardAutoSyncTimer = null;/);
assert.match(section, /if \(plan\.load\) \{\s*loadBoard\(\{ silent: true \}\);\s*return;\s*\}\s*if \(plan\.schedule\) scheduleNextBoardAutoSync_\(plan\.waitMs\);/);
assert.match(section, /memberSearchInput/);
assert.match(section, /state\._memberSearchTimer/);
assert.match(section, /function canAutoSyncBoard\(\) \{\s*if \(!state\.pin\) return false;\s*if \(document\.getElementById\('pinOverlay'\)\.classList\.contains\('open'\)\) return false;\s*if \(hasUnsavedSessionEdits_\(\)\) return false;\s*if \(isSyncBlockingModalOpen\(\)\) return false;\s*if \(_boardSyncInFlight\) return false;\s*return true;\s*\}/);

assert.match(
  html,
  /document\.addEventListener\('visibilitychange', function\(\) \{\s*if \(document\.visibilityState === 'visible'\) \{[\s\S]*?tryAutoSyncBoard\(\)/
);
assert.match(html, /if \(myGen === _boardLoadGen\) \{[\s\S]*?scheduleNextBoardAutoSync_\(\);/);
assert.doesNotMatch(
  html.slice(html.indexOf("document.addEventListener('visibilitychange'"), html.indexOf("window.addEventListener('focus'")),
  /visibilityState !== 'visible'[\s\S]*loadBoard/
);

console.log('ok board-auto-sync');
