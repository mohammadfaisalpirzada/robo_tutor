import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

type GradeValue = "nursery" | "kg1" | "kg2" | "kg" | "1" | "2" | "3" | "4" | "5" | "6";
type LevelValue = "easy" | "medium" | "hard";

type TopicItem = { value: string; title: string; description: string };

const gradeTopics: Record<GradeValue, TopicItem[]> = {
  nursery: [
    { value: "nursery-counting-10", title: "Counting 1-10", description: "Count objects and numbers from 1 to 10." },
    { value: "nursery-shapes", title: "Basic shapes", description: "Identify circles, squares, and triangles." },
    { value: "nursery-colors", title: "Colors and sorting", description: "Sort and group by color and simple categories." },
    { value: "nursery-size", title: "Big vs small", description: "Compare simple sizes and quantities." }
  ],
  kg1: [
    { value: "kg1-count-20", title: "Counting 1-20", description: "Count and recognize numbers 1-20." },
    { value: "kg1-compare", title: "Comparing quantities", description: "More/less/same with objects up to 20." },
    { value: "kg1-patterns", title: "Simple patterns", description: "Continue and create AB/ABC patterns." },
    { value: "kg1-shapes", title: "2D shapes", description: "Name and find basic shapes in the environment." },
    { value: "kg1-position", title: "Position words", description: "Use in, on, under, above to describe position." },
    { value: "kg1-measure", title: "Compare size/weight", description: "Long/short, heavy/light, holds more/less." },
    { value: "kg1-add-sub", title: "Add/Subtract with objects", description: "Add or remove small sets with counters." }
  ],
  kg2: [
    { value: "kg2-count-50", title: "Counting 1-50", description: "Count, read, and write numbers to 50." },
    { value: "kg2-recognition", title: "Number recognition", description: "Identify and order numbers to 50." },
    { value: "kg2-compare", title: "Compare numbers", description: "Use greater/less/equal up to 50." },
    { value: "kg2-patterns", title: "Patterns", description: "Extend and build patterns with shapes and numbers." },
    { value: "kg2-shapes", title: "Shapes & position", description: "Identify 2D shapes and position words." },
    { value: "kg2-measure", title: "Length/weight/capacity", description: "Compare everyday objects by size or weight." },
    { value: "kg2-add-sub-objects", title: "Add/Subtract objects", description: "Add and subtract small quantities with visuals." }
  ],
  kg: [
    { value: "kg-count-20", title: "Counting 1-20", description: "Count objects and numbers from 1 to 20." },
    { value: "kg-recognition", title: "Number recognition", description: "Identify numbers 0-20 and their order." },
    { value: "kg-compare", title: "Comparing quantities", description: "Use more/less/equal for small sets." },
    { value: "kg-patterns", title: "Patterns", description: "Complete and create simple patterns." },
    { value: "kg-shapes", title: "Basic shapes", description: "Recognize 2D shapes and describe position words." },
    { value: "kg-measure", title: "Compare measures", description: "Compare length, weight, and capacity informally." },
    { value: "kg-add-sub", title: "Simple add/subtract", description: "Use objects to add or subtract small numbers." }
  ],
  "1": [
    { value: "g1-numbers-100", title: "Numbers 0-100", description: "Read, write, and order numbers to 100." },
    { value: "g1-place-value", title: "Place value (tens/ones)", description: "Understand tens and ones." },
    { value: "g1-skip", title: "Skip counting", description: "Count by 2s, 5s, 10s." },
    { value: "g1-compare", title: "Comparing numbers", description: "Use <, >, = up to 100." },
    { value: "g1-ordinal", title: "Ordinal numbers", description: "Use 1st through 10th." },
    { value: "g1-add-sub-20", title: "Add/Subtract within 20", description: "Basic facts within 20." },
    { value: "g1-add-sub-100", title: "Add/Subtract within 100", description: "No regrouping." },
    { value: "g1-word-problems", title: "Word problems", description: "Single-step addition/subtraction situations." },
    { value: "g1-time", title: "Time", description: "Tell time to hour/half-hour." },
    { value: "g1-money", title: "Money basics", description: "Identify simple coins/notes." },
    { value: "g1-measure", title: "Length/weight/capacity", description: "Intro comparisons and units." },
    { value: "g1-shapes", title: "2D & 3D shapes", description: "Name and sort shapes." },
    { value: "g1-symmetry", title: "Basic symmetry", description: "Identify simple lines of symmetry." }
  ],
  "2": [
    { value: "g2-numbers-1000", title: "Numbers to 1000", description: "Read, write, and order to 1000." },
    { value: "g2-place-value", title: "Place value (HTO)", description: "Hundreds, tens, ones." },
    { value: "g2-odd-even", title: "Odd and even", description: "Identify odd/even numbers." },
    { value: "g2-expanded-order", title: "Expanded form & ordering", description: "Expand and compare numbers." },
    { value: "g2-add-sub-regroup", title: "Add/Sub with regrouping", description: "Carry/borrow within 1000." },
    { value: "g2-multiply-tables", title: "Basic multiplication tables", description: "2,3,4,5,10 tables." },
    { value: "g2-division-sharing", title: "Early division", description: "Sharing and grouping." },
    { value: "g2-fractions", title: "Fractions", description: "1/2, 1/3, 1/4 basics." },
    { value: "g2-time-5min", title: "Time to 5 minutes", description: "Read clocks to nearest 5 minutes." },
    { value: "g2-measure", title: "Measurement", description: "cm, m, g, kg, ml, L." },
    { value: "g2-angles", title: "Angles intro", description: "Recognize corners and turns." },
    { value: "g2-graphs", title: "Pictographs & bar graphs", description: "Read simple graphs." }
  ],
  "3": [
    { value: "g3-numbers-10000", title: "Numbers to 10,000", description: "Read, write, round to 10s/100s." },
    { value: "g3-roman", title: "Roman numerals", description: "Basic Roman numerals." },
    { value: "g3-multiply-2x1", title: "Multiply 2-digit by 1-digit", description: "Structured multiplication." },
    { value: "g3-sub-borrow", title: "Long subtraction", description: "Subtraction with borrowing." },
    { value: "g3-division-1digit", title: "Division 2-3 digits", description: "Divide by 1 digit." },
    { value: "g3-fractions-eq", title: "Equivalent fractions", description: "Identify and compare fractions." },
    { value: "g3-fractions-compare", title: "Compare fractions", description: "Order and compare fractions." },
    { value: "g3-fraction-line", title: "Fraction number line", description: "Place fractions on a line." },
    { value: "g3-perimeter-area", title: "Perimeter & area", description: "Basics for rectangles." },
    { value: "g3-angles-types", title: "Types of angles", description: "Right, acute, obtuse basics." },
    { value: "g3-lines", title: "Parallel & perpendicular", description: "Identify line relationships." },
    { value: "g3-graphs", title: "Bar & tally graphs", description: "Read and create simple graphs." }
  ],
  "4": [
    { value: "g4-numbers-1m", title: "Numbers to 1,000,000", description: "Read, write, and compare." },
    { value: "g4-factors-multiples", title: "Factors & multiples", description: "Find factors and multiples." },
    { value: "g4-prime-composite", title: "Prime & composite", description: "Classify numbers." },
    { value: "g4-lcm-hcf", title: "LCM & HCF", description: "Least common multiple, highest common factor." },
    { value: "g4-multiply-2x2", title: "Multiply 2-digit by 2-digit", description: "Long multiplication." },
    { value: "g4-long-division", title: "Long division", description: "4-digit divided by 1-digit." },
    { value: "g4-fractions-like", title: "Fractions add/sub like", description: "Add/subtract like denominators." },
    { value: "g4-decimals", title: "Decimals tenths/hundredths", description: "Read and compare decimals." },
    { value: "g4-frac-decimal", title: "Fraction to decimal", description: "Convert simple fractions." },
    { value: "g4-area-perimeter", title: "Area & perimeter", description: "Rectangles and squares." },
    { value: "g4-polygons", title: "Triangles & quadrilaterals", description: "Classify shapes." },
    { value: "g4-coordinate", title: "Coordinate grid", description: "Plot points in first quadrant." },
    { value: "g4-line-graphs", title: "Line graphs", description: "Read and interpret line graphs." }
  ],
  "5": [
    { value: "g5-numbers-millions", title: "Numbers to millions", description: "Read, write, and round big numbers." },
    { value: "g5-decimals", title: "Decimals to thousandths", description: "Place value and rounding decimals." },
    { value: "g5-multiply-multi", title: "Multi-digit multiplication", description: "Larger products." },
    { value: "g5-long-division-2digit", title: "Long division 2-digit divisor", description: "Divide by 2-digit numbers." },
    { value: "g5-order-ops", title: "Order of operations", description: "BODMAS/PEMDAS basics." },
    { value: "g5-fractions-unlike", title: "Fractions unlike denoms", description: "Add/subtract unlike fractions." },
    { value: "g5-mixed-improper", title: "Mixed & improper", description: "Convert and operate." },
    { value: "g5-multiply-fractions", title: "Multiply fractions", description: "Products of fractions." },
    { value: "g5-percentages", title: "Percentages", description: "Basic percent calculations." },
    { value: "g5-geometry", title: "Area/perimeter composite", description: "Composite shapes and volume intro." },
    { value: "g5-coordinate", title: "Coordinate geometry", description: "First quadrant plotting." },
    { value: "g5-stats", title: "Mean/median/mode", description: "Basic statistics." },
    { value: "g5-probability", title: "Probability basics", description: "Simple chance events." }
  ],
  "6": [
    { value: "g6-integers", title: "Integers", description: "Order and operate with integers." },
    { value: "g6-rational", title: "Rational numbers", description: "Compare and operate with rationals." },
    { value: "g6-ratios", title: "Ratios & proportion", description: "Solve ratio problems." },
    { value: "g6-percent", title: "Percentages", description: "Increase/decrease and applications." },
    { value: "g6-algebra", title: "Algebraic expressions", description: "Simplify expressions." },
    { value: "g6-equations", title: "One-step equations", description: "Solve simple equations/inequalities." },
    { value: "g6-geometry", title: "Polygons & triangles", description: "Properties and angle sums." },
    { value: "g6-area", title: "Area triangles/parallelograms", description: "Compute areas." },
    { value: "g6-circles", title: "Circumference", description: "Circle basics." },
    { value: "g6-nets", title: "Nets of 3D shapes", description: "Visualize nets and solids." },
    { value: "g6-data", title: "Histograms & pie charts", description: "Read/interpret charts." },
    { value: "g6-probability", title: "Probability", description: "Simple probability events." },
    { value: "g6-sets", title: "Sets & Venn", description: "Basic set notation and Venn diagrams." }
  ]
};

