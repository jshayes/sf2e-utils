type Enricher = (typeof CONFIG.TextEditor.enrichers)[0];

function find(pattern: RegExp) {
  const i = CONFIG.TextEditor.enrichers.findIndex((x) => {
    return x.pattern === pattern;
  });
  if (i === -1) {
    return null;
  }

  return { index: i, enricher: CONFIG.TextEditor.enrichers[i] };
}

export function registerEnricher(enricher: Enricher) {
  if (!find(enricher.pattern)) {
    CONFIG.TextEditor.enrichers.push(enricher);
  }
}

export function unregisterEnricher(pattern: RegExp) {
  CONFIG.TextEditor.enrichers = CONFIG.TextEditor.enrichers.filter(
    (x) => x.pattern !== pattern,
  );
}
