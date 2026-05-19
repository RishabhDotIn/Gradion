/**
 * Coerce and whitelist assignment questions from the client (array or JSON string).
 * Strips unknown keys so Mongoose strict subdocs behave predictably.
 */
function coerceQuestionsInput(raw) {
  let arr = raw;
  if (typeof raw === "string") {
    try {
      arr = JSON.parse(raw);
    } catch {
      return [];
    }
  }
  if (!Array.isArray(arr)) return [];

  return arr.map((item, idx) => {
    const q = item && typeof item === "object" ? item : {};
    const rawCases = q.testCases;
    let cases = [];
    if (Array.isArray(rawCases)) {
      cases = rawCases.map((tc) => ({
        input: tc && tc.input != null ? String(tc.input) : "",
        output: tc && tc.output != null ? String(tc.output) : "",
      }));
    }
    if (!cases.length) {
      cases = [{ input: "", output: "" }];
    }

    const problemTitle = String(q.problemTitle ?? q.title ?? "").trim();
    let problemDescription = String(q.problemDescription ?? q.description ?? "").trim();
    const examples = q.examples != null ? String(q.examples) : "";
    if (!problemDescription && examples.trim()) {
      problemDescription = examples.trim();
    }
    const constraints = q.constraints != null ? String(q.constraints) : "";
    const starterCode = q.starterCode != null ? String(q.starterCode) : "";
    const language = String(q.language ?? "").trim().toLowerCase();

    return {
      problemTitle,
      problemDescription,
      constraints,
      examples,
      language,
      starterCode,
      testCases: cases,
    };
  });
}

/** Matches Create Assignment language dropdown + legacy data */
const ALLOWED_LANG = new Set(["java", "python", "cpp", "javascript", "plaintext"]);

function questionsAreComplete(questions) {
  if (!Array.isArray(questions) || questions.length === 0) return false;
  return questions.every((q) => {
    const title = String(q.problemTitle || "").trim();
    const desc = String(q.problemDescription || "").trim();
    const ex = String(q.examples || "").trim();
    const lang = String(q.language || "").trim().toLowerCase();
    const hasCase =
      Array.isArray(q.testCases) &&
      q.testCases.some((tc) => String(tc.input).trim().length > 0 && String(tc.output).trim().length > 0);
    const descOk = desc.length >= 5 || ex.length >= 5;
    return title.length >= 1 && descOk && ALLOWED_LANG.has(lang) && lang.length > 0 && hasCase;
  });
}

module.exports = {
  coerceQuestionsInput,
  questionsAreComplete,
};
