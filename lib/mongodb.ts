import { MongoClient, Db, type Collection, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

/**
 * Atlas on Vercel often fails TLS with the legacy host list + ssl=true string.
 * On Vercel we convert to mongodb+srv (SRV DNS works there).
 * Locally many Windows DNS setups refuse SRV lookups, so keep the host list.
 */
function normalizeMongoUri(raw: string): string {
  let value = raw.trim();

  // Strip wrapping quotes that sometimes get pasted into Vercel env vars
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }

  if (value.startsWith("mongodb+srv://")) {
    return ensureSrvQuery(value);
  }

  const onVercel = Boolean(process.env.VERCEL);

  // Convert legacy mongodb://shard-00-00.host,... → mongodb+srv (Vercel only)
  if (onVercel) {
    const legacy = value.match(
      /^mongodb:\/\/([^@]+)@([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/i
    );
    if (legacy) {
      const [, auth, hosts, dbName = "", query = ""] = legacy;
      const firstHost = hosts.split(",")[0]?.trim() ?? "";
      const hostNoPort = firstHost.replace(/:\d+$/, "");
      const atlasBase = hostNoPort.match(/^[^.]+\.(.+)$/);
      if (atlasBase && /\.mongodb\.net$/i.test(atlasBase[1])) {
        const clusterHost = `cluster0.${atlasBase[1]}`;
        const params = new URLSearchParams(query);
        params.delete("ssl");
        params.delete("replicaSet");
        params.delete("tls");
        if (!params.has("retryWrites")) params.set("retryWrites", "true");
        if (!params.has("w")) params.set("w", "majority");
        if (!params.has("appName") && !params.has("appname")) {
          params.set("appName", "fragnance");
        }
        const path = dbName ? `/${dbName}` : "/";
        return `mongodb+srv://${auth}@${clusterHost}${path}?${params.toString()}`;
      }
    }
  }

  // Local / fallback: convert ssl=true → tls=true (driver prefers tls)
  value = value.replace(/([?&])ssl=true/gi, "$1tls=true");
  value = value.replace(/([?&])ssl=1/gi, "$1tls=true");

  if (!/[?&]tls=/i.test(value)) {
    value += value.includes("?") ? "&tls=true" : "?tls=true";
  }
  if (!/[?&]retryWrites=/i.test(value)) {
    value += "&retryWrites=true";
  }
  if (!/[?&]w=/i.test(value)) {
    value += "&w=majority";
  }

  return value;
}

function ensureSrvQuery(value: string): string {
  const [base, query = ""] = value.split("?");
  const params = new URLSearchParams(query);
  if (!params.has("retryWrites")) params.set("retryWrites", "true");
  if (!params.has("w")) params.set("w", "majority");
  const q = params.toString();
  return q ? `${base}?${q}` : base;
}

function clientOptions(): MongoClientOptions {
  const onVercel = Boolean(process.env.VERCEL);

  return {
    serverSelectionTimeoutMS: 20000,
    connectTimeoutMS: 20000,
    socketTimeoutMS: 45000,
    maxPoolSize: onVercel ? 5 : 10,
    minPoolSize: 0,
    // Prevents Happy-Eyeballs IPv6-first failures against Atlas
    autoSelectFamily: false,
    // Prefer IPv4 everywhere (Windows local + Vercel)
    family: 4,
  };
}

function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment");
  }

  const normalized = normalizeMongoUri(uri);
  const client = new MongoClient(normalized, clientOptions());
  return client.connect();
}

function getClientPromise(): Promise<MongoClient> {
  // Always cache on the global — required for Vercel warm serverless reuse
  if (!global._mongoClientPromise) {
    global._mongoClientPromise = createClientPromise().catch((err) => {
      global._mongoClientPromise = undefined;
      throw err;
    });
  }
  return global._mongoClientPromise;
}

export async function getDb(dbName = "fragnance"): Promise<Db> {
  const client = await getClientPromise();
  return client.db(dbName);
}

/** Used by /api/health/db — does not expose secrets */
export function getMongoUriDiagnostics() {
  const raw = process.env.MONGODB_URI ?? "";
  const normalized = raw ? normalizeMongoUri(raw) : "";
  return {
    present: Boolean(raw),
    length: raw.length,
    rawIsSrv: raw.trim().startsWith("mongodb+srv://"),
    normalizedIsSrv: normalized.startsWith("mongodb+srv://"),
    hasTlsFlag: /[?&]tls=true/i.test(normalized),
    hasSslFlag: /[?&]ssl=true/i.test(raw),
    hostPreview: normalized
      ? normalized.replace(/\/\/[^@]+@/, "//***:***@").slice(0, 140)
      : null,
    onVercel: Boolean(process.env.VERCEL),
    node: process.version,
  };
}

