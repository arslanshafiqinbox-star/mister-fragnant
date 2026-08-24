import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getConnectionTestsCollection } from "@/lib/mongodb";

type RowInput = {
  id?: string;
  title?: string;
  body?: string | null;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: {
  _id: ObjectId;
  title: string;
  body: string | null;
  created_at: Date;
  updated_at: Date;
}) {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    body: doc.body,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

/** GET — list rows (connection check) */
export async function GET() {
  try {
    const col = await getConnectionTestsCollection();
    const docs = await col.find({}).sort({ created_at: -1 }).toArray();

    return NextResponse.json({
      ok: true,
      connected: true,
      count: docs.length,
      rows: docs.map((d) =>
        serialize({
          _id: d._id!,
          title: d.title,
          body: d.body,
          created_at: d.created_at,
          updated_at: d.updated_at,
        })
      ),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** POST — create a row */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as RowInput;
    const title = body.title?.trim();
    if (!title) {
      return jsonError("title is required", 400);
    }

    const now = new Date();
    const col = await getConnectionTestsCollection();
    const doc = {
      title,
      body: body.body ?? null,
      created_at: now,
      updated_at: now,
    };
    const result = await col.insertOne(doc);

    return NextResponse.json(
      {
        ok: true,
        row: serialize({
          _id: result.insertedId,
          ...doc,
        }),
      },
      { status: 201 }
    );
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** PUT — update a row by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as RowInput;
    if (!body.id) {
      return jsonError("id is required", 400);
    }
    if (!ObjectId.isValid(body.id)) {
      return jsonError("invalid id", 400);
    }

    const updates: Record<string, unknown> = {
      updated_at: new Date(),
    };
    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return jsonError("title cannot be empty", 400);
      updates.title = title;
    }
    if (body.body !== undefined) {
      updates.body = body.body;
    }

    const col = await getConnectionTestsCollection();
    const result = await col.findOneAndUpdate(
      { _id: new ObjectId(body.id) },
      { $set: updates },
      { returnDocument: "after" }
    );

    if (!result) {
      return jsonError("row not found", 404);
    }

    return NextResponse.json({
      ok: true,
      row: serialize({
        _id: result._id!,
        title: result.title,
        body: result.body,
        created_at: result.created_at,
        updated_at: result.updated_at,
      }),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}

/** DELETE — delete a row by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) {
      return jsonError("id query param is required", 400);
    }
    if (!ObjectId.isValid(id)) {
      return jsonError("invalid id", 400);
    }

    const col = await getConnectionTestsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) {
      return jsonError("row not found", 404);
    }

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
