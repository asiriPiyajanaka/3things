const FILLER_WORDS = new Set([
  'a', 'an', 'and', 'are', 'be', 'becomes', 'can', 'do', 'does', 'for', 'from',
  'how', 'in', 'is', 'it', 'not', 'of', 'on', 'the', 'to', 'when', 'why', 'with'
]);

const GENERIC_OPENING_WORDS = new Set([
  'app', 'choice', 'client', 'code', 'cost', 'data', 'hidden', 'local', 'server',
  'state', 'system', 'task', 'tiny', 'ui', 'user', 'wait'
]);

function stem(word) {
  if (word.length > 5 && word.endsWith('ing')) {
    return word.slice(0, -3).replace(/([npt])\1$/, '$1');
  }
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('s')) return word.slice(0, -1);
  return word;
}

export function titleWords(title) {
  return String(title || '')
    .toLowerCase()
    .replaceAll(/[^a-z0-9]+/g, ' ')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .filter((word) => !FILLER_WORDS.has(word))
    .map(stem);
}

export function titlesOverlap(left, right) {
  const leftWords = titleWords(left);
  const rightWords = titleWords(right);
  if (!leftWords.length || !rightWords.length) return false;

  const leftKey = leftWords.join(' ');
  const rightKey = rightWords.join(' ');
  if (leftKey === rightKey || leftKey.includes(rightKey) || rightKey.includes(leftKey)) return true;

  const rightSet = new Set(rightWords);
  const shared = new Set(leftWords.filter((word) => rightSet.has(word))).size;
  const smaller = Math.min(new Set(leftWords).size, rightSet.size);
  const sameSpecificOpening = leftWords[0] === rightWords[0] && !GENERIC_OPENING_WORDS.has(leftWords[0]);
  return shared >= 2 || (shared === 1 && smaller === 1) || sameSpecificOpening;
}

export function repeatedTopicTitles(topics, recentTitles = []) {
  const accepted = [];
  const repeated = [];

  for (const topic of topics) {
    const references = [...recentTitles, ...accepted];
    if (references.some((title) => titlesOverlap(topic.title, title))) {
      repeated.push(topic.title);
    } else {
      accepted.push(topic.title);
    }
  }

  return repeated;
}
