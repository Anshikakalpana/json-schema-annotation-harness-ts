


import { registerSchema as registerSchema4 } from "@hyperjump/json-schema/draft-04";
import { registerSchema as registerSchema6 } from "@hyperjump/json-schema/draft-06";
import { registerSchema as registerSchema7 } from "@hyperjump/json-schema/draft-07";
import { registerSchema as registerSchema2019 } from "@hyperjump/json-schema/draft-2019-09";
import { registerSchema as registerSchema2020 } from "@hyperjump/json-schema/draft-2020-12";
import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));



const DRAFTS = [
  {
    name: "draft-04",
    dialectId: "http://json-schema.org/draft-04/schema",
    registerSchema: registerSchema4,
    compatibilityValue: 4,
  },
  {
    name: "draft-06",
    dialectId: "http://json-schema.org/draft-06/schema",
    registerSchema: registerSchema6,
    compatibilityValue: 6,
  },
  {
    name: "draft-07",
    dialectId: "http://json-schema.org/draft-07/schema",
    registerSchema: registerSchema7,
    compatibilityValue: 7,
  },
  {
    name: "draft-2019-09",
    dialectId: "https://json-schema.org/draft/2019-09/schema",
    registerSchema: registerSchema2019,
    compatibilityValue: 2019,
  },
  {
    name: "draft-2020-12",
    dialectId: "https://json-schema.org/draft/2020-12/schema",
    registerSchema: registerSchema2020,
    compatibilityValue: 2020,
  },
];


function isCompatible(compatibility: string | undefined, draftVersion: number): boolean {
  if (!compatibility) return true;

  const versionMap: Record<string, number> = {
    "3": 3, "4": 4, "6": 6, "7": 7, "2019": 2019, "2020": 2020,
  };

  const resolveVersion = (str: string) => versionMap[str] ?? parseInt(str);

  const match = compatibility.match(/^(<=|>=|=)?(\d+)$/);
  if (!match) return false;

  const [, operator, versionStr] = match;
  const version = resolveVersion(versionStr);

  if (operator === "<=") return draftVersion <= version;
  if (operator === ">=") return draftVersion >= version;
  if (operator === "=")  return draftVersion === version;

  
  return draftVersion >= version;
}


function compare(
  actual: unknown[],
  expected: Record<string, unknown>
): { pass: boolean; failures: string[] } {
  const failures: string[] = [];
  const expectedEntries = Object.entries(expected);

  // Case 1 — both empty — no annotations expected, none produced
  if (expectedEntries.length === 0) {
    if (actual.length === 0) return { pass: true, failures: [] };
    failures.push(
      `Expected no annotations but got ${actual.length}: ${JSON.stringify(actual)}`
    );
    return { pass: false, failures };
  }

  // Case 2 — count mismatch
  // e.g. expected 2 annotations but implementation produced 3 or 1
  if (actual.length !== expectedEntries.length) {
    failures.push(
      `Count mismatch — expected ${expectedEntries.length} annotation(s), got ${actual.length}`
    );
  }


  for (const [schemaLocation, expectedValue] of expectedEntries) {
    const found = actual.some(
      (a) => JSON.stringify(a) === JSON.stringify(expectedValue)
    );
    if (!found) {
      failures.push(
        `Schema location "${schemaLocation}" — expected ${JSON.stringify(expectedValue)} but not found in actual annotations`
      );
    }
  }

  return { pass: failures.length === 0, failures };
}



const testDir = path.join(__dirname, "../JSON-Schema-Test-Suite/annotations/tests");
const testFiles = fs
  .readdirSync(testDir)
  .filter((f) => f.endsWith(".json"))
  .map((f) => path.join(testDir, f));



const draftStats: Record<
  string,
  { passed: number; failed: number; errors: number; skipped: number }
> = {};
for (const d of DRAFTS) {
  draftStats[d.name] = { passed: 0, failed: 0, errors: 0, skipped: 0 };
}

let totalPassed = 0;
let totalFailed = 0;
let totalErrors = 0;
let totalSkipped = 0;



for (const filePath of testFiles) {
  const fileName = path.basename(filePath);
  console.log(`\n${"=".repeat(60)}`);
  console.log(` File: ${fileName}`);
  console.log("=".repeat(60));

  const raw = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  const suites = Array.isArray(raw) ? raw : raw.suite ?? [];

  for (const suite of suites) {
    console.log(`\n Suite: ${suite.description}`);

    for (const test of suite.tests) {
      console.log(`\n   Test: ${test.description ?? "(no description)"}`);

      for (const draft of DRAFTS) {

       
        if (!isCompatible(suite.compatibility, draft.compatibilityValue)) {
          console.log(`  SKIP [${draft.name}] — needs compat ${suite.compatibility}`);
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

          // Run hyperjump annotation engine
          const instance = await annotate(schemaId, test.instance);

          for (const assertion of test.assertions) {
            const { location, keyword, expected } = assertion;

            // location = instance path e.g. "/foo" or ""
            // pointer  = JSON pointer format e.g. "#/foo" or "#"
            const pointer = location === "" ? "#" : `#${location}`;

            // Collect actual annotations from hyperjump at this instance location
            let actual: unknown[] = [];
            try {
              const node = AnnotatedInstance.get(pointer, instance);
              actual = node
                ? AnnotatedInstance.annotation(node, keyword, draft.dialectId)
                : [];
            } catch {
              actual = [];
            }

            // Compare actual vs expected
            const { pass, failures } = compare(actual, expected);

            if (pass) {
              console.log(`  PASS [${draft.name}] — [${keyword}] @ "${location}"`);
              draftStats[draft.name].passed++;
              totalPassed++;
            } else {
              console.log(`  FAIL [${draft.name}] — [${keyword}] @ "${location}"`);
              console.log(`   Expected : ${JSON.stringify(expected)}`);
              console.log(`   Actual   : ${JSON.stringify(actual)}`);
              for (const failure of failures) {
                console.log(`   ↳ ${failure}`);
              }
              draftStats[draft.name].failed++;
              totalFailed++;
            }
          }
        } catch (err) {
          console.log(`  ERROR [${draft.name}] — ${(err as Error).message}`);
          draftStats[draft.name].errors++;
          totalErrors++;
        }
      }
    }
  }
}

//  RESULTS

console.log(`\n${"=".repeat(60)}`);
console.log(`RESULTS PER DRAFT`);
console.log("=".repeat(60));

for (const draft of DRAFTS) {
  const s = draftStats[draft.name];
  const total = s.passed + s.failed + s.errors;
  console.log(`\n   ${draft.name}`);
  console.log(` Passed  : ${s.passed}`);
  console.log(` Failed  : ${s.failed}`);
  console.log(`  Errors  : ${s.errors}`);
  console.log(`  Skipped : ${s.skipped}`);
  console.log(` Total   : ${total}`);
}

console.log(`\n${"=".repeat(60)}`);
console.log(` GRAND TOTAL`);
console.log("=".repeat(60));
console.log(` Passed  : ${totalPassed}`);
console.log(` Failed  : ${totalFailed}`);
console.log(` Errors  : ${totalErrors}`);
console.log(`  Skipped : ${totalSkipped}`);
console.log(` Total   : ${totalPassed + totalFailed + totalErrors}`);
console.log("=".repeat(60));

process.exit(totalFailed > 0 || totalErrors > 0 ? 1 : 0);

