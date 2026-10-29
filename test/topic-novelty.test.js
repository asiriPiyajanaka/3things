import test from 'node:test';
import assert from 'node:assert/strict';
import { repeatedTopicTitles, titleWords, titlesOverlap } from '../src/topic-novelty.js';

test('titleWords normalizes common title variations', () => {
  assert.deepEqual(titleWords('Why polling hides failures'), ['poll', 'hide', 'failure']);
});

test('titlesOverlap catches the same central mechanism with new wording', () => {
  assert.equal(titlesOverlap('Polling drains batteries', 'Why polling hides failures'), true);
  assert.equal(titlesOverlap('Forms submit without clicks', 'Keyboard focus can disappear'), false);
});

test('repeatedTopicTitles checks recent titles and the current set', () => {
  const repeated = repeatedTopicTitles([
    { title: 'Polling drains batteries' },
    { title: 'Forms submit without clicks' },
    { title: 'Forms can submit twice' }
  ], ['Why polling hides failures']);

  assert.deepEqual(repeated, ['Polling drains batteries', 'Forms can submit twice']);
});