const topicList = Array.from(
  new Set(
    Object.values(gradeTopics)
      .flat()
      .map((item) => item.value)
  )
);

const topicMetadata: Record<string, { title: string; description: string }> = Object.values(gradeTopics)
  .flat()
  .reduce((acc, item) => {
    acc[item.value] = { title: item.title, description: item.description };
    return acc;
  }, {} as Record<string, { title: string; description: string }>);

const levelGuidance: Record<LevelValue, string> = {
  easy: "Keep numbers small, use single-step problems, concrete language, visuals, and hands-on contexts.",
  medium: "Use a mix of single- and two-step problems with friendly borrow/carry and clear contexts.",
  hard: "Challenge students with multi-step thinking while staying age appropriate."
};

const gradeEnum = z.enum(["nursery", "kg1", "kg2", "kg", "1", "2", "3", "4", "5", "6"] as const);
const topicEnum = z.enum(topicList as [string, ...string[]]);

const requestSchema = z.object({
  topic: topicEnum,
  grade: gradeEnum
});

const questionSchema = z
  .object({
    id: z.string(),
    question: z.string(),
    options: z.array(z.string()).length(4),
    correctAnswer: z.string(),
    type: z.string(),
    explanation: z.string().optional()
  })
  .refine((value) => value.options.includes(value.correctAnswer), {
    message: "correctAnswer must be one of the options"
  });

