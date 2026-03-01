import { registerSchema as registerSchema4 } from "@hyperjump/json-schema/draft-04";
import { registerSchema as registerSchema6 } from "@hyperjump/json-schema/draft-06";
import { registerSchema as registerSchema7 } from "@hyperjump/json-schema/draft-07";
import { registerSchema as registerSchema2019 } from "@hyperjump/json-schema/draft-2019-09";
import { registerSchema as registerSchema2020 } from "@hyperjump/json-schema/draft-2020-12";
import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";
import { loadTestFile } from "./loader.js";
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

// Compatibility string → number
function compatToNumber(compat?: string): number {
  if (!compat) return 4; // default — sabse purana
  const map: Record<string, number> = {
    "3": 3, "4": 4, "6": 6, "7": 7,
    "2019": 2019, "2020": 2020,
  };
  return map[compat] ?? 4;
}


// SCHEMA WALKER 

function buildAnnotationIndex(
  schema: any,
  keyword: string,
  path: string = "#"
): Record<string, unknown> {
  const index: Record<string, unknown> = {};
  if (schema === null || typeof schema !== "object") return index;

  if (schema[keyword] !== undefined) index[path] = schema[keyword];

  if (schema.properties)
    for (const [k, s] of Object.entries(schema.properties))
      Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/properties/${k}`));

  if (schema.patternProperties)
    for (const [p, s] of Object.entries(schema.patternProperties))
      Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/patternProperties/${encodeURIComponent(p)}`));

  if (schema.additionalProperties && typeof schema.additionalProperties === "object")
    Object.assign(index, buildAnnotationIndex(schema.additionalProperties, keyword, `${path}/additionalProperties`));

  for (const kw of ["allOf", "anyOf", "oneOf"] as const)
    if (Array.isArray(schema[kw]))
      schema[kw].forEach((s: any, i: number) =>
        Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/${kw}/${i}`)));

  if (schema.not && typeof schema.not === "object")
    Object.assign(index, buildAnnotationIndex(schema.not, keyword, `${path}/not`));

  for (const kw of ["if", "then", "else"])
    if (schema[kw] && typeof schema[kw] === "object")
      Object.assign(index, buildAnnotationIndex(schema[kw], keyword, `${path}/${kw}`));

  if (Array.isArray(schema.prefixItems))
    schema.prefixItems.forEach((s: any, i: number) =>
      Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/prefixItems/${i}`)));

  if (schema.items && typeof schema.items === "object")
    Object.assign(index, buildAnnotationIndex(schema.items, keyword, `${path}/items`));

  if (schema.contains && typeof schema.contains === "object")
    Object.assign(index, buildAnnotationIndex(schema.contains, keyword, `${path}/contains`));

  if (schema.dependentSchemas)
    for (const [k, s] of Object.entries(schema.dependentSchemas))
      Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/dependentSchemas/${k}`));

  for (const kw of ["unevaluatedProperties", "unevaluatedItems"])
    if (schema[kw] && typeof schema[kw] === "object")
      Object.assign(index, buildAnnotationIndex(schema[kw], keyword, `${path}/${kw}`));

  if (schema.$defs)
    for (const [k, s] of Object.entries(schema.$defs))
      Object.assign(index, buildAnnotationIndex(s, keyword, `${path}/$defs/${k}`));

  if (schema.propertyNames && typeof schema.propertyNames === "object")
    Object.assign(index, buildAnnotationIndex(schema.propertyNames, keyword, `${path}/propertyNames`));

  return index;
}


// COMPARE FUNCTION

function compare(actual: unknown[], expected: unknown, schema: any, keyword: string): boolean {
  if (typeof expected === "object" && expected !== null && !Array.isArray(expected)) {
    if (Object.keys(expected).length === 0) return actual.length === 0;

    const expectedObj = expected as Record<string, unknown>;
    const expectedValues = Object.values(expectedObj);

    const sortA = [...actual].map(JSON.stringify as any).sort();
    const sortE = [...expectedValues].map(JSON.stringify as any).sort();
    if (sortA.length !== sortE.length) return false;
    if (!sortA.every((v, i) => v === sortE[i])) return false;

    const fullIndex = buildAnnotationIndex(schema, keyword);

    for (const [expectedPath, expectedValue] of Object.entries(expectedObj)) {
      if (!(expectedPath in fullIndex)) return false;
      const valueMatch = actual.some((a) => JSON.stringify(a) === JSON.stringify(expectedValue));
      if (!valueMatch) return false;
      if (JSON.stringify(fullIndex[expectedPath]) !== JSON.stringify(expectedValue)) return false;
    }

    return true;
  }
  return false;
}




const testDir = path.join(__dirname, "../JSON-Schema-Test-Suite/annotations/tests");
const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".json")).map((f) => path.join(testDir, f));

// Per-draft counters
const draftStats: Record<string, { passed: number; failed: number; errors: number; skipped: number }> = {};
for (const d of DRAFTS) draftStats[d.name] = { passed: 0, failed: 0, errors: 0, skipped: 0 };

// Grand totals
let totalPassed = 0, totalFailed = 0, totalErrors = 0, totalSkipped = 0;

for (const filePath of testFiles) {
  const fileName = path.basename(filePath);
  console.log(`\n${"=".repeat(60)}`);
  console.log(` File: ${fileName}`);
  console.log("=".repeat(60));

  const raw = loadTestFile(filePath);
  const suites = raw.suite ?? raw;

  for (const suite of suites) {
    console.log(`\n Suite: ${suite.description}`);

    const suiteCompatNumber = compatToNumber(suite.compatibility);

    for (const test of suite.tests) {
      console.log(`\n   Test: ${test.description ?? "(no description)"}`);

      //  Har applicable draft ke saath run karo
      for (const draft of DRAFTS) {

        // Skip karo agar ye test is draft ke liye nahi hai
        if (suiteCompatNumber > draft.compatibilityValue) {
          console.log(`  SKIP [${draft.name}] — needs compat ${suite.compatibility}`);
          draftStats[draft.name].skipped++;
          totalSkipped++;
          continue;
        }

        const schemaId = `https://example.com/${Math.random()}`;

        try {
          // $schema ko current draft ke dialectId se override karo
          const schemaWithoutDialect = { ...suite.schema };
          delete schemaWithoutDialect.$schema;

          draft.registerSchema(
            { $schema: draft.dialectId, ...schemaWithoutDialect },
            schemaId
          );

          const instance = await annotate(schemaId, test.instance);

          for (const assertion of test.assertions) {
            const { location, keyword, expected } = assertion;
            const pointer = location === "" ? "#" : `#${location}`;

            let actual: unknown[] = [];
            try {
              const node = AnnotatedInstance.get(pointer, instance);
              actual = node ? AnnotatedInstance.annotation(node, keyword, draft.dialectId) : [];
            } catch {
              actual = [];
            }

            const pass = compare(actual, expected, suite.schema, keyword);

            if (pass) {
              console.log(`  PASS [${draft.name}] — [${keyword}] @ "${location}"`);
              draftStats[draft.name].passed++;
              totalPassed++;
            } else {
              console.log(`  FAIL [${draft.name}] — [${keyword}] @ "${location}"`);
              console.log(`  Expected: ${JSON.stringify(expected)}`);
              console.log(`  Got:      ${JSON.stringify(actual)}`);
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
