// Piccolo sanificatore HTML lato server: consente solo un set ristretto di tag e attributi sicuri.
// Non sostituisce librerie complete (es. DOMPurify), ma è conservativo.

const allowedTags = new Set(['b', 'strong', 'i', 'em', 'u', 'ul', 'ol', 'li', 'p', 'br', 'a']);
const allowedAttrs: Record<string, Set<string>> = { a: new Set(['href', 'target', 'rel']) };

export function sanitizeHtml(input: string): string {
  if (!input) return '';
  // Escape base
  let out = input
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // Riespansione dei tag permessi (molto conservativa)
  out = out.replace(/&lt;\/(\w+)&gt;/g, (m, tag) => allowedTags.has(tag.toLowerCase()) ? `</${tag.toLowerCase()}>` : '');
  out = out.replace(/&lt;(\w+)([^>]*)&gt;/g, (m, tag, attrs) => {
    const t = tag.toLowerCase();
    if (!allowedTags.has(t)) return '';
    let safeAttrs = '';
    if (attrs && allowedAttrs[t]) {
      for (const a of attrs.split(/\s+/).filter(Boolean)) {
        const [name, rawVal] = a.split('=');
        const n = (name || '').toLowerCase();
        if (!allowedAttrs[t].has(n)) continue;
        const v = (rawVal || '').replace(/^"|"$/g, '');
        // blocca javascript: e simili
        if (/^javascript:/i.test(v)) continue;
        safeAttrs += ` ${n}="${v}"`;
      }
    }
    return `<${t}${safeAttrs}>`;
  });
  return out;
}





