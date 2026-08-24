import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getAlternativesCollection,
  getNamedEntityCollection,
  type AlternativeComparison,
  type AlternativeDoc,
  type AlternativeFragranceSide,
} from "@/lib/mongodb";

type AlternativeInput = {
  id?: string;
  name?: string;
  scent_type?: string[];
  occasion?: string[];
  comparison?: unknown;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function emptyComparison(): AlternativeComparison {
  return {
    closeness: "",
    comparison: {
      fragrance1: {
        name: "",
        brand: "",
        price: { amount: 0, currency: "USD", size: "" },
        notes: [],
      },
      fragrance2: {
        name: "",
        brand: "",
        price: { amount: 0, currency: "USD", size: "" },
        notes: [],
      },
    },
    review: {
      summary: "",
      performance: "",
      disclaimer: "",
    },
  };
}

function serialize(doc: AlternativeDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    scent_type: (doc.scent_type ?? []).map((id) => id.toHexString()),
    occasion: (doc.occasion ?? []).map((id) => id.toHexString()),
    comparison: doc.comparison ?? emptyComparison(),
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function parseFragranceSide(
  value: unknown,
  label: string
): { side?: AlternativeFragranceSide; error?: string } {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return { error: `${label} must be an object` };
  }
  const raw = value as {
    name?: unknown;
    brand?: unknown;
    price?: unknown;
    notes?: unknown;
  };

  const name = typeof raw.name === "string" ? raw.name.trim() : "";
  const brand = typeof raw.brand === "string" ? raw.brand.trim() : "";
  if (!name) return { error: `${label}.name is required` };
  if (!brand) return { error: `${label}.brand is required` };

  if (!raw.price || typeof raw.price !== "object" || Array.isArray(raw.price)) {
    return { error: `${label}.price must be an object` };
  }
  const priceRaw = raw.price as {
    amount?: unknown;
    currency?: unknown;
    size?: unknown;
  };
  const amount =
    typeof priceRaw.amount === "number"
      ? priceRaw.amount
      : typeof priceRaw.amount === "string" && priceRaw.amount.trim()
        ? Number(priceRaw.amount)
        : NaN;
  if (!Number.isFinite(amount) || amount < 0) {
    return { error: `${label}.price.amount must be a non-negative number` };
  }
  const currency =
    typeof priceRaw.currency === "string" ? priceRaw.currency.trim() : "";
  const size = typeof priceRaw.size === "string" ? priceRaw.size.trim() : "";
  if (!currency) return { error: `${label}.price.currency is required` };
  if (!size) return { error: `${label}.price.size is required` };

  if (!Array.isArray(raw.notes)) {
    return { error: `${label}.notes must be an array of strings` };
  }
  const notes: string[] = [];
  for (const note of raw.notes) {
    if (typeof note !== "string" || !note.trim()) {
      return { error: `${label}.notes must contain non-empty strings` };
    }
    notes.push(note.trim());
  }
  if (notes.length === 0) {
    return { error: `${label}.notes needs at least one note` };
  }

  return {
    side: {
      name,
      brand,
      price: { amount, currency, size },
      notes,
    },
  };
}

function parseComparison(
  value: unknown
): { comparison?: AlternativeComparison; error?: string } {
  if (value === undefined) return {};
  if (value === null || typeof value !== "object" || Array.isArray(value)) {
    return { error: "comparison must be a JSON object" };
  }

  const raw = value as {
    closeness?: unknown;
    comparison?: unknown;
    review?: unknown;
  };

  const closenessRaw = raw.closeness;
  let closenessNum = NaN;
  if (typeof closenessRaw === "number") {
    closenessNum = closenessRaw;
  } else if (typeof closenessRaw === "string") {
    const trimmed = closenessRaw.trim();
    const match = trimmed.match(/^(\d+(?:\.\d+)?)\s*\/\s*10$/i);
    closenessNum = match ? Number(match[1]) : Number(trimmed);
  }
  if (!Number.isFinite(closenessNum) || closenessNum < 0 || closenessNum > 10) {
    return { error: "comparison.closeness must be a number from 0 to 10" };
  }
  const closeness = `${closenessNum}/10`;

  if (
    !raw.comparison ||
    typeof raw.comparison !== "object" ||
    Array.isArray(raw.comparison)
  ) {
    return { error: "comparison.comparison must be an object" };
  }
  const pair = raw.comparison as {
    fragrance1?: unknown;
    fragrance2?: unknown;
  };

  const f1 = parseFragranceSide(pair.fragrance1, "fragrance1");
  if (f1.error || !f1.side) return { error: f1.error || "fragrance1 invalid" };
  const f2 = parseFragranceSide(pair.fragrance2, "fragrance2");
  if (f2.error || !f2.side) return { error: f2.error || "fragrance2 invalid" };

  if (!raw.review || typeof raw.review !== "object" || Array.isArray(raw.review)) {
    return { error: "comparison.review must be an object" };
  }
  const reviewRaw = raw.review as {
    summary?: unknown;
    performance?: unknown;
    disclaimer?: unknown;
  };
  const summary =
    typeof reviewRaw.summary === "string" ? reviewRaw.summary.trim() : "";
  const performance =
    typeof reviewRaw.performance === "string"
      ? reviewRaw.performance.trim()
      : "";
  const disclaimer =
    typeof reviewRaw.disclaimer === "string"
      ? reviewRaw.disclaimer.trim()
      : "";
  if (!summary) return { error: "review.summary is required" };
  if (!performance) return { error: "review.performance is required" };
  if (!disclaimer) return { error: "review.disclaimer is required" };

  return {
    comparison: {
      closeness,
      comparison: {
        fragrance1: f1.side,
        fragrance2: f2.side,
      },
      review: { summary, performance, disclaimer },
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

/** GET — list alternatives */
export async function GET() {
  try {
    const col = await getAlternativesCollection();
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

/** POST — create alternative */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as AlternativeInput;
    const name = body.name?.trim();
    if (!name) return jsonError("name is required", 400);

    const comparisonParsed = parseComparison(body.comparison ?? {});
    if (comparisonParsed.error) return jsonError(comparisonParsed.error, 400);
    if (!comparisonParsed.comparison) {
      return jsonError("comparison is required", 400);
    }

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
    const doc: AlternativeDoc = {
      name,
      scent_type: scentIds,
      occasion: occasionIds,
      comparison: comparisonParsed.comparison,
      created_at: now,
      updated_at: now,
    };

    const col = await getAlternativesCollection();
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

/** PUT — update alternative by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as AlternativeInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<AlternativeDoc> = {
      updated_at: new Date(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return jsonError("name cannot be empty", 400);
      updates.name = name;
    }

    if (body.comparison !== undefined) {
      const comparisonParsed = parseComparison(body.comparison);
      if (comparisonParsed.error) return jsonError(comparisonParsed.error, 400);
      if (!comparisonParsed.comparison) {
        return jsonError("comparison is required", 400);
      }
      updates.comparison = comparisonParsed.comparison;
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

    const col = await getAlternativesCollection();
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

/** DELETE — delete alternative by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getAlternativesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
