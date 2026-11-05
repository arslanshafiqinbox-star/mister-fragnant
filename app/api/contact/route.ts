import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getContactMessagesCollection,
  type ContactMessageDoc,
} from "@/lib/mongodb";
import { sendContactEmail } from "@/lib/send-contact-email";

const TOPICS = [
  "General question",
  "Review request",
  "Partnership",
  "Fragrance suggestion",
] as const;

type ContactInput = {
  name?: string;
  email?: string;
  topic?: string;
  message?: string;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: ContactMessageDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    email: doc.email,
    topic: doc.topic ?? "General question",
    message: doc.message,
    created_at: doc.created_at.toISOString(),
  };
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** GET — list contact messages */
export async function GET() {
  try {
    const col = await getContactMessagesCollection();
    const docs = await col.find({}).sort({ created_at: -1 }).toArray();

    return NextResponse.json({
      ok: true,
      count: docs.length,
      rows: docs.map((d) => serialize({ ...d, _id: d._id! })),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** POST — submit contact form */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ContactInput;
    const name = body.name?.trim() ?? "";
    const email = (body.email ?? "").trim().toLowerCase();
    const topic = body.topic?.trim() ?? "";
    const message = body.message?.trim() ?? "";

    if (!name) return jsonError("name is required", 400);
    if (name.length > 120) return jsonError("name is too long", 400);
    if (!email) return jsonError("email is required", 400);
    if (!isValidEmail(email)) return jsonError("invalid email", 400);
    if (!TOPICS.includes(topic as (typeof TOPICS)[number])) {
      return jsonError("topic is required", 400);
    }
    if (!message) return jsonError("message is required", 400);
    if (message.length > 1000) return jsonError("message is too long", 400);

    const now = new Date();
    const doc: ContactMessageDoc = {
      name,
      email,
      topic,
      message,
      created_at: now,
    };

    const col = await getContactMessagesCollection();
    const result = await col.insertOne(doc);

    try {
      await sendContactEmail({ name, email, topic, message });
    } catch (mailError) {
      console.error("Failed to send contact email", mailError);
      const code =
        mailError && typeof mailError === "object" && "responseCode" in mailError
          ? Number((mailError as { responseCode?: number }).responseCode)
          : null;
      return jsonError(
        code === 535
          ? "Gmail rejected the login (535). SMTP_USER must be arslanshafiq.inbox@gmail.com and SMTP_PASS must be the 16-character App Password from that same Google account — not the name “mister fragnance”."
          : "Message saved, but the email could not be sent. Check SMTP settings.",
        500
      );
    }

    return NextResponse.json(
      {
        ok: true,
        row: serialize({ _id: result.insertedId, ...doc }),
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** DELETE — delete by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getContactMessagesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
