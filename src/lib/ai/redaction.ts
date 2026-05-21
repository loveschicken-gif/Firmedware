/**
 * Heuristic helpers for advisory checks before a future AI connector runs.
 * NOT guaranteed legal, privilege, or privacy compliance — firms must apply
 * their own policies and professional review.
 */

const EMAIL_RE =
  /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/gi;
const PHONE_RE =
  /\b(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
const EXTERNAL_LINK_RE =
  /\bhttps?:\/\/[^\s<>"']+|\b(?:drive\.google\.com|sharepoint\.com|1drv\.ms|dropbox\.com|box\.com)\/[^\s<>"']*/gi;
const LOCAL_PATH_RE =
  /(?:file:\/\/[^\s<>"']+|\\\\[^\s<>"']+|[A-Za-z]:\\[^\s<>"']+|\/(?:Users|home|var)\/[^\s<>"']+)/g;
const CLIENT_LABEL_RE =
  /\b(?:client|matter|ลูกความ|คดี)\s*[:#]?\s*[\w\u0E00-\u0E7F.-]+/gi;

export function detectPotentialClientIdentifiers(text: string): string[] {
  const hits = new Set<string>();
  for (const re of [EMAIL_RE, PHONE_RE, CLIENT_LABEL_RE]) {
    re.lastIndex = 0;
    for (const m of text.matchAll(re)) {
      if (m[0]) hits.add(m[0].slice(0, 120));
    }
  }
  return [...hits];
}

export function redactClientIdentifiers(text: string): string {
  let out = text;
  for (const re of [EMAIL_RE, PHONE_RE, CLIENT_LABEL_RE]) {
    re.lastIndex = 0;
    out = out.replace(re, "[REDACTED]");
  }
  return out;
}

export function detectExternalLinks(text: string): string[] {
  EXTERNAL_LINK_RE.lastIndex = 0;
  return [...new Set([...text.matchAll(EXTERNAL_LINK_RE)].map((m) => m[0]))];
}

export function detectLocalPaths(text: string): string[] {
  LOCAL_PATH_RE.lastIndex = 0;
  return [...new Set([...text.matchAll(LOCAL_PATH_RE)].map((m) => m[0]))];
}