export type ConnectionTestDoc = {
  _id?: import("mongodb").ObjectId;
  title: string;
  body: string | null;
  created_at: Date;
  updated_at: Date;
};

export async function getConnectionTestsCollection(): Promise<
  Collection<ConnectionTestDoc>
> {
  const db = await getDb();
  return db.collection<ConnectionTestDoc>("connection_tests");
}

export type NamedEntityDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  description: string | null;
};

export async function getNamedEntityCollection(
  name: "scent_type" | "occasion"
): Promise<Collection<NamedEntityDoc>> {
  const db = await getDb();
  return db.collection<NamedEntityDoc>(name);
}

export type AssociateLink = {
  name: string;
  link: string;
};

export type FragranceDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  brand: string;
  occasion: import("mongodb").ObjectId[];
  scent_type: import("mongodb").ObjectId[];
  associate_links: AssociateLink[];
  created_at: Date;
  updated_at: Date;
};

export async function getFragrancesCollection(): Promise<
  Collection<FragranceDoc>
> {
  const db = await getDb();
  return db.collection<FragranceDoc>("fragrances");
}

export type ReviewDoc = {
  _id?: import("mongodb").ObjectId;
  fragrance_id: import("mongodb").ObjectId;
  name: string;
  review: string;
  approval: boolean;
  rating: number;
  created_at: Date;
  updated_at: Date;
};

export async function getReviewsCollection(): Promise<Collection<ReviewDoc>> {
  const db = await getDb();
  return db.collection<ReviewDoc>("reviews");
}

export type BlogDoc = {
  _id?: import("mongodb").ObjectId;
  title: string;
  provider: string;
  description: string;
  author: string;
  /** Marks a note as sponsored content */
  sponsored: boolean;
  created_at: Date;
  updated_at: Date;
};

export async function getBlogsCollection(): Promise<Collection<BlogDoc>> {
  const db = await getDb();
  return db.collection<BlogDoc>("blogs");
}

export type SponsoredPerfumeRetailer = {
  name: string;
  url: string;
};

export type SponsoredPerfumeDetails = {
  brand: string;
  description: string;
  rating: number;
  retailers: SponsoredPerfumeRetailer[];
};

export type SponsoredPerfumeDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  scent_type: import("mongodb").ObjectId[];
  occasion: import("mongodb").ObjectId[];
  details: SponsoredPerfumeDetails;
  created_at: Date;
  updated_at: Date;
};

export async function getSponsoredPerfumesCollection(): Promise<
  Collection<SponsoredPerfumeDoc>
> {
  const db = await getDb();
  return db.collection<SponsoredPerfumeDoc>("sponsored_perfumes");
}

/** Structured comparison payload for perfume alternatives */
export type AlternativeFragrancePrice = {
  amount: number;
  currency: string;
  size: string;
};

export type AlternativeFragranceSide = {
  name: string;
  brand: string;
  price: AlternativeFragrancePrice;
  notes: string[];
};

export type AlternativeComparison = {
  closeness: string;
  comparison: {
    fragrance1: AlternativeFragranceSide;
    fragrance2: AlternativeFragranceSide;
  };
  review: {
    summary: string;
    performance: string;
    disclaimer: string;
  };
};

export type AlternativeDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  scent_type: import("mongodb").ObjectId[];
  occasion: import("mongodb").ObjectId[];
  comparison: AlternativeComparison;
  created_at: Date;
  updated_at: Date;
};

export async function getAlternativesCollection(): Promise<
  Collection<AlternativeDoc>
> {
  const db = await getDb();
  return db.collection<AlternativeDoc>("alternatives");
}

export type FilmDetails = {
  brand: string;
  location: { city: string; country: string };
  date: string;
  duration: string;
  url: string;
  description: string;
};

export type FilmDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  details: FilmDetails;
  created_at: Date;
  updated_at: Date;
};

export async function getFilmsCollection(): Promise<Collection<FilmDoc>> {
  const db = await getDb();
  return db.collection<FilmDoc>("films");
}

export type NewsletterEmailDoc = {
  _id?: import("mongodb").ObjectId;
  email: string;
  created_at: Date;
  updated_at: Date;
};

export async function getNewsletterEmailsCollection(): Promise<
  Collection<NewsletterEmailDoc>
> {
  const db = await getDb();
  return db.collection<NewsletterEmailDoc>("newsletter_emails");
}
