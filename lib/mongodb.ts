import dns from "node:dns";
import { Resolver } from "node:dns/promises";
import { MongoClient, Db, type Collection, type MongoClientOptions } from "mongodb";

const uri = process.env.MONGODB_URI;

declare global {
  // eslint-disable-next-line no-var
  var _mongoClientPromise: Promise<MongoClient> | undefined;
}

const PUBLIC_DNS = ["8.8.8.8", "8.8.4.4", "1.1.1.1"];

if (!process.env.VERCEL) {
  try {
    dns.setServers(PUBLIC_DNS);
  } catch {
    // Some environments lock the resolver; we still rewrite +srv below.
  }
}

function stripMongoUri(raw: string): string {
  let value = raw.trim();
  if (
    (value.startsWith('"') && value.endsWith('"')) ||
    (value.startsWith("'") && value.endsWith("'"))
  ) {
    value = value.slice(1, -1);
  }
  return value;
}

function parseMongoUri(value: string) {
  const m = value.match(
    /^(mongodb(?:\+srv)?):\/\/([^@]+)@([^/?]+)(?:\/([^?]*))?(?:\?(.*))?$/i
  );
  if (!m) return null;
  return {
    scheme: m[1].toLowerCase(),
    auth: m[2],
    host: m[3],
    dbName: m[4] ?? "",
    query: m[5] ?? "",
  };
}

function seedListUri(
  auth: string,
  dbName: string,
  query: string,
  seeds: string[]
): string {
  const params = new URLSearchParams(query);
  params.delete("ssl");
  if (!params.has("tls")) params.set("tls", "true");
  if (!params.has("retryWrites")) params.set("retryWrites", "true");
  if (!params.has("w")) params.set("w", "majority");
  if (!params.has("authSource")) params.set("authSource", "admin");
  if (!params.has("appName") && !params.has("appname")) {
    params.set("appName", "fragnance");
  }
  const path = dbName ? `/${dbName}` : "/";
  return `mongodb://${auth}@${seeds.join(",")}${path}?${params.toString()}`;
}

/** Atlas SRV host cluster0.xxxx.mongodb.net → shard-00-00/01/02 seed list */
function guessedAtlasSeeds(hostname: string): string[] {
  const host = hostname.replace(/:\d+$/, "");
  const dot = host.indexOf(".");
  if (dot < 1 || !/\.mongodb\.net$/i.test(host)) return [];
  const cluster = host.slice(0, dot);
  const rest = host.slice(dot + 1);
  return [0, 1, 2].map((n) => `${cluster}-shard-00-0${n}.${rest}:27017`);
}

function srvToGuessedSeedUri(value: string): string | null {
  const parsed = parseMongoUri(value);
  if (!parsed) return null;
  const seeds = guessedAtlasSeeds(parsed.host);
  if (!seeds.length) return null;
  return seedListUri(parsed.auth, parsed.dbName, parsed.query, seeds);
}

/**
 * Windows ISP DNS often returns EREFUSED for `_mongodb._tcp.*`.
 * Resolve SRV via public DNS (or guessed Atlas hosts) and connect without +srv.
 */
async function srvToStandardUri(value: string): Promise<string> {
  const parsed = parseMongoUri(value);
  if (!parsed) return ensureSrvQuery(value);

  const hostname = parsed.host.replace(/:\d+$/, "");
  try {
    const resolver = new Resolver();
    resolver.setServers(PUBLIC_DNS);
    const records = await resolver.resolveSrv(`_mongodb._tcp.${hostname}`);
    const seeds = records
      .sort((a, b) => a.priority - b.priority || b.weight - a.weight)
      .map((r) => `${r.name.replace(/\.$/, "")}:${r.port}`);
    if (!seeds.length) throw new Error("empty SRV");

    let query = parsed.query;
    try {
      const txt = await resolver.resolveTxt(hostname);
      const extra = new URLSearchParams(txt.flat().join("").replace(/"/g, ""));
      const params = new URLSearchParams(query);
      extra.forEach((v, k) => {
        if (!params.has(k)) params.set(k, v);
      });
      query = params.toString();
    } catch {
      // TXT is optional
    }

    return seedListUri(parsed.auth, parsed.dbName, query, seeds);
  } catch {
    const guessed = srvToGuessedSeedUri(value);
    return guessed ?? ensureSrvQuery(value);
  }
}

/**
 * Atlas on Vercel often fails TLS with the legacy host list + ssl=true string.
 * On Vercel we convert to mongodb+srv (SRV DNS works there).
 * Locally many Windows DNS setups refuse SRV lookups, so keep the host list.
 */
function normalizeMongoUri(raw: string): string {
  let value = stripMongoUri(raw);

  if (value.startsWith("mongodb+srv://")) {
    if (!process.env.VERCEL) {
      return srvToGuessedSeedUri(value) ?? ensureSrvQuery(value);
    }
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

async function resolveMongoUri(raw: string): Promise<string> {
  const value = stripMongoUri(raw);
  if (value.startsWith("mongodb+srv://") && !process.env.VERCEL) {
    return srvToStandardUri(value);
  }
  return normalizeMongoUri(raw);
}

async function createClientPromise(): Promise<MongoClient> {
  if (!uri) {
    throw new Error("Missing MONGODB_URI in environment");
  }

  const normalized = await resolveMongoUri(uri);
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

export type NamedEntityCollectionName =
  | "scent_type"
  | "occasion"
  | "gender"
  | "strength";

export type NamedEntityDoc = {
  _id?: import("mongodb").ObjectId;
  name: string;
  description: string | null;
};

export async function getNamedEntityCollection(
  name: NamedEntityCollectionName
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
  gender?: import("mongodb").ObjectId[];
  strength?: import("mongodb").ObjectId[];
  approx_price?: string | null;
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
  gender?: import("mongodb").ObjectId[];
  strength?: import("mongodb").ObjectId[];
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
