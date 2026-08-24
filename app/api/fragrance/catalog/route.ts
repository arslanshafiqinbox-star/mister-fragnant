import { NextResponse } from "next/server";
import {
  getFragrancesCollection,
  getNamedEntityCollection,
  getReviewsCollection,
} from "@/lib/mongodb";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

/**
 * GET /api/fragrance/catalog
 * All fragrances with populated occasion/scent_type, associate_links,
 * and approved-review aggregates (total_votes, average_rating).
 * Does not include individual reviews.
 */
export async function GET() {
  try {
    const fragrancesCol = await getFragrancesCollection();
    const reviewsCol = await getReviewsCollection();
    const occasionCol = await getNamedEntityCollection("occasion");
    const scentCol = await getNamedEntityCollection("scent_type");

    const [fragrances, occasions, scentTypes, ratingStats] = await Promise.all([
      fragrancesCol.find({}).sort({ created_at: -1 }).toArray(),
      occasionCol.find({}).toArray(),
      scentCol.find({}).toArray(),
      reviewsCol
        .aggregate<{
          _id: import("mongodb").ObjectId;
          total_votes: number;
          average_rating: number;
        }>([
          { $match: { approval: true } },
          {
            $group: {
              _id: "$fragrance_id",
              total_votes: { $sum: 1 },
              average_rating: { $avg: "$rating" },
            },
          },
        ])
        .toArray(),
    ]);

    const occasionMap = new Map(
      occasions.map((o) => [
        o._id!.toHexString(),
        {
          id: o._id!.toHexString(),
          name: o.name,
          description: o.description,
        },
      ])
    );

    const scentMap = new Map(
      scentTypes.map((s) => [
        s._id!.toHexString(),
        {
          id: s._id!.toHexString(),
          name: s.name,
          description: s.description,
        },
      ])
    );

    const statsMap = new Map(
      ratingStats.map((s) => [
        s._id.toHexString(),
        {
          total_votes: s.total_votes,
          average_rating: Math.round(s.average_rating * 100) / 100,
        },
      ])
    );

    const rows = fragrances.map((f) => {
      const id = f._id!.toHexString();
      const stats = statsMap.get(id) ?? {
        total_votes: 0,
        average_rating: null as number | null,
      };

      return {
        id,
        name: f.name,
        brand: f.brand,
        occasion: (f.occasion ?? [])
          .map((oid) => occasionMap.get(oid.toHexString()))
          .filter(Boolean),
        scent_type: (f.scent_type ?? [])
          .map((sid) => scentMap.get(sid.toHexString()))
          .filter(Boolean),
        associate_links: f.associate_links ?? [],
        total_votes: stats.total_votes,
        average_rating: stats.average_rating,
        created_at: f.created_at.toISOString(),
        updated_at: f.updated_at.toISOString(),
      };
    });

    return NextResponse.json({
      ok: true,
      count: rows.length,
      rows,
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
