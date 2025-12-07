"use client";

import { useEffect, useRef, useState } from "react";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: string;
  explanation?: string;
};

const topicOptions = [
  { value: "inwords", label: "In-words (1-800)" },
  { value: "draw-hands", label: "Draw hands to show time" },
  { value: "write-time", label: "Write/read the time" },
  { value: "mental-maths", label: "Mental maths" },
  { value: "fractions", label: "Fractions (whole, half, three quarters, one quarter, other simple fractions)" },
  { value: "even-odd", label: "Even and odd (identify/separate)" },
  { value: "fill-blanks", label: "Number fill in the blanks" },
  { value: "order", label: "Ascending & descending order" },
  { value: "dodging-table", label: "Dodging table (skip counting)" },
  { value: "comparison", label: "Greater than / smaller than" },
  { value: "multiply", label: "Multiplication of 2 digits by 1 digit" },
  { value: "circle-number", label: "Circle smallest / largest number" },
  { value: "borrowing", label: "2-digit borrowing subtraction" },
  { value: "addition", label: "2-digit addition" },
  { value: "mixed", label: "Mixed (mix of all topics)" }
] as const;

const gradeOptions = [
  { value: "kg", label: "KG" },
  { value: "1", label: "Grade 1" },
  { value: "2", label: "Grade 2" },
  { value: "3", label: "Grade 3" },
  { value: "4", label: "Grade 4" },
  { value: "5", label: "Grade 5" },
  { value: "6", label: "Grade 6" }
] as const;

type GradeValue = (typeof gradeOptions)[number]["value"];
type Difficulty = "easy" | "hard";

const difficultyByGrade: Record<GradeValue, Difficulty> = {
  kg: "easy",
  "1": "easy",
  "2": "easy",
  "3": "easy",
  "4": "hard",
  "5": "hard",
  "6": "hard"
};

const typeLabels: Record<string, string> = {
  inwords: "In-words",
  "draw-hands": "Draw hands",
  "write-time": "Write/read the time",
  "mental-maths": "Mental maths",
  fractions: "Fractions",
  "even-odd": "Even / odd",
  "fill-blanks": "Fill blanks",
  order: "Order",
  "dodging-table": "Dodging table",
  comparison: "Greater / smaller",
  multiply: "Multiplication",
  "circle-number": "Circle number",
  borrowing: "2-digit subtraction",
  addition: "2-digit addition",
  mixed: "Mixed topic"
};

const shuffle = <T,>(arr: T[]) => {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const useTonePlayer = () => {
  const audioCtxRef = useRef<AudioContext | null>(null);

  const playTone = (isCorrect: boolean) => {
    if (typeof window === "undefined") return;
    const AudioContextCtor =
      window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextCtor) return;
    const ctx = audioCtxRef.current ?? new AudioContextCtor();
    audioCtxRef.current = ctx;

    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = "triangle";
    oscillator.frequency.value = isCorrect ? 880 : 220;

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    oscillator.connect(gain).connect(ctx.destination);
    oscillator.start(now);
    oscillator.stop(now + 0.25);
  };

  return playTone;
};

