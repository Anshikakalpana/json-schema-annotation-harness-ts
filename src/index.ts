import { registerSchema } from "@hyperjump/json-schema/draft-2020-12";
import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";
import { loadTestFile } from "./loader.js";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dialectId = "https://json-schema.org/draft/2020-12/schema";

const testDir = path.join(__dirname, "../JSON-Schema-Test-Suite/annotations/tests");
const testFiles = fs.readdirSync(testDir).filter((f) => f.endsWith(".json")).map((f) => path.join(testDir, f));

let passed = 0;
let failed = 0;
let errors = 0;


function buildAnnotationIndex(
  schema: any,
  keyword: string,
  path: string = "#"
): Record<string, unknown> {
  const index: Record<string, unknown> = {};

  if (schema === null || typeof schema !== "object") return index;

  
  if (schema[keyword] !== undefined) {
    index[path] = schema[keyword];
  }




  if (schema.properties) {
    for (const [key, sub] of Object.entries(schema.properties)) {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/properties/${key}`));
    }
  }

  
  if (schema.patternProperties) {
    for (const [pattern, sub] of Object.entries(schema.patternProperties)) {
      const encoded = encodeURIComponent(pattern); // "^a" → "%5Ea"
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/patternProperties/${encoded}`));
    }
  }

  
  if (schema.additionalProperties && typeof schema.additionalProperties === "object") {
    Object.assign(index, buildAnnotationIndex(schema.additionalProperties, keyword, `${path}/additionalProperties`));
  }


  if (Array.isArray(schema.allOf)) {
    schema.allOf.forEach((sub: any, i: number) => {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/allOf/${i}`));
    });
  }

  
  if (Array.isArray(schema.anyOf)) {
    schema.anyOf.forEach((sub: any, i: number) => {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/anyOf/${i}`));
    });
  }

 
  if (Array.isArray(schema.oneOf)) {
    schema.oneOf.forEach((sub: any, i: number) => {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/oneOf/${i}`));
    });
  }

 
  if (schema.not && typeof schema.not === "object") {
    Object.assign(index, buildAnnotationIndex(schema.not, keyword, `${path}/not`));
  }

  
  for (const kw of ["if", "then", "else"]) {
    if (schema[kw] && typeof schema[kw] === "object") {
      Object.assign(index, buildAnnotationIndex(schema[kw], keyword, `${path}/${kw}`));
    }
  }

  
  if (Array.isArray(schema.prefixItems)) {
    schema.prefixItems.forEach((sub: any, i: number) => {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/prefixItems/${i}`));
    });
  }

  
  if (schema.items && typeof schema.items === "object") {
    Object.assign(index, buildAnnotationIndex(schema.items, keyword, `${path}/items`));
  }


  if (schema.contains && typeof schema.contains === "object") {
    Object.assign(index, buildAnnotationIndex(schema.contains, keyword, `${path}/contains`));
  }

 
  if (schema.dependentSchemas) {
    for (const [key, sub] of Object.entries(schema.dependentSchemas)) {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/dependentSchemas/${key}`));
    }
  }

  
  for (const kw of ["unevaluatedProperties", "unevaluatedItems"]) {
    if (schema[kw] && typeof schema[kw] === "object") {
      Object.assign(index, buildAnnotationIndex(schema[kw], keyword, `${path}/${kw}`));
    }
  }

 
  if (schema.$defs) {
    for (const [key, sub] of Object.entries(schema.$defs)) {
      Object.assign(index, buildAnnotationIndex(sub, keyword, `${path}/$defs/${key}`));
    }
  }

  // propertyNames
  if (schema.propertyNames && typeof schema.propertyNames === "object") {
    Object.assign(index, buildAnnotationIndex(schema.propertyNames, keyword, `${path}/propertyNames`));
  }

  return index;
}




function compare(
  actual: unknown[],
  expected: unknown,
  schema: any,
  keyword: string
): boolean {

  if (
    typeof expected === "object" &&
    expected !== null &&
    !Array.isArray(expected) &&
    Object.keys(expected).length === 0
  ) {
    return actual.length === 0;
  }

  
  if (
    typeof expected === "object" &&
    expected !== null &&
    !Array.isArray(expected)
  ) {
    const expectedObj = expected as Record<string, unknown>;
    const expectedValues = Object.values(expectedObj);

   
    const sortA = [...actual].map(JSON.stringify as any).sort();
    const sortE = [...expectedValues].map(JSON.stringify as any).sort();
    if (sortA.length !== sortE.length) return false;
    if (!sortA.every((v, i) => v === sortE[i])) return false;

   
    const fullIndex = buildAnnotationIndex(schema, keyword);
    


    const actualSourceMap: Record<string, unknown> = {};
    for (const [schemaPath, annotationValue] of Object.entries(fullIndex)) {
      const valueInActual = actual.some(
        (a) => JSON.stringify(a) === JSON.stringify(annotationValue)
      );
      if (valueInActual) {
        actualSourceMap[schemaPath] = annotationValue;
      }
    }

    // Compare: actualSourceMap vs expectedObj
    const sortedActualMap = JSON.stringify(
      Object.fromEntries(Object.entries(actualSourceMap).sort())
    );
    const sortedExpectedMap = JSON.stringify(
      Object.fromEntries(Object.entries(expectedObj).sort())
    );

    return sortedActualMap === sortedExpectedMap;
  }

  return false;
}




for (const filePath of testFiles) {
  const fileName = path.basename(filePath);
  console.log(`\n${"=".repeat(50)}`);
  console.log(` File: ${fileName}`);
  console.log("=".repeat(50));

  const raw = loadTestFile(filePath);
  const suites = raw.suite ?? raw;

  for (const suite of suites) {
    console.log(`\n Suite: ${suite.description}`);

    for (const test of suite.tests) {
      console.log(`\n  Test: ${test.description ?? "(no description)"}`);
      const schemaId = `https://example.com/${Math.random()}`;

      try {
        registerSchema({ $schema: dialectId, ...suite.schema }, schemaId);
        const instance = await annotate(schemaId, test.instance);

        for (const assertion of test.assertions) {
          const { location, keyword, expected } = assertion;
          const pointer = location === "" ? "#" : `#${location}`;

          let actual: unknown[] = [];
          try {
            const node = AnnotatedInstance.get(pointer, instance);
            actual = node
              ? AnnotatedInstance.annotation(node, keyword, dialectId)
              : [];
          } catch {
            actual = [];
          }

          // Compare values + source paths dono
          const pass = compare(actual, expected, suite.schema, keyword);

          if (pass) {
            console.log(` PASS — [${keyword}] @ "${location}"`);
            passed++;
          } else {
            console.log(` FAIL — [${keyword}] @ "${location}"`);
            console.log(`  Expected: ${JSON.stringify(expected)}`);
            console.log(`  Got vals: ${JSON.stringify(actual)}`);
            failed++;
          }
        }
      } catch (err) {
        console.log(`  ERROR — ${(err as Error).message}`);
        errors++;
      }
    }
  }
}

// ─────────────────────────────────────────────
// FINAL RESULTS
// ─────────────────────────────────────────────
console.log(`\n${"=".repeat(50)}`);
console.log(` FINAL RESULTS`);
console.log("=".repeat(50));
console.log(` Passed : ${passed}`);
console.log(` Failed : ${failed}`);
console.log(` Errors : ${errors}`);
console.log(` Total  : ${passed + failed + errors}`);
console.log("=".repeat(50));

process.exit(failed > 0 || errors > 0 ? 1 : 0);