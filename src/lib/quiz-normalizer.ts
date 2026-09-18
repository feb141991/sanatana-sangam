export interface NormalizedQuiz {
  question: string;
  options: string[];
  answerIndex: number;
  explanation: string;
  fact: string;
  source: string;
}

export function normalizeQuizPayload(rawQuiz: any): NormalizedQuiz | null {
  if (!rawQuiz || typeof rawQuiz !== "object") return null;

  const question = typeof rawQuiz.question === "string" ? rawQuiz.question.trim() : "";
  if (!question) return null;

  let options: string[] = [];
  if (Array.isArray(rawQuiz.options)) {
    options = rawQuiz.options
      .map((opt: any) => (typeof opt === "string" ? opt.trim() : String(opt || "").trim()))
      .filter(Boolean);
  } else if (rawQuiz.options && typeof rawQuiz.options === "object") {
    options = Object.values(rawQuiz.options)
      .map((opt: any) => (typeof opt === "string" ? opt.trim() : String(opt || "").trim()))
      .filter(Boolean);
  }

  if (options.length < 4) return null;
  if (options.length > 4) options = options.slice(0, 4);

  const rawIdx =
    rawQuiz.answerIndex ??
    rawQuiz.answer_index ??
    rawQuiz.correctIndex ??
    rawQuiz.correct_index ??
    rawQuiz.answer;

  let answerIndex: number | null = null;
  if (typeof rawIdx === "number" && Number.isInteger(rawIdx)) {
    if (rawIdx >= 0 && rawIdx <= 3) {
      answerIndex = rawIdx;
    } else if (rawIdx === 4) {
      answerIndex = 3;
    }
  } else if (typeof rawIdx === "string") {
    const s = rawIdx.trim().toUpperCase();
    if (["0", "1", "2", "3"].includes(s)) {
      answerIndex = parseInt(s, 10);
    } else if (["A", "B", "C", "D"].includes(s)) {
      answerIndex = ({ A: 0, B: 1, C: 2, D: 3 })[s]!;
    } else if (s === "4") {
      answerIndex = 3;
    }
  }

  if (answerIndex === null || answerIndex < 0 || answerIndex > 3) {
    return null;
  }

  return {
    question,
    options,
    answerIndex,
    explanation: typeof rawQuiz.explanation === "string" ? rawQuiz.explanation.trim() : "",
    fact: typeof rawQuiz.fact === "string" ? rawQuiz.fact.trim() : "",
    source: typeof rawQuiz.source === "string" ? rawQuiz.source.trim() : "",
  };
}
