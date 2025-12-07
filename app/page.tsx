"use client";

import type { KeyboardEvent } from "react";
import { useEffect, useRef, useState } from "react";
import { FaVolumeUp } from "react-icons/fa";

type Question = {
  id: string;
  question: string;
  options: string[];
  correctAnswer: string;
  type: string;
  explanation?: string;
};

const gradeOptions = [
  { value: "nursery", label: "Nursery" },
  { value: "kg1", label: "KG 1" },
  { value: "kg2", label: "KG 2" },
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
  nursery: "easy",
  kg1: "easy",
  kg2: "easy",
  kg: "easy",
  "1": "easy",
  "2": "easy",
  "3": "easy",
  "4": "hard",
  "5": "hard",
  "6": "hard"
};

type TopicItem = { value: string; label: string; description: string };

const gradeTopics: Record<GradeValue, TopicItem[]> = {
  nursery: [
    { value: "nursery-counting-10", label: "Counting 1-10", description: "Count objects and numbers from 1 to 10." },
    { value: "nursery-shapes", label: "Basic shapes", description: "Identify circles, squares, and triangles." },
    { value: "nursery-colors", label: "Colors and sorting", description: "Sort and group by color and simple categories." },
    { value: "nursery-size", label: "Big vs small", description: "Compare simple sizes and quantities." }
  ],
  kg1: [
    { value: "kg1-count-20", label: "Counting 1-20", description: "Count and recognize numbers 1-20." },
    { value: "kg1-compare", label: "Comparing quantities", description: "More/less/same with objects up to 20." },
    { value: "kg1-patterns", label: "Simple patterns", description: "Continue and create AB/ABC patterns." },
    { value: "kg1-shapes", label: "2D shapes", description: "Name and find basic shapes in the environment." },
    { value: "kg1-position", label: "Position words", description: "Use in, on, under, above to describe position." },
    { value: "kg1-measure", label: "Compare size/weight", description: "Long/short, heavy/light, holds more/less." },
    { value: "kg1-add-sub", label: "Add/Subtract with objects", description: "Add or remove small sets with counters." }
  ],
  kg2: [
    { value: "kg2-count-50", label: "Counting 1-50", description: "Count, read, and write numbers to 50." },
    { value: "kg2-recognition", label: "Number recognition", description: "Identify and order numbers to 50." },
    { value: "kg2-compare", label: "Compare numbers", description: "Use greater/less/equal up to 50." },
    { value: "kg2-patterns", label: "Patterns", description: "Extend and build patterns with shapes and numbers." },
    { value: "kg2-shapes", label: "Shapes & position", description: "Identify 2D shapes and position words." },
    { value: "kg2-measure", label: "Length/weight/capacity", description: "Compare everyday objects by size or weight." },
    { value: "kg2-add-sub-objects", label: "Add/Subtract objects", description: "Add and subtract small quantities with visuals." }
  ],
  kg: [
    { value: "kg-count-20", label: "Counting 1-20", description: "Count objects and numbers from 1 to 20." },
    { value: "kg-recognition", label: "Number recognition", description: "Identify numbers 0-20 and their order." },
    { value: "kg-compare", label: "Comparing quantities", description: "Use more/less/equal for small sets." },
    { value: "kg-patterns", label: "Patterns", description: "Complete and create simple patterns." },
    { value: "kg-shapes", label: "Basic shapes", description: "Recognize 2D shapes and describe position words." },
    { value: "kg-measure", label: "Compare measures", description: "Compare length, weight, and capacity informally." },
    { value: "kg-add-sub", label: "Simple add/subtract", description: "Use objects to add or subtract small numbers." }
  ],
  "1": [
    { value: "g1-numbers-100", label: "Numbers 0-100", description: "Read, write, and order numbers to 100." },
    { value: "g1-place-value", label: "Place value (tens/ones)", description: "Understand tens and ones." },
    { value: "g1-skip", label: "Skip counting", description: "Count by 2s, 5s, 10s." },
    { value: "g1-compare", label: "Comparing numbers", description: "Use <, >, = up to 100." },
    { value: "g1-ordinal", label: "Ordinal numbers", description: "Use 1st through 10th." },
    { value: "g1-add-sub-20", label: "Add/Subtract within 20", description: "Basic facts within 20." },
    { value: "g1-add-sub-100", label: "Add/Subtract within 100", description: "No regrouping." },
    { value: "g1-word-problems", label: "Word problems", description: "Single-step addition/subtraction situations." },
    { value: "g1-time", label: "Time", description: "Tell time to hour/half-hour." },
    { value: "g1-money", label: "Money basics", description: "Identify simple coins/notes." },
    { value: "g1-measure", label: "Length/weight/capacity", description: "Intro comparisons and units." },
    { value: "g1-shapes", label: "2D & 3D shapes", description: "Name and sort shapes." },
    { value: "g1-symmetry", label: "Basic symmetry", description: "Identify simple lines of symmetry." }
  ],
  "2": [
    { value: "g2-numbers-1000", label: "Numbers to 1000", description: "Read, write, and order to 1000." },
    { value: "g2-place-value", label: "Place value (HTO)", description: "Hundreds, tens, ones." },
    { value: "g2-odd-even", label: "Odd and even", description: "Identify odd/even numbers." },
    { value: "g2-expanded-order", label: "Expanded form & ordering", description: "Expand and compare numbers." },
    { value: "g2-add-sub-regroup", label: "Add/Sub with regrouping", description: "Carry/borrow within 1000." },
    { value: "g2-multiply-tables", label: "Basic multiplication tables", description: "2,3,4,5,10 tables." },
    { value: "g2-division-sharing", label: "Early division", description: "Sharing and grouping." },
    { value: "g2-fractions", label: "Fractions", description: "1/2, 1/3, 1/4 basics." },
    { value: "g2-time-5min", label: "Time to 5 minutes", description: "Read clocks to nearest 5 minutes." },
    { value: "g2-measure", label: "Measurement", description: "cm, m, g, kg, ml, L." },
    { value: "g2-angles", label: "Angles intro", description: "Recognize corners and turns." },
    { value: "g2-graphs", label: "Pictographs & bar graphs", description: "Read simple graphs." }
  ],
  "3": [
    { value: "g3-numbers-10000", label: "Numbers to 10,000", description: "Read, write, round to 10s/100s." },
    { value: "g3-roman", label: "Roman numerals", description: "Basic Roman numerals." },
    { value: "g3-multiply-2x1", label: "Multiply 2-digit by 1-digit", description: "Structured multiplication." },
    { value: "g3-sub-borrow", label: "Long subtraction", description: "Subtraction with borrowing." },
    { value: "g3-division-1digit", label: "Division 2-3 digits", description: "Divide by 1 digit." },
    { value: "g3-fractions-eq", label: "Equivalent fractions", description: "Identify and compare fractions." },
    { value: "g3-fractions-compare", label: "Compare fractions", description: "Order and compare fractions." },
    { value: "g3-fraction-line", label: "Fraction number line", description: "Place fractions on a line." },
    { value: "g3-perimeter-area", label: "Perimeter & area", description: "Basics for rectangles." },
    { value: "g3-angles-types", label: "Types of angles", description: "Right, acute, obtuse basics." },
    { value: "g3-lines", label: "Parallel & perpendicular", description: "Identify line relationships." },
    { value: "g3-graphs", label: "Bar & tally graphs", description: "Read and create simple graphs." }
  ],
  "4": [
    { value: "g4-numbers-1m", label: "Numbers to 1,000,000", description: "Read, write, and compare." },
    { value: "g4-factors-multiples", label: "Factors & multiples", description: "Find factors and multiples." },
    { value: "g4-prime-composite", label: "Prime & composite", description: "Classify numbers." },
    { value: "g4-lcm-hcf", label: "LCM & HCF", description: "Least common multiple, highest common factor." },
    { value: "g4-multiply-2x2", label: "Multiply 2-digit by 2-digit", description: "Long multiplication." },
    { value: "g4-long-division", label: "Long division", description: "4-digit divided by 1-digit." },
    { value: "g4-fractions-like", label: "Fractions add/sub like", description: "Add/subtract like denominators." },
    { value: "g4-decimals", label: "Decimals tenths/hundredths", description: "Read and compare decimals." },
    { value: "g4-frac-decimal", label: "Fraction to decimal", description: "Convert simple fractions." },
    { value: "g4-area-perimeter", label: "Area & perimeter", description: "Rectangles and squares." },
    { value: "g4-polygons", label: "Triangles & quadrilaterals", description: "Classify shapes." },
    { value: "g4-coordinate", label: "Coordinate grid", description: "Plot points in first quadrant." },
    { value: "g4-line-graphs", label: "Line graphs", description: "Read and interpret line graphs." }
  ],
  "5": [
    { value: "g5-numbers-millions", label: "Numbers to millions", description: "Read, write, and round big numbers." },
    { value: "g5-decimals", label: "Decimals to thousandths", description: "Place value and rounding decimals." },
    { value: "g5-multiply-multi", label: "Multi-digit multiplication", description: "Larger products." },
    { value: "g5-long-division-2digit", label: "Long division 2-digit divisor", description: "Divide by 2-digit numbers." },
    { value: "g5-order-ops", label: "Order of operations", description: "BODMAS/PEMDAS basics." },
    { value: "g5-fractions-unlike", label: "Fractions unlike denoms", description: "Add/subtract unlike fractions." },
    { value: "g5-mixed-improper", label: "Mixed & improper", description: "Convert and operate." },
    { value: "g5-multiply-fractions", label: "Multiply fractions", description: "Products of fractions." },
    { value: "g5-percentages", label: "Percentages", description: "Basic percent calculations." },
    { value: "g5-geometry", label: "Area/perimeter composite", description: "Composite shapes and volume intro." },
    { value: "g5-coordinate", label: "Coordinate geometry", description: "First quadrant plotting." },
    { value: "g5-stats", label: "Mean/median/mode", description: "Basic statistics." },
    { value: "g5-probability", label: "Probability basics", description: "Simple chance events." }
  ],
  "6": [
    { value: "g6-integers", label: "Integers", description: "Order and operate with integers." },
    { value: "g6-rational", label: "Rational numbers", description: "Compare and operate with rationals." },
    { value: "g6-ratios", label: "Ratios & proportion", description: "Solve ratio problems." },
    { value: "g6-percent", label: "Percentages", description: "Increase/decrease and applications." },
    { value: "g6-algebra", label: "Algebraic expressions", description: "Simplify expressions." },
    { value: "g6-equations", label: "One-step equations", description: "Solve simple equations/inequalities." },
    { value: "g6-geometry", label: "Polygons & triangles", description: "Properties and angle sums." },
    { value: "g6-area", label: "Area triangles/parallelograms", description: "Compute areas." },
    { value: "g6-circles", label: "Circumference", description: "Circle basics." },
    { value: "g6-nets", label: "Nets of 3D shapes", description: "Visualize nets and solids." },
    { value: "g6-data", label: "Histograms & pie charts", description: "Read/interpret charts." },
    { value: "g6-probability", label: "Probability", description: "Simple probability events." },
    { value: "g6-sets", label: "Sets & Venn", description: "Basic set notation and Venn diagrams." }
  ]
};

