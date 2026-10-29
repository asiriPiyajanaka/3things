import test, { after } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const isolatedHome = fs.mkdtempSync(path.join(os.tmpdir(), '3things-store-tests-'));
process.env.HOME = isolatedHome;
process.env.USERPROFILE = isolatedHome;

const { latestTaskPath, pendingTaskPath, smartDecisionPath, topicOffersPath } = await import('../src/paths.js');
const {
  appendTopicOffers,
  clearDailyArea,
  clearPendingTask,
  DEFAULT_CONFIG,
  getFreshDailyArea,
  markPendingTask,
  markSmartDecision,
  loadTask,
  readPendingTask,
  readSmartDecision,
  readTopicOffers,
  saveTask,
  setDailyArea
} = await import('../src/store.js');

after(() => {
  fs.rmSync(isolatedHome, { recursive: true, force: true });
});

test('default trigger is smart', () => {
  assert.equal(DEFAULT_CONFIG.trigger, 'smart');
});

test('3Things keeps exactly-three behavior out of config', () => {
  assert.equal(Object.hasOwn(DEFAULT_CONFIG, 'thingsPerTask'), false);
});

test('default learning terminal mode opens a new terminal per lesson', () => {
  assert.equal(DEFAULT_CONFIG.learningTerminalMode, 'new');
});

test('Codex is the default capture integration', () => {
  assert.deepEqual(DEFAULT_CONFIG.integrations, ['codex']);
});

test('daily learning area is fresh for less than 24 hours', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  setDailyArea(config, 'Frontend', new Date('2026-08-21T00:00:00.000Z'));

  assert.equal(getFreshDailyArea(config, new Date('2026-08-21T23:59:59.000Z')), 'Frontend');
  assert.equal(getFreshDailyArea(config, new Date('2026-08-22T00:00:00.000Z')), null);
});

test('daily learning area can be cleared', () => {
  const config = structuredClone(DEFAULT_CONFIG);
  setDailyArea(config, 'Security', new Date('2026-08-21T00:00:00.000Z'));
  clearDailyArea(config);

  assert.equal(getFreshDailyArea(config, new Date('2026-08-21T01:00:00.000Z')), null);
});

test('pending task is ignored when it matches the current lesson', () => {
  const eventFile = new URL(import.meta.url).pathname;
  markPendingTask(eventFile);

  assert.equal(readPendingTask({ currentEventFile: eventFile }), null);
  assert.equal(fs.existsSync(pendingTaskPath), false);
});

test('pending task returns a different existing event file', () => {
  const eventFile = new URL(import.meta.url).pathname;
  markPendingTask(eventFile);

  const pending = readPendingTask({ currentEventFile: null });
  assert.equal(pending.eventFile, eventFile);

  clearPendingTask();
});

test('smart decision stores the latest launch reason', () => {
  markSmartDecision({ eventFile: 'task.json', launch: false, reason: 'too small' });

  const decision = readSmartDecision();
  assert.equal(decision.eventFile, 'task.json');
  assert.equal(decision.launch, false);
  assert.equal(decision.reason, 'too small');
  assert.equal(fs.existsSync(smartDecisionPath), true);

  fs.rmSync(smartDecisionPath, { force: true });
});

test('saveTask records the source agent', () => {
  const file = saveTask({
    agent: 'custom-agent',
    prompt: 'Fix retry handling',
    cwd: process.cwd(),
    turn_id: 'store-test-agent'
  });

  const task = loadTask(file);
  assert.equal(task.agent, 'custom-agent');
  assert.equal(task.prompt, 'Fix retry handling');

  fs.rmSync(file, { force: true });
  fs.rmSync(latestTaskPath, { force: true });
});

test('recently offered topics are stored separately from learned history', () => {
  appendTopicOffers({
    offeredAt: '2026-10-29T00:00:00.000Z',
    area: 'Frontend',
    topics: ['Polling hides failures', 'Forms submit without clicks', 'Focus can move']
  });

  assert.deepEqual(readTopicOffers(), [{
    offeredAt: '2026-10-29T00:00:00.000Z',
    area: 'Frontend',
    topics: ['Polling hides failures', 'Forms submit without clicks', 'Focus can move']
  }]);

  fs.rmSync(topicOffersPath, { force: true });
});
