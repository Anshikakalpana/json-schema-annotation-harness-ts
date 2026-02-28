import path from "path";
import { loadTestFile } from "./loader";
import { compileSchema } from "json-schema-library";

const filePath = path.join(
  __dirname,
  "../JSON-Schema-Test-Suite/annotations/tests/applicators.json"
);

const raw = loadTestFile(filePath);
const suites = raw.suite;

let totalTests = 0;
let passed = 0;
let failed = 0;

for (const suite of suites) {
  console.log(`\n Suite: ${suite.description}`);

  for (const test of suite.tests) {
    totalTests++;

    const schemaNode = compileSchema({
      "$schema": "https://json-schema.org/draft/2020-12/schema",
      ...suite.schema
    });

    const { annotations } = schemaNode.validate(test.instance);

    for (const assertion of test.assertions) {
      const { location, keyword, expected } = assertion;

      // Expected empty = no annotation 
      const expectEmpty = Object.keys(expected).length === 0;


      const actual = annotations.filter((a: any) =>
        a.location === location && a.keyword === keyword
      );

      if (expectEmpty && actual.length === 0) {
        console.log(`PASS — ${location} [${keyword}] correctly empty`);
        passed++;
      } else if (!expectEmpty && actual.length > 0) {
        console.log(`PASS — ${location} [${keyword}]`);
        passed++;
      } else {
        console.log(` FAIL — ${location} [${keyword}]`);
        console.log(`Expected: ${JSON.stringify(expected)}`);
        console.log(`Got:      ${JSON.stringify(actual)}`);
        failed++;
      }
    }
  }
}

console.log(`\n Results: ${passed}/${totalTests} passed | ${failed} failed`);

const { annotations } = compileSchema({
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "properties": {
    "foo": {
      "deprecated": true  
    }
  }
}).validate({ "foo": "bar" });

console.log(annotations);