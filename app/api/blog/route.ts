import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getBlogsCollection, type BlogDoc } from "@/lib/mongodb";

type BlogInput = {
  id?: string;
  title?: string;
  provider?: string;
  description?: string;
  author?: string;
  sponsored?: boolean;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: BlogDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    title: doc.title,
    provider: doc.provider,
    description: doc.description,
    author: doc.author,
    sponsored: Boolean(doc.sponsored),
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

/** GET — list blogs */
export async function GET() {
  try {
    const col = await getBlogsCollection();
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

/** POST — create blog */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as BlogInput;
    const title = body.title?.trim();
    const provider = body.provider?.trim();
    const description = body.description?.trim();
    const author = body.author?.trim();

    if (!title) return jsonError("title is required", 400);
    if (!provider) return jsonError("provider is required", 400);
    if (!description) return jsonError("description is required", 400);
    if (!author) return jsonError("author is required", 400);

    const now = new Date();
    const doc: BlogDoc = {
      title,
      provider,
      description,
      author,
      sponsored: body.sponsored === true,
      created_at: now,
      updated_at: now,
    };

    const col = await getBlogsCollection();
    const result = await col.insertOne(doc);

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

/** PUT — update blog by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as BlogInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<BlogDoc> = {
      updated_at: new Date(),
    };

    if (typeof body.title === "string") {
      const title = body.title.trim();
      if (!title) return jsonError("title cannot be empty", 400);
      updates.title = title;
    }
    if (typeof body.provider === "string") {
      const provider = body.provider.trim();
      if (!provider) return jsonError("provider cannot be empty", 400);
      updates.provider = provider;
    }
    if (typeof body.description === "string") {
      const description = body.description.trim();
      if (!description) return jsonError("description cannot be empty", 400);
      updates.description = description;
    }
    if (typeof body.author === "string") {
      const author = body.author.trim();
      if (!author) return jsonError("author cannot be empty", 400);
      updates.author = author;
    }
    if (body.sponsored !== undefined) {
      if (typeof body.sponsored !== "boolean") {
        return jsonError("sponsored must be a boolean", 400);
      }
      updates.sponsored = body.sponsored;
    }

    const col = await getBlogsCollection();
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

/** DELETE — delete blog by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getBlogsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
