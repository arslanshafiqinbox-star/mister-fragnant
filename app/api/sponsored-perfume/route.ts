import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getNamedEntityCollection,
  getSponsoredPerfumesCollection,
  type SponsoredPerfumeDetails,
  type SponsoredPerfumeDoc,
} from "@/lib/mongodb";

type SponsoredPerfumeInput = {
  id?: string;
  name?: string;
  scent_type?: string[];
  occasion?: string[];
  details?: unknown;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: SponsoredPerfumeDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    scent_type: (doc.scent_type ?? []).map((id) => id.toHexString()),
    occasion: (doc.occasion ?? []).map((id) => id.toHexString()),
    details: doc.details ?? {
      brand: "",
      description: "",
      rating: 0,
      retailers: [],
    },
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function parseDetails(
  value: unknown
): { details?: SponsoredPerfumeDetails; error?: string } {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "details must be a JSON object" };
  }

  const raw = value as {
    brand?: unknown;
    description?: unknown;
    rating?: unknown;
    retailers?: unknown;
  };

  const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
  if (!brand) return { error: "details.brand is required" };

  const description =
    typeof raw.description === "string" ? raw.description : "";
  if (!description.trim()) return { error: "details.description is required" };

  const rating =
    typeof raw.rating === "number"
      ? raw.rating
      : typeof raw.rating === "string" && raw.rating.trim()
        ? Number(raw.rating)
        : NaN;
  if (!Number.isFinite(rating) || rating < 0 || rating > 10) {
    return { error: "details.rating must be a number between 0 and 10" };
  }

  if (!Array.isArray(raw.retailers)) {
    return { error: "details.retailers must be an array" };
  }

  const retailers: SponsoredPerfumeDetails["retailers"] = [];
  for (const item of raw.retailers) {
    if (!item || typeof item !== "object") {
      return { error: "each retailer must be an object" };
    }
    const row = item as { name?: unknown; url?: unknown };
    const name = typeof row.name === "string" ? row.name.trim() : "";
    const url = typeof row.url === "string" ? row.url.trim() : "";
    if (!name) return { error: "retailer name is required" };
    if (!url) return { error: "retailer url is required" };
    retailers.push({ name, url });
  }

  return {
    details: {
      brand,
      description,
      rating,
      retailers,
    },
  };
}

function parseIdList(
  value: unknown,
  field: string
): { ids?: ObjectId[]; error?: string } {
  if (value === undefined) return {};
  if (!Array.isArray(value)) {
    return { error: `${field} must be an array of ids` };
  }
  const ids: ObjectId[] = [];
  for (const item of value) {
    if (typeof item !== "string" || !ObjectId.isValid(item)) {
      return { error: `${field} contains an invalid id` };
    }
    ids.push(new ObjectId(item));
  }
  return { ids };
}

async function assertIdsExist(
  collectionName: "scent_type" | "occasion",
  ids: ObjectId[]
): Promise<string | null> {
  if (ids.length === 0) return null;
  const col = await getNamedEntityCollection(collectionName);
  const count = await col.countDocuments({ _id: { $in: ids } });
  if (count !== ids.length) {
    return `one or more ${collectionName} ids do not exist`;
  }
  return null;
}

/** GET — list sponsored perfumes */
export async function GET() {
  try {
    const col = await getSponsoredPerfumesCollection();
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

/** POST — create sponsored perfume */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as SponsoredPerfumeInput;
    const name = body.name?.trim();
    if (!name) return jsonError("name is required", 400);

    const detailsParsed = parseDetails(body.details ?? {});
    if (detailsParsed.error) return jsonError(detailsParsed.error, 400);
    if (!detailsParsed.details) return jsonError("details is required", 400);

    const scentParsed = parseIdList(body.scent_type ?? [], "scent_type");
    if (scentParsed.error) return jsonError(scentParsed.error, 400);
    const occasionParsed = parseIdList(body.occasion ?? [], "occasion");
    if (occasionParsed.error) return jsonError(occasionParsed.error, 400);

    const scentIds = scentParsed.ids ?? [];
    const occasionIds = occasionParsed.ids ?? [];

    const scentErr = await assertIdsExist("scent_type", scentIds);
    if (scentErr) return jsonError(scentErr, 400);
    const occasionErr = await assertIdsExist("occasion", occasionIds);
    if (occasionErr) return jsonError(occasionErr, 400);

    const now = new Date();
    const doc: SponsoredPerfumeDoc = {
      name,
      scent_type: scentIds,
      occasion: occasionIds,
      details: detailsParsed.details,
      created_at: now,
      updated_at: now,
    };

    const col = await getSponsoredPerfumesCollection();
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

/** PUT — update sponsored perfume by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as SponsoredPerfumeInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<SponsoredPerfumeDoc> = {
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

    if (body.scent_type !== undefined) {
      const parsed = parseIdList(body.scent_type, "scent_type");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("scent_type", ids);
      if (err) return jsonError(err, 400);
      updates.scent_type = ids;
    }

    if (body.occasion !== undefined) {
      const parsed = parseIdList(body.occasion, "occasion");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("occasion", ids);
      if (err) return jsonError(err, 400);
      updates.occasion = ids;
    }

    const col = await getSponsoredPerfumesCollection();
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

/** DELETE — delete sponsored perfume by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getSponsoredPerfumesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
