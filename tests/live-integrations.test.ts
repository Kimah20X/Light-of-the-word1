import { describe, expect, it } from "vitest";
import { MongoClient } from "mongodb";
import { ENV } from "../backend/_core/env";
import { fetchApiBibleChapter } from "../backend/api-bible";

// Explicitly opt in: normal unit tests must not depend on paid/provider network access.
describe.runIf(process.env.RUN_LIVE_INTEGRATION_TESTS === "1")("live backend credentials", () => {
  it("uses the configured key and English KJV edition to fetch Romans 6", async () => {
    if (!ENV.apiBibleKey.trim() || !ENV.apiBibleBibleId.trim()) {
      throw new Error("APIBIBLE_API_KEY and APIBIBLE_BIBLE_ID are required for this live test.");
    }
    const chapter = await fetchApiBibleChapter("Romans", 6);
    expect(chapter.book).toBe("Romans");
    expect(chapter.chapter).toBe(6);
    expect(chapter.verses.find((verse) => verse.number === 2)?.text).toMatch(/God forbid/i);
    expect(chapter.verseCount).toBeGreaterThan(2);
  }, 35_000);

  it("authenticates to MongoDB and pings the configured database", async () => {
    if (!ENV.mongoUri.trim()) throw new Error("MONGODB_URI is required for this live test.");
    let client: MongoClient | undefined;
    try {
      client = new MongoClient(ENV.mongoUri, { serverSelectionTimeoutMS: 8_000 });
      await client.connect();
      const name = process.env.MONGODB_DATABASE?.trim();
      const response = await (name ? client.db(name) : client.db()).command({ ping: 1 });
      expect(response.ok).toBe(1);
    } catch {
      // Do not print a driver exception: it can contain the URI/hostname/credentials.
      throw new Error("MongoDB validation failed. Check the URI, database-user credentials, TLS, and network access rules.");
    } finally {
      await client?.close();
    }
  }, 15_000);
});