const responseSchema = z.object({
  questions: z.array(questionSchema)
});

const getLevelForGrade = (grade: GradeValue): LevelValue => {
  if (grade === "4" || grade === "5" || grade === "6") return "hard";
  return "easy";
};

const gradeLabels: Record<GradeValue, string> = {
  nursery: "Nursery",
  kg1: "KG 1",
  kg2: "KG 2",
  kg: "KG",
  "1": "Grade 1",
  "2": "Grade 2",
  "3": "Grade 3",
  "4": "Grade 4",
  "5": "Grade 5",
  "6": "Grade 6"
};

const buildPrompt = (topic: string, grade: GradeValue) => {
  const topicInfo = topicMetadata[topic];
  const level = getLevelForGrade(grade);
  const levelHint = levelGuidance[level];
  const levelLabel = `${gradeLabels[grade]} (${level} difficulty)`;

  return `You are a math teacher. Create a ${level} set of questions for ${levelLabel} that keep students engaged and confident.
Topic title: ${topicInfo.title}
Topic details: ${topicInfo.description}
Difficulty guidance: ${levelHint}

Return exactly ten unique multiple-choice questions. Each question must be simple, supporting the chosen grade's reading and math skills. Number them implicitly with IDs "q1" through "q10".

The output must be only JSON using the schema below. Do not include any Markdown, explanations, or extra text. Provide four answer options per question, with exactly one correct answer that matches the "correctAnswer" field.
{
  "questions": [
    {
      "id": "q1",
      "question": "Question text with clear context.",
      "options": ["A", "B", "C", "D"],
      "correctAnswer": "A",
      "type": "${topic}",
      "explanation": "Optional short explanation on why the answer is correct."
    }
  ]
}

For the type field, keep the value "${topic}" so we know the chosen topic. Ensure exactly one correct answer per question, keep options concise, avoid repeating the correct answer text across multiple options, and do not always place the correct answer as the first option. Keep language child-friendly and age-appropriate for ${levelLabel}.
`;
};

