import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getFilmsCollection,
  type FilmDetails,
  type FilmDoc,
} from "@/lib/mongodb";

type FilmInput = {
  id?: string;
  name?: string;
  details?: unknown;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: FilmDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    details: doc.details,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function parseDetails(
  value: unknown
): { details?: FilmDetails; error?: string } {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "details must be a JSON object" };
  }

  const raw = value as {
    brand?: unknown;
    location?: unknown;
    date?: unknown;
    duration?: unknown;
    url?: unknown;
    description?: unknown;
  };

  const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
  if (!brand) return { error: "details.brand is required" };

  if (
    !raw.location ||
    typeof raw.location !== "object" ||
    Array.isArray(raw.location)
  ) {
    return { error: "details.location must be an object" };
  }
  const loc = raw.location as { city?: unknown; country?: unknown };
  const city = typeof loc.city === "string" ? loc.city.trim() : "";
  const country = typeof loc.country === "string" ? loc.country.trim() : "";
  if (!city) return { error: "details.location.city is required" };
  if (!country) return { error: "details.location.country is required" };

  const date = typeof raw.date === "string" ? raw.date.trim() : "";
  if (!date) return { error: "details.date is required" };

  const duration = typeof raw.duration === "string" ? raw.duration.trim() : "";
  if (!duration) return { error: "details.duration is required" };

  const url = typeof raw.url === "string" ? raw.url.trim() : "";
  if (!url) return { error: "details.url is required" };

  const description =
    typeof raw.description === "string" ? raw.description : "";
  if (!description.trim()) return { error: "details.description is required" };

  return {
    details: {
      brand,
      location: { city, country },
      date,
      duration,
      url,
      description,
    },
  };
}

/** GET — list films */
export async function GET() {
  try {
    const col = await getFilmsCollection();
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

/** POST — create film */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FilmInput;
    const name = body.name?.trim();
    if (!name) return jsonError("name is required", 400);

    const detailsParsed = parseDetails(body.details ?? {});
    if (detailsParsed.error) return jsonError(detailsParsed.error, 400);
    if (!detailsParsed.details) return jsonError("details is required", 400);

    const now = new Date();
    const doc: FilmDoc = {
      name,
      details: detailsParsed.details,
      created_at: now,
      updated_at: now,
    };

    const col = await getFilmsCollection();
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

/** PUT — update film by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as FilmInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<FilmDoc> = {
      updated_at: new Date(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return jsonError("name cannot be empty", 400);
      updates.name = name;
    }

    if (body.details !== undefined) {
      const detailsParsed = parseDetails(body.details);
      if (detailsParsed.error) return jsonError(detailsParsed.error, 400);
      if (!detailsParsed.details) return jsonError("details is required", 400);
      updates.details = detailsParsed.details;
    }

    const col = await getFilmsCollection();
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

/** DELETE — delete film by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getFilmsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
