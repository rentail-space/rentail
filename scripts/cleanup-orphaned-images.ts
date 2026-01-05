#!/usr/bin/env tsx

/**
 * Clean up orphaned mall images that aren't referenced in any seed files
 *
 * This script:
 * 1. Reads all JSON files in prisma/seed (recursively)
 * 2. Extracts all image URLs from imageURLs arrays
 * 3. Finds images in public/images/malls not referenced
 * 4. Deletes orphaned images
 *
 * Usage: tsx scripts/cleanup-orphaned-images.ts
 */

import { readdir, readFile, unlink } from "node:fs/promises";
import { join } from "node:path";
import ora from "ora";

const SEED_DIR = join(process.cwd(), "prisma", "seed");
const IMAGES_DIR = join(process.cwd(), "public", "images", "malls");

/**
 * Recursively find all JSON files in a directory
 */
async function findJsonFiles(dir: string): Promise<string[]> {
  const files: string[] = [];
  const entries = await readdir(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...(await findJsonFiles(fullPath)));
    } else if (entry.isFile() && entry.name.endsWith(".json")) {
      files.push(fullPath);
    }
  }

  return files;
}

/**
 * Extract image URLs from a JSON file
 */
async function extractImageURLs(filepath: string): Promise<string[]> {
  try {
    const content = await readFile(filepath, "utf-8");
    const data = JSON.parse(content);

    // Look for imageURLs array
    if (Array.isArray(data.imageURLs)) {
      return data.imageURLs;
    }

    return [];
  } catch (error) {
    console.warn(`Failed to parse ${filepath}:`, error);
    return [];
  }
}

async function cleanupOrphanedImages() {
  const spinner = ora("Finding seed files...").start();

  try {
    // Find all JSON files in seed directory
    const jsonFiles = await findJsonFiles(SEED_DIR);
    spinner.succeed(`Found ${jsonFiles.length} seed files`);

    // Extract all referenced image URLs
    spinner.start("Extracting image references...");
    const referencedImages = new Set<string>();

    for (const file of jsonFiles) {
      const urls = await extractImageURLs(file);
      for (const url of urls) {
        // Convert URL like "/images/malls/ca-beverly-center-1.jpg" to filename
        const filename = url.split("/").pop();
        if (filename) {
          referencedImages.add(filename);
        }
      }
    }

    spinner.succeed(`Found ${referencedImages.size} referenced images`);

    // Get all images in the malls directory
    spinner.start("Scanning mall images directory...");
    const allImages = await readdir(IMAGES_DIR);
    const imageFiles = allImages.filter((file) =>
      /\.(jpg|jpeg|png|webp)$/i.test(file),
    );

    spinner.succeed(`Found ${imageFiles.length} total images`);

    // Find orphaned images
    const orphanedImages = imageFiles.filter(
      (image) => !referencedImages.has(image),
    );

    if (orphanedImages.length === 0) {
      console.log("\n✓ No orphaned images found!");
      return;
    }

    console.log(`\n⚠ Found ${orphanedImages.length} orphaned images:`);
    for (const image of orphanedImages) {
      console.log(`  - ${image}`);
    }

    // Delete orphaned images
    spinner.start(`Deleting ${orphanedImages.length} orphaned images...`);
    let deleted = 0;
    let failed = 0;

    for (const image of orphanedImages) {
      try {
        await unlink(join(IMAGES_DIR, image));
        deleted++;
      } catch (error) {
        console.error(`Failed to delete ${image}:`, error);
        failed++;
      }
    }

    spinner.succeed(
      `Deleted ${deleted} orphaned images${failed > 0 ? `, ${failed} failed` : ""}`,
    );

    // Summary
    console.log("\n✓ Cleanup complete");
    console.log(`  Referenced images: ${referencedImages.size}`);
    console.log(`  Orphaned images deleted: ${deleted}`);
    console.log(`  Remaining images: ${imageFiles.length - deleted}`);
  } catch (error) {
    spinner.fail(
      `Failed: ${error instanceof Error ? error.message : String(error)}`,
    );
    process.exit(1);
  }
}

await cleanupOrphanedImages();
