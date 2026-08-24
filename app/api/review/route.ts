import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getFragrancesCollection,
  getReviewsCollection,
  type ReviewDoc,
} from "@/lib/mongodb";

type ReviewInput = {
  id?: string;
  fragrance_id?: string;
  name?: string;
  review?: string;
  approval?: boolean;
  rating?: number;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: ReviewDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    fragrance_id: doc.fragrance_id.toHexString(),
    name: doc.name,
    review: doc.review,
    approval: doc.approval,
    rating: doc.rating,
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function parseRating(value: unknown): { rating?: number; error?: string } {
  if (value === undefined) return {};
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return { error: "rating must be a number" };
  }
  if (value < 1 || value > 10) {
    return { error: "rating must be between 1 and 10" };
  }
  return { rating: value };
}

async function assertFragranceExists(id: ObjectId): Promise<string | null> {
  const col = await getFragrancesCollection();
  const found = await col.findOne({ _id: id }, { projection: { _id: 1 } });
  return found ? null : "fragrance_id does not exist";
}

/** GET — list reviews (?fragrance_id= optional filter) */
export async function GET(request: NextRequest) {
  try {
    const fragranceId = request.nextUrl.searchParams.get("fragrance_id");
    const filter: Record<string, unknown> = {};

    if (fragranceId) {
      if (!ObjectId.isValid(fragranceId)) {
        return jsonError("invalid fragrance_id", 400);
      }
      filter.fragrance_id = new ObjectId(fragranceId);
    }

    const col = await getReviewsCollection();
    const docs = await col.find(filter).sort({ created_at: -1 }).toArray();

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

/** POST — create review (approval defaults to false) */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewInput;

    if (!body.fragrance_id || !ObjectId.isValid(body.fragrance_id)) {
      return jsonError("valid fragrance_id is required", 400);
    }
    const name = body.name?.trim();
    const review = body.review?.trim();
    if (!name) return jsonError("name is required", 400);
    if (!review) return jsonError("review is required", 400);

    const ratingParsed = parseRating(body.rating);
    if (ratingParsed.error) return jsonError(ratingParsed.error, 400);
    if (ratingParsed.rating === undefined) {
      return jsonError("rating is required", 400);
    }

    const fragranceObjectId = new ObjectId(body.fragrance_id);
    const fragranceErr = await assertFragranceExists(fragranceObjectId);
    if (fragranceErr) return jsonError(fragranceErr, 400);

    if (body.approval !== undefined && typeof body.approval !== "boolean") {
      return jsonError("approval must be a boolean", 400);
    }

    const now = new Date();
    const doc: ReviewDoc = {
      fragrance_id: fragranceObjectId,
      name,
      review,
      approval: body.approval === true,
      rating: ratingParsed.rating,
      created_at: now,
      updated_at: now,
    };

    const col = await getReviewsCollection();
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

/** PUT — update review by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as ReviewInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<ReviewDoc> = {
      updated_at: new Date(),
    };

    if (body.fragrance_id !== undefined) {
      if (!ObjectId.isValid(body.fragrance_id)) {
        return jsonError("invalid fragrance_id", 400);
      }
      const fragranceObjectId = new ObjectId(body.fragrance_id);
      const fragranceErr = await assertFragranceExists(fragranceObjectId);
      if (fragranceErr) return jsonError(fragranceErr, 400);
      updates.fragrance_id = fragranceObjectId;
    }

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return jsonError("name cannot be empty", 400);
      updates.name = name;
    }

    if (typeof body.review === "string") {
      const review = body.review.trim();
      if (!review) return jsonError("review cannot be empty", 400);
      updates.review = review;
    }

    if (body.approval !== undefined) {
      if (typeof body.approval !== "boolean") {
        return jsonError("approval must be a boolean", 400);
      }
      updates.approval = body.approval;
    }

    if (body.rating !== undefined) {
      const ratingParsed = parseRating(body.rating);
      if (ratingParsed.error) return jsonError(ratingParsed.error, 400);
      updates.rating = ratingParsed.rating;
    }

    const col = await getReviewsCollection();
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

/** DELETE — delete review by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getReviewsCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
