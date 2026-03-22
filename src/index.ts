import { registerSchema as registerSchema4 } from "@hyperjump/json-schema/draft-04";
import { registerSchema as registerSchema6 } from "@hyperjump/json-schema/draft-06";
import { registerSchema as registerSchema7 } from "@hyperjump/json-schema/draft-07";
import { registerSchema as registerSchema2019 } from "@hyperjump/json-schema/draft-2019-09";
import { registerSchema as registerSchema2020 } from "@hyperjump/json-schema/draft-2020-12";

import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";

import { generateHTMLReport } from "./generateHTML.js";

import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));



const DRAFTS = [
  { name: "draft-04", dialectId: "http://json-schema.org/draft-04/schema", registerSchema: registerSchema4, compatibilityValue: 4 },
  { name: "draft-06", dialectId: "http://json-schema.org/draft-06/schema", registerSchema: registerSchema6, compatibilityValue: 6 },
  { name: "draft-07", dialectId: "http://json-schema.org/draft-07/schema", registerSchema: registerSchema7, compatibilityValue: 7 },
  { name: "draft-2019-09", dialectId: "https://json-schema.org/draft/2019-09/schema", registerSchema: registerSchema2019, compatibilityValue: 2019 },
  { name: "draft-2020-12", dialectId: "https://json-schema.org/draft/2020-12/schema", registerSchema: registerSchema2020, compatibilityValue: 2020 },
];


 //  COMPATIBILITY


function isCompatible(compatibility: string | undefined, draftVersion: number): boolean {
  if (!compatibility) return true;

  // handle comma-separated lists of versions (e.g., ">=6, <2020")
  
  if (compatibility.includes(",")) {
    return compatibility
      .split(",")
      .every((part) => isCompatible(part.trim(), draftVersion));
  }

  const versionMap: Record<string, number> = {
    "3": 3, "4": 4, "6": 6, "7": 7, "2019": 2019, "2020": 2020,
  };

  const match = compatibility.match(/^(<=|>=|=)?(\d+)$/);
  if (!match) return false;

  const [, operator, versionStr] = match;
  const version = versionMap[versionStr] ?? parseInt(versionStr);

  if (operator === "<=") return draftVersion <= version;
  if (operator === ">=") return draftVersion >= version;
  if (operator === "=") return draftVersion === version;

  return draftVersion >= version;
}

 //  SPEC-COMPLIANT COMPARE


function compare(actual: unknown[], expected: Record<string, unknown>) {
  const failures: string[] = [];

  const expectedEntries = Object.entries(expected);
  const actualValues = actual.map((v) => JSON.stringify(v));

  if (expectedEntries.length === 0) {
    if (actual.length === 0) return { pass: true, failures: [] };

    return {
      pass: false,
      failures: [
        `Expected no annotations, but got ${actual.length}: ${JSON.stringify(actual)}`
      ]
    };
  }

  if (actual.length !== expectedEntries.length) {
    failures.push(
      `Count mismatch — expected ${expectedEntries.length}, got ${actual.length}`
    );
  }

  const used = new Array(actual.length).fill(false);

  for (const [schemaLocation, expectedValue] of expectedEntries) {
    const expectedStr = JSON.stringify(expectedValue);

    let found = false;
    for (let i = 0; i < actualValues.length; i++) {
      if (!used[i] && actualValues[i] === expectedStr) {
        used[i] = true;
        found = true;
        break;
      }
    }

    if (!found) {
      failures.push(
        `Missing expected annotation at "${schemaLocation}" with value ${expectedStr}`
      );
    }
  }

  for (let i = 0; i < actual.length; i++) {
    if (!used[i]) {
      failures.push(`Unexpected annotation found: ${JSON.stringify(actual[i])}`);
    }
  }

  return {
    pass: failures.length === 0,
    failures
  };
}

// MAIN TEST RUNNER

const testDir = path.join(__dirname, "../JSON-Schema-Test-Suite/annotations/tests");

const testFiles = fs.readdirSync(testDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.join(testDir, f));

const draftStats: Record<string, any> = {};
for (const d of DRAFTS) {
  draftStats[d.name] = { passed: 0, failed: 0, errors: 0, skipped: 0 };
}

let totalPassed = 0;
let totalFailed = 0;
let totalErrors = 0;
let totalSkipped = 0;

const report: any = {
  tests: [],
  drafts: {},
  summary: {}
};

for (const filePath of testFiles) {
  const fileName = path.basename(filePath);

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const suites = Array.isArray(raw) ? raw : raw.suite ?? [];

  for (const suite of suites) {
    for (const test of suite.tests) {
      for (const draft of DRAFTS) {

        if (!isCompatible(suite.compatibility, draft.compatibilityValue)) {
          draftStats[draft.name].skipped++;
          totalSkipped++;
          continue;
        }

        const schemaId = `https://example.com/test-${Math.random()}`;

        try {
          draft.registerSchema(
            { $schema: draft.dialectId, ...suite.schema },
            schemaId
          );

          const instance = await annotate(schemaId, test.instance);

          for (const assertion of test.assertions) {
            const { location, keyword, expected } = assertion;
            const pointer = location === "" ? "#" : `#${location}`;

            let actual: unknown[] = [];

            try {
              const node = AnnotatedInstance.get(pointer, instance);
              actual = node
                ? AnnotatedInstance.annotation(node, keyword, draft.dialectId)
                : [];
            } catch {
              actual = [];
            }

            const { pass, failures } = compare(actual, expected);

            report.tests.push({
              file: fileName,
              suite: suite.description,
              test: test.description ?? "(no description)",
              draft: draft.name,
              keyword,
              location,
              expected,
              actual,
              pass,
              failures
            });

            if (pass) {
              draftStats[draft.name].passed++;
              totalPassed++;
            } else {
              draftStats[draft.name].failed++;
              totalFailed++;
            }
          }
        } catch (err: any) {
          draftStats[draft.name].errors++;
         report.tests.push({
          file: fileName,
          draft: draft.name,
         status: 'error',
        message: err.message
  });
}
      }
    }
  }
}

// final report 

report.drafts = draftStats;

report.summary = {
  passed: totalPassed,
  failed: totalFailed,
  errors: totalErrors,
  skipped: totalSkipped,
  total: totalPassed + totalFailed + totalErrors,
  failureRate:
    totalPassed + totalFailed === 0
      ? "0%"
      : ((totalFailed / (totalPassed + totalFailed)) * 100).toFixed(2) + "%"
};



const outputDir = path.join(__dirname, "data");

if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const jsonPath = path.join(outputDir, "report.json");
fs.writeFileSync(jsonPath, JSON.stringify(report, null, 2));

const htmlPath = path.join(outputDir, "report.html");
generateHTMLReport(report, htmlPath);


console.log(" FINAL RESULTS");

console.log(report.summary);

console.log(`\n JSON report saved at: ${jsonPath}`);
console.log(` HTML report saved at: ${htmlPath}`);

process.exit(totalFailed > 0 || totalErrors > 0 ? 1 : 0);