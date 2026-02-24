import { db } from "./db";
import { sanctuaryPixels } from "../shared/schema";
import { eq } from "drizzle-orm";
import * as fs from "fs";
import * as path from "path";

export async function seedSanctuaryPixels() {
  try {
    const existing = await db.select().from(sanctuaryPixels);
    if (existing.length > 0) {
      console.log(`[seed] ${existing.length} sanctuary pixels already exist, skipping seed`);
      return;
    }

    let seedPath = path.join(__dirname, "seed-pixels.json");
    if (!fs.existsSync(seedPath)) {
      seedPath = path.join(process.cwd(), "server", "seed-pixels.json");
    }
    if (!fs.existsSync(seedPath)) {
      console.log("[seed] No seed-pixels.json found, skipping");
      return;
    }

    const seedData = JSON.parse(fs.readFileSync(seedPath, "utf-8"));
    console.log(`[seed] Seeding ${seedData.length} sanctuary pixels...`);

    for (const pixel of seedData) {
      await db.insert(sanctuaryPixels).values({
        plotIndex: pixel.plotIndex,
        ownerName: pixel.ownerName,
        color: pixel.color,
        imageUrl: pixel.imageUrl || null,
        groupId: pixel.groupId || null,
        walletAddress: pixel.walletAddress || null,
        txSignature: pixel.txSignature || null,
      }).onConflictDoNothing();
    }

    console.log(`[seed] Successfully seeded ${seedData.length} sanctuary pixels`);
  } catch (e: any) {
    console.error("[seed] Error seeding sanctuary pixels:", e.message);
  }
}
