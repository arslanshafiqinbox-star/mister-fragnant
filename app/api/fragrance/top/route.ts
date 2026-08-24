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
 * GET /api/fragrance/top
 * Top 10 by average approved rating — same detail shape as summary
 * (fragrance with occasion/scent_type names + votes + approved reviews).
 */
export async function GET() {
  try {
    const fragrancesCol = await getFragrancesCollection();
    const reviewsCol = await getReviewsCollection();
    const occasionCol = await getNamedEntityCollection("occasion");
    const scentCol = await getNamedEntityCollection("scent_type");

    const [fragrances, occasions, scentTypes, ratingStats] = await Promise.all([
      fragrancesCol.find({}).toArray(),
      occasionCol.find({}).toArray(),
      scentCol.find({}).toArray(),
      reviewsCol
        .aggregate<{
          _id: import("mongodb").ObjectId;
          total_votes: number;
          average_rating: number;
          reviews: { name: string; review: string; rating: number }[];
        }>([
          { $match: { approval: true } },
          { $sort: { created_at: -1 } },
          {
            $group: {
              _id: "$fragrance_id",
              total_votes: { $sum: 1 },
              average_rating: { $avg: "$rating" },
              reviews: {
                $push: {
                  name: "$name",
                  review: "$review",
                  rating: "$rating",
                },
              },
            },
          },
          { $sort: { average_rating: -1, total_votes: -1 } },
          { $limit: 10 },
        ])
        .toArray(),
    ]);

    const fragranceMap = new Map(
      fragrances.map((f) => [f._id!.toHexString(), f])
    );

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

    const rows = ratingStats
      .map((stats) => {
        const id = stats._id.toHexString();
        const f = fragranceMap.get(id);
        if (!f) return null;

        return {
          fragrance: {
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
          },
          total_votes: stats.total_votes,
          average_rating: Math.round(stats.average_rating * 100) / 100,
          reviews: stats.reviews ?? [],
        };
      })
      .filter(Boolean);

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
