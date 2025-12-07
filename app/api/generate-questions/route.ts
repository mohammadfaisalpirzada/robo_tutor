import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "edge";

const topicValues = [
  "inwords",
  "draw-hands",
  "write-time",
  "mental-maths",
  "fractions",
  "even-odd",
  "fill-blanks",
  "order",
  "dodging-table",
  "comparison",
  "multiply",
  "circle-number",
  "borrowing",
  "addition",
  "mixed"
] as const;

type TopicValue = (typeof topicValues)[number];

const gradeValues = ["kg", "1", "2", "3", "4", "5", "6"] as const;
type GradeValue = (typeof gradeValues)[number];

type LevelValue = "easy" | "medium" | "hard";

const topicMetadata: Record<
  TopicValue,
  { title: string; description: string }
> = {
  inwords: {
    title: "In-words (1–800)",
    description:
      "Write numbers between 1 and 800 in words, paying attention to hundreds, tens, and ones."
  },
  "draw-hands": {
    title: "Draw hands to show time",
    description:
      "Draw analog clock hands for times shown in hours or five-minute increments, helping kids visualize time."
  },
  "write-time": {
    title: "Write/read the time",
    description:
      "Read digital or analog times and write them in words or numbers, using whole hours and quarter hours."
  },
  "mental-maths": {
    title: "Mental maths",
    description:
      "Solve mental addition, subtraction, and quick number facts without paper, keeping numbers small."
  },
  fractions: {
    title: "Fractions",
    description:
      "Recognize whole, half, quarter, three-quarters, and other simple fractional parts of shapes or sets."
  },
  "even-odd": {
    title: "Even and odd",
    description: "Identify or separate even and odd numbers within simple ranges."
  },
  "fill-blanks": {
    title: "Number fill in the blanks",
    description:
      "Complete sequences or missing numbers in patterns, ramps, and number lines."
  },
  order: {
    title: "Ascending & descending order",
    description:
      "Arrange numbers from smallest to largest or largest to smallest, including mixed two- and three-digit numbers."
  },
  "dodging-table": {
    title: "Dodging table (skip counting)",
    description:
      "Skip count by 2s, 5s, or 10s to fill in missing numbers or keep counting along a path."
  },
  comparison: {
    title: "Greater than / smaller than",
    description:
      "Compare two numbers and say which is greater, smaller, or if they are equal using symbols or words."
  },
  multiply: {
    title: "Multiplication of 2 digits by 1 digit",
    description:
      "Multiply a two-digit number by a one-digit number, showing the product clearly."
  },
  "circle-number": {
    title: "Circle smallest / largest number",
    description:
      "Pick and circle the smallest or largest number from a group of numbers."
  },
  borrowing: {
    title: "2-digit borrowing subtraction",
    description:
      "Subtract two-digit numbers that require borrowing from the tens place."
  },
  addition: {
    title: "2-digit addition",
    description:
      "Add two-digit numbers, sometimes carrying into the tens place."
  },
  mixed: {
    title: "Mixed (mix of all topics)",
    description:
      "Blend the above topics so each question can target a different skill area."
  }
};

const levelGuidance: Record<LevelValue, string> = {
  easy: "Keep numbers small, use single-step problems, and avoid borrowing/carrying unless gentle.",
  medium: "Use a mix of single- and two-step problems with occasional tens-to-hundreds transitions and friendly borrow/carry.",
  hard: "Challenge students with multi-step thinking while staying age appropriate."
};

const requestSchema = z.object({
  topic: z.enum(topicValues),
  grade: z.enum(gradeValues)
});

const questionSchema = z.object({
  id: z.string(),
  question: z.string(),
  options: z.array(z.string()).length(4),
  correctAnswer: z.string(),
  type: z.string(),
  explanation: z.string().optional()
}).refine((value) => value.options.includes(value.correctAnswer), {
  message: "correctAnswer must be one of the options"
});

const responseSchema = z.object({
  questions: z.array(questionSchema)
});

const getLevelForGrade = (grade: GradeValue): LevelValue => {
  if (grade === "kg" || grade === "1" || grade === "2" || grade === "3") return "easy";
  return "hard";
};

const buildPrompt = (topic: TopicValue, grade: GradeValue) => {
  const topicInfo = topicMetadata[topic];
  const level = getLevelForGrade(grade);
  const levelHint = levelGuidance[level];
  const article = level === "easy" ? "an" : "a";
  const levelLabel = `${level} grade ${grade.toUpperCase()}`;

  return `You are a math teacher. Create ${article} ${level} set of ${levelLabel} questions that keep students engaged and confident.
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

For the ${topic === "mixed" ? "mixed topic, rotate through the slug names of the supported topics so the type field reflects the skill being tested" : `type field, keep the value "${topic}" so we know the chosen topic`}. Ensure exactly one correct answer per question, keep options concise, avoid repeating the correct answer text across multiple options, and do not always place the correct answer as the first option.
`;
};

export async function POST(request: Request) {
  try {
    const json = await request.json();
    const { topic, grade } = requestSchema.parse(json);

    const prompt = buildPrompt(topic, grade);

    const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY;
    if (!apiKey) {
      throw new Error("Missing Google Generative AI API key");
    }

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
  } catch (error) {
    console.error("Failed to generate questions", error);
    return NextResponse.json({ error: "Failed to generate questions" }, { status: 500 });
  }
}