const typeLabels: Record<string, string> = Object.fromEntries(
  Object.values(gradeTopics)
    .flat()
    .map((t) => [t.value, t.label])
);

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
  const speechRef = useRef<SpeechSynthesisUtterance | null>(null);

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

  const speak = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.95;
    utterance.pitch = 1.05;
    speechRef.current = utterance;
    window.speechSynthesis.speak(utterance);
  };

  return { playTone, speak };
};

export default function HomePage() {
  const [topic, setTopic] = useState<string>("");
  const [grade, setGrade] = useState<GradeValue | "">("");
  const [studentName, setStudentName] = useState("");
  const [showNamePrompt, setShowNamePrompt] = useState(true);
  const [nameLocked, setNameLocked] = useState(false);
  const [nameError, setNameError] = useState("");
  const [showNameMenu, setShowNameMenu] = useState(false);
  const [showFarewell, setShowFarewell] = useState(false);

  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [activeQuestion, setActiveQuestion] = useState<Question | null>(null);
  const [responses, setResponses] = useState<Record<string, { choice: string; isCorrect: boolean }>>({});
  const [score, setScore] = useState(0);
  const [totalCorrect, setTotalCorrect] = useState(0);
  const [totalAttempts, setTotalAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const { playTone, speak } = useTonePlayer();

  useEffect(() => {
    const storedName = typeof window !== "undefined" ? localStorage.getItem("mathTutorName") : null;
    if (storedName) {
      setStudentName(storedName);
      setShowNamePrompt(false);
      setNameLocked(true);
    }
  }, []);

  useEffect(() => {
    if (grade) {
      const firstTopic = gradeTopics[grade]?.[0]?.value ?? "";
      setTopic(firstTopic);
    } else {
      setTopic("");
    }
  }, [grade]);

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

  const handleNameKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      handleSaveName();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem("mathTutorName");
    setStudentName("");
    setNameLocked(false);
    setShowNamePrompt(false);
    setShowNameMenu(false);
    setShowFarewell(true);
    setResponses({});
    setQuestions([]);
    setScore(0);
  };

  const handleBackFromFarewell = () => {
    setShowFarewell(false);
    setShowNamePrompt(true);
  };

  const handleGenerate = async () => {
    if (!studentName.trim()) {
      setShowNamePrompt(true);
      setNameError("Please enter your name to start.");
      return;
    }
    if (!grade) {
      setError("Please select a grade level first.");
      return;
    }
    if (!topic) {
      setError("Please pick a topic for this grade.");
      return;
    }

    setError("");
    setIsLoading(true);
    setResponses({});
    setScore(0);
    setShowCompletion(false);
    setCurrentIndex(0);
    setActiveQuestion(null);
    setShowFeedback(false);

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
      setCurrentIndex(0);
      setActiveQuestion(shuffled[0] ?? null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Something went wrong while generating questions.";
      setError(message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setActiveQuestion(questions[currentIndex] ?? null);
    if (questions.length === 0) {
      setShowCompletion(false);
    }
  }, [currentIndex, questions]);

  const handleSelect = (questionId: string, choice: string) => {
    if (responses[questionId]) return;
    const question = questions.find((item) => item.id === questionId);
    if (!question) return;
    const isCorrect = choice === question.correctAnswer;
    setResponses((prev) => ({ ...prev, [questionId]: { choice, isCorrect } }));
    setScore((prev) => prev + (isCorrect ? 1 : 0));
    setTotalCorrect((prev) => prev + (isCorrect ? 1 : 0));
    setTotalAttempts((prev) => prev + 1);
    setShowFeedback(true);
    playTone(isCorrect);

    const delay = isCorrect ? 1100 : 1700;
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < questions.length) {
        setCurrentIndex(nextIndex);
        setShowFeedback(false);
      } else {
        setShowCompletion(true);
        setShowFeedback(false);
      }
    }, delay);
  };

  const answeredCount = Object.keys(responses).length;
  const difficultyLabel = grade ? (difficultyByGrade[grade] === "easy" ? "Easy" : "Hard") : "Easy";
  const availableTopics = grade ? gradeTopics[grade] ?? [] : [];

  return (
    <main className="flex min-h-screen w-full flex-col items-center justify-start overflow-x-hidden px-4 py-6 sm:px-6 sm:py-10">
      <div className="w-full max-w-2xl space-y-6 sm:space-y-8">
        <section className="rounded-3xl bg-white/5 p-6 shadow-[0_20px_60px_rgba(15,23,42,0.45)] ring-1 ring-white/10 backdrop-blur">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm uppercase tracking-[0.3em] text-indigo-300">Mathematics Robo Tutor</p>
              <h1 className="mt-3 text-3xl font-semibold leading-tight text-white sm:text-5xl lg:text-6xl">
                Mathematics
              </h1>
              <p className="mt-3 text-sm text-slate-300 sm:text-base">
                Pick a topic, choose the grade (KG-6). The tutor will set the difficulty to easy or hard for you.
                Each question has four choices with one correct answer.
              </p>
            </div>
            <div className="relative flex items-center gap-3 text-sm text-slate-200">
              <button
                className="rounded-xl border border-white/10 bg-slate-900/70 px-3 py-2 transition hover:border-indigo-400/50"
                onClick={() => setShowNameMenu((prev) => !prev)}
              >
                {studentName ? `Hi ${studentName}` : "Hi Student"}
              </button>
              {showNameMenu && (
                <div className="absolute right-0 top-12 z-20 w-40 rounded-xl border border-white/10 bg-slate-900/90 p-2 text-left shadow-xl">
                  {studentName && (
                    <p className="px-2 py-1 text-xs text-slate-300">Signed in as</p>
                  )}
                  {studentName && (
                    <div className="px-2 pb-2 text-sm font-semibold text-white">{studentName}</div>
                  )}
                  <button
                    className="w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-200 transition hover:bg-red-500/10"
                    onClick={handleLogout}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </div>

          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <label className="flex flex-col text-sm text-slate-200">
              Grade level
              <select
                className="mt-2 h-12 rounded-2xl border border-white/20 bg-slate-900/60 px-4 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
                value={grade}
                onChange={(event) => setGrade(event.target.value as GradeValue)}
              >
                <option value="">Select a grade</option>
                {gradeOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
              <span className="mt-1 text-xs text-slate-400">
                Difficulty set automatically: {grade ? difficultyLabel : "pick a grade"} for this grade.
              </span>
            </label>

            <label className="flex flex-col text-sm text-slate-200">
              Topic
              <select
                className="mt-2 h-12 rounded-2xl border border-white/20 bg-slate-900/60 px-4 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40 disabled:opacity-60"
                value={topic}
                onChange={(event) => setTopic(event.target.value)}
                disabled={!grade}
              >
                {!grade && <option value="">Select a grade first</option>}
                {grade &&
                  availableTopics.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
              </select>
              <span className="mt-1 text-xs text-slate-400">
                Topics update automatically based on grade.
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
                onKeyDown={handleNameKeyDown}
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
            disabled={isLoading || !grade || !topic}
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
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <h2 className="text-2xl font-semibold text-white">Questions ({questions.length})</h2>
            <p className="text-sm text-slate-400">
              {gradeOptions.find((opt) => opt.value === grade)?.label} - {difficultyLabel}
            </p>
          </div>
          <div className="mt-2 flex flex-col gap-2 text-sm text-slate-300 sm:flex-row sm:items-center sm:justify-between">
            <span className="flex flex-wrap gap-2">
              <span className="font-semibold text-white">Student:</span> {studentName || "Not set"}
              <span className="text-slate-400">| Score:</span> {score}/{questions.length || 10}
            </span>
            <span>
              Answered: {answeredCount}/{questions.length || 10}
            </span>
          </div>
          <div className="mt-4 space-y-2">
            <p className="text-xs uppercase tracking-[0.3em] text-slate-400">Progress</p>
            <div className="flex items-center gap-2">
              <div className="relative h-3 flex-1 overflow-hidden rounded-full bg-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-green-400 to-indigo-500 transition-all"
                  style={{
                    width: `${questions.length ? Math.round((answeredCount / questions.length) * 100) : 0}%`
                  }}
                />
              </div>
              <span className="text-xs text-slate-200">
                {answeredCount}/{questions.length || 10}
              </span>
            </div>
            <div className="grid grid-cols-10 gap-1 rounded-xl bg-slate-900/60 p-2">
              {Array.from({ length: questions.length || 10 }).map((_, idx) => {
                const q = questions[idx];
                const resp = q ? responses[q.id] : null;
                const state = resp ? (resp.isCorrect ? "correct" : "wrong") : idx < answeredCount ? "pending" : "idle";
                const color =
                  state === "correct" ? "bg-green-400" : state === "wrong" ? "bg-red-400" : state === "pending" ? "bg-yellow-300" : "bg-slate-700";
                return <div key={idx} className={`h-2 rounded ${color}`} />;
              })}
            </div>
            <p className="text-xs text-slate-400">
              Lifetime: {totalCorrect}/{totalAttempts || 1} correct ({totalAttempts ? Math.round((totalCorrect / totalAttempts) * 100) : 0}%)
            </p>
          </div>
          {questions.length === 0 ? (
            <p className="mt-6 text-sm text-slate-400">Generate a set of questions to begin practicing.</p>
          ) : showCompletion ? (
            <div className="mt-6 space-y-4">
              <div className="rounded-2xl border border-white/10 bg-slate-900/60 p-5 text-white shadow-inner shadow-black/40">
                <h3 className="text-lg font-semibold">Great work!</h3>
                <p className="mt-2 text-sm text-slate-200">
                  You answered {score} out of {questions.length} correctly.
                </p>
                <div className="mt-3 text-sm text-slate-300">
                  <p className="font-semibold text-white">Correct answers:</p>
                  <ul className="mt-2 space-y-2">
                    {questions.map((q) => (
                      <li key={q.id} className="rounded-lg bg-slate-800/80 px-3 py-2 text-xs sm:text-sm">
                        <span className="font-semibold text-indigo-200">{q.question}</span>
                        <span className="text-slate-300"> --- {q.correctAnswer}</span>
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                  <button
                    className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-slate-100 transition hover:border-white/40"
                    onClick={() => {
                      const ratio = questions.length ? score / questions.length : 0;
                      const gradeOrder = ["nursery", "kg1", "kg2", "kg", "1", "2", "3", "4", "5", "6"] as const;
                      const currentIdx = grade ? gradeOrder.indexOf(grade as GradeValue) : 0;
                      const nextIdx =
                        ratio >= 0.8 ? Math.min(Math.max(currentIdx, 0) + 1, gradeOrder.length - 1) : Math.max(currentIdx, 0);
                      setGrade(gradeOrder[nextIdx]);
                      setShowCompletion(false);
                      handleGenerate();
                    }}
                  >
                    Start again
                  </button>
                  <button
                    className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
                    onClick={() => {
                      if (!grade) return;
                      const topics = gradeTopics[grade] ?? [];
                      const currentIdx = topics.findIndex((t) => t.value === topic);
                      const nextTopicIdx = currentIdx >= 0 ? (currentIdx + 1) % topics.length : 0;
                      const nextTopic = topics[nextTopicIdx]?.value ?? topic;
                      setTopic(nextTopic);
                      setShowCompletion(false);
                      handleGenerate();
                    }}
                  >
                    Practice next topic
                  </button>
                </div>
              </div>
            </div>
          ) : activeQuestion ? (
            <div className="mt-6 space-y-3">
              <div className="flex items-center justify-between text-xs uppercase tracking-[0.3em] text-slate-400">
                <span>{`Q${currentIndex + 1} of ${questions.length}`}</span>
                <span>{typeLabels[activeQuestion.type] ?? activeQuestion.type}</span>
              </div>
              <article className="rounded-2xl border border-white/10 bg-slate-900/50 p-5 shadow-xl shadow-black/40">
                <div className="flex items-start justify-between gap-3">
                  <p className="text-lg font-medium text-white">{activeQuestion.question}</p>
                  <button
                    className="ml-2 shrink-0 rounded-full border border-white/20 bg-slate-800/60 p-2 text-xs text-white transition hover:border-indigo-400 hover:text-indigo-200"
                    onClick={() => speak(activeQuestion.question)}
                    aria-label="Play question audio"
                  >
                    <FaVolumeUp className="h-4 w-4" />
                  </button>
                </div>
                <div className="mt-4 grid gap-3 sm:grid-cols-2">
                  {activeQuestion.options.map((option) => {
                    const response = responses[activeQuestion.id];
                    const isChosen = response?.choice === option;
                    const reveal = Boolean(response);
                    const isCorrectOption = reveal && option === activeQuestion.correctAnswer;
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
                        onClick={() => handleSelect(activeQuestion.id, option)}
                        disabled={reveal}
                      >
                        <span className="flex-1">{option}</span>
                        {isCorrectOption && <span className="text-xs font-semibold uppercase">Correct</span>}
                        {isWrongChoice && <span className="text-xs font-semibold uppercase">Chosen</span>}
                      </button>
                    );
                  })}
                </div>

                {responses[activeQuestion.id] && (
                  <div
                    className={`mt-3 rounded-xl px-4 py-3 text-sm ${
                      responses[activeQuestion.id]?.isCorrect
                        ? "border border-green-500/70 bg-green-500/10 text-green-100"
                        : "border border-orange-400/70 bg-orange-500/10 text-orange-100"
                    }`}
                  >
                    {responses[activeQuestion.id]?.isCorrect
                      ? "Nice job! That is the correct answer."
                      : `Good try. Correct answer: ${activeQuestion.correctAnswer}.`}
                    {activeQuestion.explanation && (
                      <span className="block text-xs text-slate-200/80">Why: {activeQuestion.explanation}</span>
                    )}
                  </div>
                )}
              </article>
            {showFeedback && <p className="text-center text-xs text-slate-400">Moving to the next question...</p>}
          </div>
        ) : (
          <p className="mt-6 text-sm text-slate-400">All questions completed.</p>
        )}
      </section>
        <footer className="flex flex-col items-center justify-center gap-1 rounded-2xl bg-white/5 p-4 text-center text-xs text-slate-300 shadow-inner shadow-black/30 ring-1 ring-white/10 backdrop-blur-sm">
          <p>Powered by Master Sahub</p>
          <p className="text-xs tracking-wide text-slate-400">03458340669 - Muhammad Faisal Pirzada</p>
        </footer>
      </div>

      {showNamePrompt && !nameLocked && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/75 px-4">
          <div className="w-full max-w-md rounded-3xl bg-slate-900 p-6 text-white shadow-2xl ring-1 ring-white/10 sm:p-7">
            <h2 className="text-2xl font-semibold">Welcome to Mathematics Robo Tutor</h2>
            <p className="mt-2 text-base text-slate-200">Please enter your name to start practicing.</p>
            <input
              className="mt-4 w-full rounded-xl border border-white/15 bg-slate-950/80 px-4 py-3 text-base text-white outline-none transition focus:border-indigo-400 focus:ring-2 focus:ring-indigo-500/40"
              placeholder="Student name"
              value={studentName}
              onChange={(event) => setStudentName(event.target.value)}
              onKeyDown={handleNameKeyDown}
            />
            {nameError && <p className="mt-2 text-sm text-red-300">{nameError}</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-slate-200 transition hover:border-white/40"
                onClick={() => setShowNamePrompt(false)}
              >
                Not now
              </button>
              <button
                className="rounded-xl bg-indigo-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-indigo-900/40 transition hover:scale-[1.01]"
                onClick={handleSaveName}
              >
                Save & start
              </button>
            </div>
          </div>
        </div>
      )}

      {showFarewell && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-gradient-to-br from-indigo-900 via-slate-950 to-fuchsia-900 px-4 pt-10 sm:items-center">
          <div className="w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-3xl border border-white/15 bg-white/10 p-6 text-white shadow-[0_30px_90px_rgba(0,0,0,0.5)] backdrop-blur sm:max-w-2xl sm:p-8">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-indigo-200">See you soon</p>
                <h2 className="mt-2 text-3xl font-bold sm:text-4xl">Thank you for learning today!</h2>
                <p className="mt-3 text-base text-slate-100">
                  Mathematics is the music of reason - every problem you solve is a note in your own masterpiece.
                </p>
              </div>
              <div className="mt-2 flex flex-col gap-2 text-left text-sm text-slate-100 sm:mt-0 sm:text-right">
                <span className="rounded-xl bg-white/10 px-3 py-2 font-semibold">Stay curious. Keep counting.</span>
                <span className="rounded-xl bg-white/10 px-3 py-2 font-semibold">We will be ready when you return.</span>
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                className="rounded-xl border border-white/20 px-4 py-2 text-sm font-semibold text-white transition hover:border-white/40"
                onClick={handleBackFromFarewell}
              >
                Back to start
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}








