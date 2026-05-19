/**
 * Read Gemini env with trimming so .env mistakes (spaces, quotes, BOM) don't break the key.
 * Google returns API_KEY_INVALID for wrong key, restricted keys, or wrong product.
 */
function getGeminiConfig() {
  const raw = process.env.GEMINI_API_KEY;
  if (raw == null || String(raw).trim() === '') {
    return { apiKey: '', modelName: normalizeModelName(process.env.GEMINI_MODEL) };
  }
  let apiKey = String(raw).trim();
  // Strip wrapping quotes often pasted into .env by mistake
  if (
    (apiKey.startsWith('"') && apiKey.endsWith('"')) ||
    (apiKey.startsWith("'") && apiKey.endsWith("'"))
  ) {
    apiKey = apiKey.slice(1, -1).trim();
  }
  // Remove BOM / accidental whitespace (keys must be one continuous token)
  apiKey = apiKey.replace(/^\uFEFF/, '').replace(/\s/g, '');

  return {
    apiKey,
    modelName: normalizeModelName(process.env.GEMINI_MODEL),
  };
}

function normalizeModelName(name) {
  // Default to 2.5 Flash: on many free tiers "Gemini 3 Flash" RPD is tiny (e.g. 20/day) and exhausts quickly;
  // AI Studio often still shows separate headroom for Gemini 2.5 Flash. Override with GEMINI_MODEL anytime.
  const n = (name && String(name).trim()) || 'gemini-2.5-flash';
  return n;
}

/** Short hint when Google rejects the key (do not log the key itself). */
const GEMINI_KEY_HELP =
  'Check GEMINI_API_KEY in backend/.env (no spaces around =), use a key from https://aistudio.google.com/apikey, restart the server, and set API key restrictions to "None" or your server IP (not "HTTP referrers only" — that breaks Node.js).';

const GEMINI_QUOTA_HELP =
  'You hit a rate or daily quota (429). In AI Studio your RPD/RPM for this model may be full (e.g. Gemini 3 Flash 20/20). Set GEMINI_MODEL to a model that still has quota (often gemini-2.5-flash), wait until Pacific midnight for RPD reset, or enable billing. See https://ai.google.dev/gemini-api/docs/rate-limits';

function formatGeminiApiError(err) {
  const msg = err && err.message ? err.message : String(err);
  if (/API_KEY_INVALID|API key not valid|400 Bad Request.*API key/i.test(msg)) {
    return `${msg} ${GEMINI_KEY_HELP}`;
  }
  if (/429|Too Many Requests|quota|Quota exceeded|RESOURCE_EXHAUSTED/i.test(msg)) {
    return `${msg} ${GEMINI_QUOTA_HELP}`;
  }
  return msg;
}

module.exports = { getGeminiConfig, GEMINI_KEY_HELP, GEMINI_QUOTA_HELP, formatGeminiApiError };
