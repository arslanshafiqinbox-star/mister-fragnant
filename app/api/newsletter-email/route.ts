import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getNewsletterEmailsCollection,
  type NewsletterEmailDoc,
} from "@/lib/mongodb";

type NewsletterInput = {
  id?: string;
  email?: string;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: NewsletterEmailDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    email: doc.email,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function normalizeEmail(value: string) {
  return value.trim().toLowerCase();
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

/** GET — list newsletter emails */
export async function GET() {
  try {
    const col = await getNewsletterEmailsCollection();
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

/** POST — create / subscribe */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as NewsletterInput;
    const email = normalizeEmail(body.email ?? "");
    if (!email) return jsonError("email is required", 400);
    if (!isValidEmail(email)) return jsonError("invalid email", 400);

    const col = await getNewsletterEmailsCollection();
    const existing = await col.findOne({ email });
    if (existing) {
      return NextResponse.json({
        ok: true,
        already_subscribed: true,
        row: serialize({ ...existing, _id: existing._id! }),
        message: "Already subscribed.",
      });
    }

    const now = new Date();
    const doc: NewsletterEmailDoc = {
      email,
      created_at: now,
      updated_at: now,
    };
    const result = await col.insertOne(doc);

    return NextResponse.json(
      {
        ok: true,
        already_subscribed: false,
        row: serialize({ _id: result.insertedId, ...doc }),
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** PUT — update email by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as NewsletterInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<NewsletterEmailDoc> = {
      updated_at: new Date(),
    };

    if (typeof body.email === "string") {
      const email = normalizeEmail(body.email);
      if (!email) return jsonError("email cannot be empty", 400);
      if (!isValidEmail(email)) return jsonError("invalid email", 400);

      const col = await getNewsletterEmailsCollection();
      const clash = await col.findOne({
        email,
        _id: { $ne: new ObjectId(body.id) },
      });
      if (clash) return jsonError("email already subscribed", 409);

      updates.email = email;
    }

    if (Object.keys(updates).length === 1) {
      return jsonError("nothing to update", 400);
    }

    const col = await getNewsletterEmailsCollection();
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(body.id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) return jsonError("row not found", 404);

    return NextResponse.json({
      ok: true,
      row: serialize({ ...result, _id: result._id! }),
    });
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

    const col = await getNewsletterEmailsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