export default function HomePage() {
  const [topic, setTopic] = useState((topicOptions[0] as typeof topicOptions[number]).value);
  const [grade, setGrade] = useState<GradeValue>("kg");
  const [studentName, setStudentName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [nameLocked, setNameLocked] = useState(false);
  const [nameError, setNameError] = useState("");

  const [questions, setQuestions] = useState<Question[]>([]);
  const [responses, setResponses] = useState<Record<string, { choice: string; isCorrect: boolean }>>({});
  const [score, setScore] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const playTone = useTonePlayer();

  useEffect(() => {
    const storedName = typeof window !== "undefined" ? localStorage.getItem("mathTutorName") : null;
    if (storedName) {
      setStudentName(storedName);
      setShowNamePrompt(false);
      setNameLocked(true);
    }
  }, []);

  const handleSaveName = () => {
    const trimmed = studentName.trim();
    if (!trimmed) {
      setNameError("Please enter your name to start.");
      return;
    }
    localStorage.setItem("mathTutorName", trimmed);
    setStudentName(trimmed);
    setShowNamePrompt(false);
    setNameLocked(true);
    setNameError("");
  };

  const handleGenerate = async () => {
    if (!studentName.trim()) {
      setShowNamePrompt(true);
      setNameError("Please enter your name to start.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResponses({});
    setScore(0);

    try {
      const response = await fetch("/api/generate-questions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ topic, grade })
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to reach the question generator");
      }
      const generated = (payload.questions ?? []) as Question[];
      const shuffled = generated.map((q) => ({
        ...q,
        options: shuffle(q.options)
      }));
      setQuestions(shuffled);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while generating questions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelect = (questionId: string, choice: string) => {
    if (responses[questionId]) return;
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    const isCorrect = choice === question.correctAnswer;
    setResponses((prev) => ({ ...prev, [questionId]: { choice, isCorrect } }));
    setScore((prev) => prev + (isCorrect ? 1 : 0));
    playTone(isCorrect);
  };

  const answeredCount = Object.keys(responses).length;
  const difficultyLabel = difficultyByGrade[grade] === "easy" ? "Easy" : "Hard";

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:py-16">
      <div className="w-full max-w-3xl space-y-8">
        <section className="rounded-3xl bg-white/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] ring-1 ring-white/10 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Mathematics Robo Tutor</p>
              <h1 className="mt-3 text-4xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Mathematics
              </h1>
              <p className="mt-3 text-base text-slate-300">
                Pick a topic, choose the grade (KG-6). The tutor will set the difficulty to easy or hard for you.
                Each question has four choices with one correct answer.
              </p>
            </div>
            <div className="flex items-center gap-3 text-sm text-slate-200">
              <span className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2">
                {studentName ? `👋 ${studentName}` : "👋 Student"}
              </span>
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-200">
              Topic
              <select
                className="mt-2 h-12 rounded-2xl border border-white/20 bg-slate-900/60 px-4 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
              >
                {topicOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </label>

            <label className="flex flex-col text-sm text-slate-200">
              Grade level
              <select
                className="mt-2 h-12 rounded-2xl border border-white/20 bg-slate-900/60 px-4 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                value={grade}
                onChange={(event) => setGrade(event.target.value as GradeValue)}
              >
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 text-xs text-slate-400">
                Difficulty set automatically: {difficultyLabel} for this grade.
              </span>
            </label>
          </div>

          {!nameLocked && (
            <div className="mt-4 flex items-center gap-3 rounded-2xl bg-slate-900/60 px-4 py-3 text-sm text-slate-100 ring-1 ring-white/10">
              <input
                className="h-11 flex-1 rounded-xl border border-white/10 bg-slate-950/70 px-3 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                placeholder="Enter student name"
                value={studentName}
                onChange={(event) => setStudentName(event.target.value)}
              />
              <button
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
                onClick={handleSaveName}
              >
                Save name
              </button>
            </div>
          )}

          <button
            className="mt-6 flex w-full items-center justify-center rounded-2xl bg-gradient-to-r from-indigo-500 to-fuchsia-500 px-5 py-3 text-base font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01] disabled:cursor-not-allowed disabled:opacity-60 sm:w-auto"
            onClick={handleGenerate}
            disabled={isLoading}
          >
            {isLoading ? "Generating questions..." : "Generate Questions"}
          </button>

          {error && (
            <div
              className="mt-4 rounded-2xl border border-red-400/80 bg-red-500/10 px-4 py-3 text-sm text-red-200"
              role="alert"
            >
              {error}
            </div>
          )}
        </section>

        <section className="rounded-3xl bg-white/5 p-6 shadow-[0_15px_55px_rgba(15,23,42,0.35)] ring-1 ring-white/10 backdrop-blur">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold text-white">Questions ({questions.length})</h2>
            <p className="text-sm text-slate-400">
              {gradeOptions.find((opt) => opt.value === grade)?.label} · {difficultyLabel}
            </p>
          </div>
          <div className="mt-2 flex items-center justify-between text-sm text-slate-300">
            <span>
              Student: {studentName || "Not set"} | Score: {score}/{questions.length || 10}
            </span>
            <span>
              Answered: {answeredCount}/{questions.length || 10}
            </span>
          </div>
          {questions.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">Generate a set of questions to begin practicing.</p>
          ) : (
            <div className="mt-6 space-y-5">
              {questions.map((item, index) => {
                const response = responses[item.id];
                return (
                  <article
                    key={item.id ?? `${index}-${item.question}`}
                    className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/40"
                  >
                    <p className="text-xs font-semibold uppercase tracking-[0.3em] text-slate-400">
                      {`Q${index + 1} · ${typeLabels[item.type] ?? item.type}`}
                    </p>
                    <p className="mt-3 text-lg font-medium text-white">{item.question}</p>

                    <div className="mt-4 grid gap-3 sm:grid-cols-2">
                      {item.options.map((option) => {
                        const isChosen = response?.choice === option;
                        const reveal = Boolean(response);
                        const isCorrectOption = reveal && option === item.correctAnswer;
                        const isWrongChoice = reveal && isChosen && !response?.isCorrect;

                        return (
                          <button
                            key={option}
                            className={`flex w-full items-center justify-between rounded-xl border px-4 py-3 text-left text-sm font-medium transition ${
                              isCorrectOption
                                ? "border-green-500/70 bg-green-500/10 text-green-200"
                                : isWrongChoice
                                  ? "border-red-400/70 bg-red-500/10 text-red-200"
                                  : "border-white/10 bg-slate-950/60 text-white hover:border-indigo-400/60 hover:bg-indigo-500/10"
                            } ${reveal ? "cursor-default" : "cursor-pointer"}`}
                            onClick={() => handleSelect(item.id, option)}
                            disabled={reveal}
                          >
                            <span className="flex-1">{option}</span>
                            {isCorrectOption && <span className="text-xs font-semibold uppercase">Correct</span>}
                            {isWrongChoice && <span className="text-xs font-semibold uppercase">Chosen</span>}
                          </button>
                        );
                      })}
                    </div>

                    {response && (
                      <div
                        className={`mt-3 rounded-xl px-4 py-3 text-sm ${
                          response.isCorrect
                            ? "border border-green-500/70 bg-green-500/10 text-green-100"
                            : "border border-orange-400/70 bg-orange-500/10 text-orange-100"
                        }`}
                      >
                        {response.isCorrect ? "Nice job! That is the correct answer." : `Good try. Correct answer: ${item.correctAnswer}.`}
                        {item.explanation && <span className="block text-xs text-slate-200/80">Why: {item.explanation}</span>}
                      </div>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </section>
        <footer className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 p-4 text-center text-xs text-slate-300 shadow-inner shadow-black/30 ring-1 ring-white/10 backdrop-blur-sm">
          <p>Powered by Master Sahub</p>
          <p className="text-xs tracking-wide text-slate-400">03458340669 · Muhammad Faisal Pirzada</p>
        </footer>
      </div>

      {showNamePrompt && !nameLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 px-4">
          <div className="w-full max-w-md rounded-2xl bg-slate-900 p-6 text-white shadow-2xl ring-1 ring-white/10">
            <h2 className="text-xl font-semibold">Welcome to Mathematics Robo Tutor</h2>
            <p className="mt-2 text-sm text-slate-300">Please enter your name to start practicing.</p>
            <input
              className="mt-4 w-full rounded-xl border border-white/10 bg-slate-950/70 px-3 py-3 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Student name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
            />
            {nameError && <p className="mt-2 text-xs text-red-300">{nameError}</p>}
            <div className="mt-4 flex justify-end gap-3">
              <button
                className="rounded-xl border border-white/15 px-4 py-2 text-sm text-slate-200 transition hover:border-white/30"
                onClick={() => setShowNamePrompt(false)}
              >
                Not now
              </button>
              <button
                className="rounded-xl bg-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
                onClick={handleSaveName}
              >
                Save & start
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}
