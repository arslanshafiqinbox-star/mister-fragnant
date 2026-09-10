import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getFragrancesCollection,
  getNamedEntityCollection,
  type AssociateLink,
  type FragranceDoc,
  type NamedEntityCollectionName,
} from "@/lib/mongodb";

type FragranceInput = {
  id?: string;
  name?: string;
  brand?: string;
  occasion?: string[];
  scent_type?: string[];
  gender?: string[];
  strength?: string[];
  approx_price?: string | null;
  associate_links?: AssociateLink[];
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: FragranceDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    brand: doc.brand,
    occasion: (doc.occasion ?? []).map((id) => id.toHexString()),
    scent_type: (doc.scent_type ?? []).map((id) => id.toHexString()),
    gender: (doc.gender ?? []).map((id) => id.toHexString()),
    strength: (doc.strength ?? []).map((id) => id.toHexString()),
    approx_price: doc.approx_price?.trim() || null,
    associate_links: doc.associate_links ?? [],
    created_at: doc.created_at.toISOString(),
    updated_at: doc.updated_at.toISOString(),
  };
}

function parseApproxPrice(
  value: unknown
): { price?: string | null; error?: string } {
  if (value === undefined) return {};
  if (value === null) return { price: null };
  if (typeof value === "number" && Number.isFinite(value)) {
    return { price: String(value) };
  }
  if (typeof value !== "string") {
    return { error: "approx_price must be a string" };
  }
  return { price: value.trim() || null };
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

function parseAssociateLinks(
  value: unknown
): { links?: AssociateLink[]; error?: string } {
  if (value === undefined) return {};
  if (!Array.isArray(value)) {
    return { error: "associate_links must be an array" };
  }

  const links: AssociateLink[] = [];
  for (const item of value) {
    if (!item || typeof item !== "object") {
      return { error: "each associate_link must be an object" };
    }
    const raw = item as { name?: unknown; link?: unknown };
    const name = typeof raw.name === "string" ? raw.name.trim() : "";
    const link = typeof raw.link === "string" ? raw.link.trim() : "";
    if (!name) return { error: "associate_link name is required" };
    if (!link) return { error: "associate_link link is required" };
    links.push({ name, link });
  }
  return { links };
}

async function assertIdsExist(
  collectionName: NamedEntityCollectionName,
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

/** GET — list fragrances */
export async function GET() {
  try {
    const col = await getFragrancesCollection();
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

/** POST — create fragrance */
export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as FragranceInput;
    const name = body.name?.trim();
    const brand = body.brand?.trim() ?? "";
    if (!name) return jsonError("name is required", 400);

    const occasionParsed = parseIdList(body.occasion ?? [], "occasion");
    if (occasionParsed.error) return jsonError(occasionParsed.error, 400);
    const scentParsed = parseIdList(body.scent_type ?? [], "scent_type");
    if (scentParsed.error) return jsonError(scentParsed.error, 400);
    const genderParsed = parseIdList(body.gender ?? [], "gender");
    if (genderParsed.error) return jsonError(genderParsed.error, 400);
    const strengthParsed = parseIdList(body.strength ?? [], "strength");
    if (strengthParsed.error) return jsonError(strengthParsed.error, 400);
    const priceParsed = parseApproxPrice(body.approx_price ?? null);
    if (priceParsed.error) return jsonError(priceParsed.error, 400);
    const linksParsed = parseAssociateLinks(body.associate_links ?? []);
    if (linksParsed.error) return jsonError(linksParsed.error, 400);

    const occasionIds = occasionParsed.ids ?? [];
    const scentIds = scentParsed.ids ?? [];
    const genderIds = genderParsed.ids ?? [];
    const strengthIds = strengthParsed.ids ?? [];
    const approxPrice = priceParsed.price ?? null;
    const associateLinks = linksParsed.links ?? [];

    const occasionErr = await assertIdsExist("occasion", occasionIds);
    if (occasionErr) return jsonError(occasionErr, 400);
    const scentErr = await assertIdsExist("scent_type", scentIds);
    if (scentErr) return jsonError(scentErr, 400);
    const genderErr = await assertIdsExist("gender", genderIds);
    if (genderErr) return jsonError(genderErr, 400);
    const strengthErr = await assertIdsExist("strength", strengthIds);
    if (strengthErr) return jsonError(strengthErr, 400);

    const now = new Date();
    const doc: FragranceDoc = {
      name,
      brand,
      occasion: occasionIds,
      scent_type: scentIds,
      gender: genderIds,
      strength: strengthIds,
      approx_price: approxPrice,
      associate_links: associateLinks,
      created_at: now,
      updated_at: now,
    };

    const col = await getFragrancesCollection();
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

/** PUT — update fragrance by id */
export async function PUT(request: NextRequest) {
  try {
    const body = (await request.json()) as FragranceInput;
    if (!body.id) return jsonError("id is required", 400);
    if (!ObjectId.isValid(body.id)) return jsonError("invalid id", 400);

    const updates: Partial<FragranceDoc> = {
      updated_at: new Date(),
    };

    if (typeof body.name === "string") {
      const name = body.name.trim();
      if (!name) return jsonError("name cannot be empty", 400);
      updates.name = name;
    }
    if (typeof body.brand === "string") {
      const brand = body.brand.trim();
      if (!brand) return jsonError("brand cannot be empty", 400);
      updates.brand = brand;
    }

    if (body.approx_price !== undefined) {
      const parsed = parseApproxPrice(body.approx_price);
      if (parsed.error) return jsonError(parsed.error, 400);
      updates.approx_price = parsed.price ?? null;
    }

    if (body.occasion !== undefined) {
      const parsed = parseIdList(body.occasion, "occasion");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("occasion", ids);
      if (err) return jsonError(err, 400);
      updates.occasion = ids;
    }

    if (body.scent_type !== undefined) {
      const parsed = parseIdList(body.scent_type, "scent_type");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("scent_type", ids);
      if (err) return jsonError(err, 400);
      updates.scent_type = ids;
    }

    if (body.gender !== undefined) {
      const parsed = parseIdList(body.gender, "gender");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("gender", ids);
      if (err) return jsonError(err, 400);
      updates.gender = ids;
    }

    if (body.strength !== undefined) {
      const parsed = parseIdList(body.strength, "strength");
      if (parsed.error) return jsonError(parsed.error, 400);
      const ids = parsed.ids ?? [];
      const err = await assertIdsExist("strength", ids);
      if (err) return jsonError(err, 400);
      updates.strength = ids;
    }

    if (body.associate_links !== undefined) {
      const parsed = parseAssociateLinks(body.associate_links);
      if (parsed.error) return jsonError(parsed.error, 400);
      updates.associate_links = parsed.links ?? [];
    }

    const col = await getFragrancesCollection();
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

/** DELETE — delete fragrance by id (?id=...) */
export async function DELETE(request: NextRequest) {
  try {
    const id = request.nextUrl.searchParams.get("id");
    if (!id) return jsonError("id query param is required", 400);
    if (!ObjectId.isValid(id)) return jsonError("invalid id", 400);

    const col = await getFragrancesCollection();
    const result = await col.deleteOne({ _id: new ObjectId(id) });

    if (result.deletedCount === 0) return jsonError("row not found", 404);

    return NextResponse.json({ ok: true, deleted: id });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
