import { createHash, randomBytes, scrypt as nodeScrypt, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { MongoClient, ObjectId, type Collection, type Db } from "mongodb";
import { ENV } from "./_core/env";

const scrypt = promisify(nodeScrypt);
const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000;
const SCRYPT_KEY_BYTES = 64;
const SCRYPT_SALT_BYTES = 16;

export type MongoAccount = {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  passwordSalt: string;
  authProvider: "password";
  createdAt: Date;
  updatedAt: Date;
  lastSignedIn: Date;
};

type AccountSession = {
  _id?: ObjectId;
  userId: ObjectId;
  tokenHash: string;
  createdAt: Date;
  expiresAt: Date;
  revokedAt: Date | null;
};

export type PublicAccount = {
  id: string;
  openId: null;
  name: string;
  email: string;
  loginMethod: "password";
  authProvider: "password";
  lastSignedIn: string;
};

let mongoClient: MongoClient | null = null;
let mongoConnecting: Promise<Db> | null = null;
let indexesReady: Promise<void> | null = null;

export async function getMongoDb(): Promise<Db> {
  if (!ENV.mongoUri.trim()) throw new Error("MongoDB is not configured. Add MONGODB_URI in project secrets.");
  if (!mongoConnecting) {
    mongoConnecting = (async () => {
      mongoClient = new MongoClient(ENV.mongoUri, {
        serverSelectionTimeoutMS: 8_000,
        maxPoolSize: 10,
      });
      await mongoClient.connect();
      const databaseName = process.env.MONGODB_DATABASE?.trim();
      const db = databaseName ? mongoClient.db(databaseName) : mongoClient.db();
      await ensureIndexes(db);
      return db;
    })().catch((error) => {
      mongoConnecting = null;
      mongoClient = null;
      throw error;
    });
  }
  return mongoConnecting;
}

async function ensureIndexes(db: Db) {
  if (!indexesReady) {
    indexesReady = Promise.all([
      db.collection<MongoAccount>("accounts").createIndex({ email: 1 }, { unique: true, name: "account_email_unique" }),
      db.collection<AccountSession>("accountSessions").createIndex({ tokenHash: 1 }, { unique: true, name: "account_token_hash_unique" }),
      db.collection<AccountSession>("accountSessions").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0, name: "account_session_expiry_ttl" }),
      db.collection<AccountSession>("accountSessions").createIndex({ userId: 1, revokedAt: 1 }, { name: "account_session_user_revoked" }),
    ]).then(() => undefined).catch((error) => {
      indexesReady = null;
      throw error;
    });
  }
  await indexesReady;
}

function accountCollection(db: Db) {
  return db.collection<MongoAccount>("accounts");
}
function sessionCollection(db: Db) {
  return db.collection<AccountSession>("accountSessions");
}

export function normalizeAccountEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function hashAccountPassword(password: string, salt = randomBytes(SCRYPT_SALT_BYTES).toString("base64url")) {
  const derived = await scrypt(password, Buffer.from(salt, "base64url"), SCRYPT_KEY_BYTES) as Buffer;
  return { salt, hash: derived.toString("base64url") };
}

export async function verifyAccountPassword(password: string, salt: string, expectedHash: string) {
  try {
    const actual = Buffer.from((await hashAccountPassword(password, salt)).hash, "base64url");
    const expected = Buffer.from(expectedHash, "base64url");
    return actual.length === expected.length && timingSafeEqual(actual, expected);
  } catch {
    return false;
  }
}

export function accountToPublic(account: MongoAccount): PublicAccount {
  return {
    id: account._id.toHexString(),
    openId: null,
    name: account.name,
    email: account.email,
    loginMethod: "password",
    authProvider: "password",
    lastSignedIn: account.lastSignedIn.toISOString(),
  };
}

export async function createAccount(input: { name: string; email: string; password: string }) {
  const db = await getMongoDb();
  const now = new Date();
  const credentials = await hashAccountPassword(input.password);
  const account: Omit<MongoAccount, "_id"> = {
    email: normalizeAccountEmail(input.email),
    name: input.name.trim(),
    passwordHash: credentials.hash,
    passwordSalt: credentials.salt,
    authProvider: "password",
    createdAt: now,
    updatedAt: now,
    lastSignedIn: now,
  };
  const result = await accountCollection(db).insertOne(account as MongoAccount);
  const created = { ...account, _id: result.insertedId } as MongoAccount;
  const session = await issueAccountSession(db, created._id);
  return { user: accountToPublic(created), ...session };
}

export async function signInAccount(email: string, password: string) {
  const db = await getMongoDb();
  const accounts = accountCollection(db);
  const account = await accounts.findOne({ email: normalizeAccountEmail(email) });
  if (!account || !(await verifyAccountPassword(password, account.passwordSalt, account.passwordHash))) return null;
  const now = new Date();
  await accounts.updateOne({ _id: account._id }, { $set: { lastSignedIn: now, updatedAt: now } });
  const current = { ...account, lastSignedIn: now };
  const session = await issueAccountSession(db, account._id);
  return { user: accountToPublic(current), ...session };
}

async function issueAccountSession(db: Db, userId: ObjectId) {
  const token = randomBytes(32).toString("base64url");
  const now = new Date();
  const expiresAt = new Date(now.getTime() + SESSION_TTL_MS);
  await sessionCollection(db).insertOne({
    userId,
    tokenHash: hashSessionToken(token),
    createdAt: now,
    expiresAt,
    revokedAt: null,
  });
  return { token, expiresAt };
}

export function hashSessionToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

export async function findAccountForSessionToken(token: string) {
  if (!token || token.length > 256) return null;
  const db = await getMongoDb();
  const session = await sessionCollection(db).findOne({
    tokenHash: hashSessionToken(token),
    expiresAt: { $gt: new Date() },
    revokedAt: null,
  });
  if (!session) return null;
  const account = await accountCollection(db).findOne({ _id: session.userId });
  return account ? accountToPublic(account) : null;
}

export async function revokeAccountSession(token: string) {
  if (!token || token.length > 256) return;
  const db = await getMongoDb();
  await sessionCollection(db).updateOne(
    { tokenHash: hashSessionToken(token), revokedAt: null },
    { $set: { revokedAt: new Date() } },
  );
}

export async function closeMongoConnectionForTests() {
  if (mongoClient) await mongoClient.close();
  mongoClient = null;
  mongoConnecting = null;
  indexesReady = null;
}

export const ACCOUNT_SESSION_TTL_MS = SESSION_TTL_MS;
