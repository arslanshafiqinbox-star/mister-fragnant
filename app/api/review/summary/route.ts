import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getFragrancesCollection,
  getNamedEntityCollection,
  getReviewsCollection,
} from "@/lib/mongodb";

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

/**
 * GET /api/review/summary?fragrance_id=...
 * Fragrance details (occasion + scent_type names) + approved review aggregates.
 */
export async function GET(request: NextRequest) {
  try {
    const fragranceId = request.nextUrl.searchParams.get("fragrance_id");
    if (!fragranceId) {
      return jsonError("fragrance_id query param is required", 400);
    }
    if (!ObjectId.isValid(fragranceId)) {
      return jsonError("invalid fragrance_id", 400);
    }

    const fragranceObjectId = new ObjectId(fragranceId);
    const fragrancesCol = await getFragrancesCollection();
    const fragrance = await fragrancesCol.findOne({ _id: fragranceObjectId });

    if (!fragrance) {
      return jsonError("fragrance not found", 404);
    }

    const occasionCol = await getNamedEntityCollection("occasion");
    const scentCol = await getNamedEntityCollection("scent_type");
    const reviewsCol = await getReviewsCollection();

    const [occasions, scentTypes, aggregate] = await Promise.all([
      fragrance.occasion?.length
        ? occasionCol.find({ _id: { $in: fragrance.occasion } }).toArray()
        : Promise.resolve([]),
      fragrance.scent_type?.length
        ? scentCol.find({ _id: { $in: fragrance.scent_type } }).toArray()
        : Promise.resolve([]),
      reviewsCol
        .aggregate<{
          total_votes: number;
          average_rating: number | null;
          reviews: { name: string; review: string; rating: number }[];
        }>([
          {
            $match: {
              fragrance_id: fragranceObjectId,
              approval: true,
            },
          },
          {
            $facet: {
              stats: [
                {
                  $group: {
                    _id: null,
                    total_votes: { $sum: 1 },
                    average_rating: { $avg: "$rating" },
                  },
                },
              ],
              reviews: [
                { $sort: { created_at: -1 } },
                {
                  $project: {
                    _id: 0,
                    name: 1,
                    review: 1,
                    rating: 1,
                  },
                },
              ],
            },
          },
          {
            $project: {
              total_votes: {
                $ifNull: [{ $arrayElemAt: ["$stats.total_votes", 0] }, 0],
              },
              average_rating: {
                $ifNull: [{ $arrayElemAt: ["$stats.average_rating", 0] }, null],
              },
              reviews: 1,
            },
          },
        ])
        .toArray(),
    ]);

    const stats = aggregate[0];
    const totalVotes = stats?.total_votes ?? 0;
    const average =
      stats?.average_rating == null
        ? null
        : Math.round(stats.average_rating * 100) / 100;

    return NextResponse.json({
      ok: true,
      fragrance: {
        id: fragrance._id!.toHexString(),
        name: fragrance.name,
        brand: fragrance.brand,
        occasion: occasions.map((o) => ({
          id: o._id!.toHexString(),
          name: o.name,
          description: o.description,
        })),
        scent_type: scentTypes.map((s) => ({
          id: s._id!.toHexString(),
          name: s.name,
          description: s.description,
        })),
        associate_links: fragrance.associate_links ?? [],
      },
      total_votes: totalVotes,
      average_rating: average,
      reviews: stats?.reviews ?? [],
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    return jsonError(message, 500);
  }
}
