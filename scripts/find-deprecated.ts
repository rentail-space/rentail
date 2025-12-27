#!/usr/bin/env tsx
/**
 * Script to find deprecated method usage in the codebase
 * 
 * Usage:
 *   pnpm tsx scripts/find-deprecated.ts
 *   pnpm tsx scripts/find-deprecated.ts --method "methodName"
 */

import { execSync } from "node:child_process";
import { readFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const args = process.argv.slice(2);
const methodFilter = args.find((arg) => arg.startsWith("--method="))?.split("=")[1];

interface DeprecatedUsage {
  file: string;
  line: number;
  content: string;
  type: "jsdoc" | "comment" | "usage";
}

const results: DeprecatedUsage[] = [];

function findInFile(filePath: string): DeprecatedUsage[] {
  const content = readFileSync(filePath, "utf-8");
  const lines = content.split("\n");
  const usages: DeprecatedUsage[] = [];

  lines.forEach((line, index) => {
    const lineNum = index + 1;
    const lowerLine = line.toLowerCase();

    // Check for @deprecated JSDoc tags
    if (lowerLine.includes("@deprecated")) {
      usages.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: "jsdoc",
      });
    }

    // Check for "deprecated" in comments
    if (
      (lowerLine.includes("// deprecated") ||
        lowerLine.includes("/* deprecated") ||
        lowerLine.includes("* deprecated")) &&
      !lowerLine.includes("@deprecated")
    ) {
      usages.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: "comment",
      });
    }

    // If method filter is provided, search for usage
    if (methodFilter && line.includes(methodFilter)) {
      usages.push({
        file: filePath,
        line: lineNum,
        content: line.trim(),
        type: "usage",
      });
    }
  });

  return usages;
}

function walkDir(dir: string, extensions: string[]): string[] {
  const files: string[] = [];
  const entries = readdirSync(dir);

  for (const entry of entries) {
    const fullPath = join(dir, entry);
    const stat = statSync(fullPath);

    if (stat.isDirectory()) {
      // Skip common directories
      if (
        entry === "node_modules" ||
        entry === ".git" ||
        entry === "build" ||
        entry === ".react-router" ||
        entry === ".vercel" ||
        entry === "dist" ||
        entry === ".next"
      ) {
        continue;
      }
      files.push(...walkDir(fullPath, extensions));
    } else if (stat.isFile()) {
      const ext = entry.split(".").pop();
      if (ext && extensions.includes(ext)) {
        files.push(fullPath);
      }
    }
  }

  return files;
}

console.log("🔍 Searching for deprecated methods...\n");

// Find all TypeScript/JavaScript files
const sourceFiles = walkDir(process.cwd(), ["ts", "tsx", "js", "jsx"]);

// Search each file
for (const file of sourceFiles) {
  const usages = findInFile(file);
  results.push(...usages);
}

// Check TypeScript compiler warnings
console.log("📋 Checking TypeScript compiler warnings...\n");
try {
  const tscOutput = execSync("pnpm run typecheck 2>&1", {
    encoding: "utf-8",
    cwd: process.cwd(),
  });
  const deprecatedWarnings = tscOutput
    .split("\n")
    .filter((line) => line.toLowerCase().includes("deprecated"));

  if (deprecatedWarnings.length > 0) {
    console.log("⚠️  TypeScript deprecated warnings:\n");
    deprecatedWarnings.forEach((warning) => console.log(`  ${warning}`));
    console.log();
  }
} catch (error) {
  // Typecheck might fail, but we still want to see deprecated warnings
  const output = (error as { stdout?: string; stderr?: string }).stdout || "";
  const deprecatedWarnings = output
    .split("\n")
    .filter((line) => line.toLowerCase().includes("deprecated"));

  if (deprecatedWarnings.length > 0) {
    console.log("⚠️  TypeScript deprecated warnings:\n");
    deprecatedWarnings.forEach((warning) => console.log(`  ${warning}`));
    console.log();
  }
}

// Display results
if (results.length === 0) {
  console.log("✅ No deprecated methods found in source code.\n");
} else {
  console.log(`📊 Found ${results.length} deprecated usage(s):\n`);

  const grouped = results.reduce(
    (acc, usage) => {
      if (!acc[usage.file]) {
        acc[usage.file] = [];
      }
      acc[usage.file].push(usage);
      return acc;
    },
    {} as Record<string, DeprecatedUsage[]>,
  );

  for (const [file, usages] of Object.entries(grouped)) {
    const relativePath = file.replace(process.cwd() + "/", "");
    console.log(`📄 ${relativePath}:`);
    usages.forEach((usage) => {
      const icon =
        usage.type === "jsdoc"
          ? "📝"
          : usage.type === "comment"
            ? "💬"
            : "🔧";
      console.log(`  ${icon} Line ${usage.line}: ${usage.content}`);
    });
    console.log();
  }
}

// Check npm package deprecations
console.log("📦 Checking for deprecated npm packages...\n");
try {
  const npmOutdated = execSync("pnpm outdated --json 2>/dev/null || echo '{}'", {
    encoding: "utf-8",
  });
  const outdated = JSON.parse(npmOutdated);
  const deprecated = Object.entries(outdated).filter(
    ([, pkg]: [string, unknown]) => {
      const p = pkg as { deprecated?: boolean };
      return p.deprecated === true;
    },
  );

  if (deprecated.length > 0) {
    console.log("⚠️  Deprecated packages found:\n");
    deprecated.forEach(([name]) => {
      console.log(`  - ${name}`);
    });
  } else {
    console.log("✅ No deprecated packages found.\n");
  }
} catch (error) {
  console.log("⚠️  Could not check package deprecations.\n");
}

console.log("\n💡 Tips:");
console.log("  - Use TypeScript's @deprecated JSDoc tag to mark deprecated methods");
console.log("  - Run 'pnpm run typecheck' to see TypeScript deprecation warnings");
console.log("  - Check library documentation for deprecated APIs");
console.log("  - Use 'pnpm outdated' to find deprecated packages");

