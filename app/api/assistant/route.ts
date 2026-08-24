import { NextRequest, NextResponse } from "next/server";

type ChatMessage = {
  role: "user" | "assistant";
  content: string;
};

export async function POST(request: NextRequest) {
  try {
    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { message: "OPENAI_API_KEY is not configured." },
        { status: 500 }
      );
    }

    const body = (await request.json()) as {
      question?: string;
      idealAnswer?: string;
      topic?: string;
      userAnswer?: string;
      query?: string;
      history?: ChatMessage[];
    };

    const query = body.query?.trim();
    if (!query) {
      return NextResponse.json(
        { message: "Please enter a question." },
        { status: 400 }
      );
    }

    const systemPrompt = [
      "You are Grademark's study assistant for exam practice.",
      "Help the student with anything related to the current quiz question: explanations, definitions, worked steps, mark-scheme style points, examples, common mistakes, and how to improve their draft answer.",
      "Be clear, accurate, and encouraging. Use short paragraphs or bullet points when helpful.",
      "You may explain the full solution and ideal answer when asked — the student is practising, not sitting a live exam.",
      "Stay focused on the question topic. If asked something unrelated, briefly redirect back to the question.",
      "Do not invent mark schemes that contradict the provided ideal answer when one is given.",
    ].join(" ");

    const contextParts = [
      `Topic: ${body.topic?.trim() || "General"}`,
      `Question: ${body.question?.trim() || "Not provided"}`,
    ];
    if (body.idealAnswer?.trim()) {
      contextParts.push(`Ideal / model answer: ${body.idealAnswer.trim()}`);
    }
    if (body.userAnswer?.trim()) {
      contextParts.push(`Student's current draft: ${body.userAnswer.trim()}`);
    }

    const history = Array.isArray(body.history)
      ? body.history
          .filter(
            (m) =>
              m &&
              (m.role === "user" || m.role === "assistant") &&
              typeof m.content === "string" &&
              m.content.trim()
          )
          .slice(-8)
          .map((m) => ({
            role: m.role,
            content: m.content.trim(),
          }))
      : [];

    const upstream = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        temperature: 0.5,
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "system",
            content: `Current question context:\n${contextParts.join("\n")}`,
          },
          ...history,
          { role: "user", content: query },
        ],
      }),
    });

    const json = (await upstream.json()) as {
      choices?: Array<{ message?: { content?: string } }>;
      error?: { message?: string };
    };

    if (!upstream.ok) {
      return NextResponse.json(
        {
          message:
            json?.error?.message || "OpenAI assistant request failed.",
        },
        { status: upstream.status }
      );
    }

    const reply =
      json.choices?.[0]?.message?.content?.trim() ||
      "I couldn't generate a reply. Try asking again.";

    return NextResponse.json({ reply });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Assistant request failed";
    return NextResponse.json({ message }, { status: 500 });
  }
}