const getApiKeys = () => {
  const keys = [
    process.env.GOOGLE_GENERATIVE_AI_API_KEY,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_2,
    process.env.GOOGLE_GENERATIVE_AI_API_KEY_ALT
  ].filter((key): key is string => Boolean(key));
  return keys;
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { topic, grade } = requestSchema.parse(json);

    const prompt = buildPrompt(topic, grade);

    const apiKeys = getApiKeys();
    if (apiKeys.length === 0) {
      throw new Error("Missing Google Generative AI API key");
    }

    let lastError: unknown = null;
    for (const apiKey of apiKeys) {
      try {
        const model = google("gemini-2.5-flash", { apiKey });

        const result = await generateObject({
          model,
          prompt,
          schema: responseSchema,
          schemaName: "mathQuestions",
          schemaDescription: "Ten grade-aligned multiple choice math questions",
          temperature: 0.34,
          topP: 0.92
        });

        const resultObject = result.object;
        const parsed = responseSchema.parse(resultObject);

        return NextResponse.json({ questions: parsed.questions });
      } catch (err) {
        lastError = err;
        // If we have another key, try the next one; otherwise rethrow after loop
        continue;
      }
    }

    throw lastError ?? new Error("Failed to generate questions");
  } catch (error) {
    console.error("Failed to generate questions", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
