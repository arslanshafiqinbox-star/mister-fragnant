import { NextRequest, NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getNamedEntityCollection,
  type NamedEntityDoc,
} from "@/lib/mongodb";

type EntityInput = {
  id?: string;
  name?: string;
  description?: string | null;
};

function jsonError(message: string, status: number, details?: unknown) {
  return NextResponse.json({ ok: false, message, details }, { status });
}

function serialize(doc: NamedEntityDoc & { _id: ObjectId }) {
  return {
    id: doc._id.toHexString(),
    name: doc.name,
    description: doc.description,
  };
}

export function createNamedEntityCrud(
  collectionName: "scent_type" | "occasion"
) {
  async function GET() {
    try {
      const col = await getNamedEntityCollection(collectionName);
      const docs = await col.find({}).sort({ name: 1 }).toArray();

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

  async function POST(request: NextRequest) {
    try {
      const body = (await request.json()) as EntityInput;
      const name = body.name?.trim();
      if (!name) {
        return jsonError("name is required", 400);
      }

      const col = await getNamedEntityCollection(collectionName);
      const doc: NamedEntityDoc = {
        name,
        description: body.description?.trim() || null,
      };
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

  async function PUT(request: NextRequest) {
    try {
      const body = (await request.json()) as EntityInput;
      if (!body.id) {
        return jsonError("id is required", 400);
      }
      if (!ObjectId.isValid(body.id)) {
        return jsonError("invalid id", 400);
      }

      const updates: Partial<NamedEntityDoc> = {};
      if (typeof body.name === "string") {
        const name = body.name.trim();
        if (!name) return jsonError("name cannot be empty", 400);
        updates.name = name;
      }
      if (body.description !== undefined) {
        updates.description =
          typeof body.description === "string"
            ? body.description.trim() || null
            : null;
      }

      if (Object.keys(updates).length === 0) {
        return jsonError("nothing to update", 400);
      }

      const col = await getNamedEntityCollection(collectionName);
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
        row: serialize({ ...result, _id: result._id! }),
      });
    } catch (e) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return jsonError(message, 500);
    }
  }

  async function DELETE(request: NextRequest) {
    try {
      const id = request.nextUrl.searchParams.get("id");
      if (!id) {
        return jsonError("id query param is required", 400);
      }
      if (!ObjectId.isValid(id)) {
        return jsonError("invalid id", 400);
      }

      const col = await getNamedEntityCollection(collectionName);
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

  return { GET, POST, PUT, DELETE };
}
