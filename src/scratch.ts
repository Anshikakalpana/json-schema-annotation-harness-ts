import { registerSchema } from "@hyperjump/json-schema/draft-2020-12";
import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";

const dialectId = "https://json-schema.org/draft/2020-12/schema";

async function test(name: string, schema: object, instance: unknown, path: string) {
  const id = `https://example.com/${Math.random()}`;
  registerSchema({ $schema: dialectId, ...schema }, id);
  const result = await annotate(id, instance as any);
  
  // Root pe check
  const rootTitles = AnnotatedInstance.annotation(result, "title", dialectId);
  
  // Specific path pe check
  const node = AnnotatedInstance.get(`#${path}`, result);
  const pathTitles = node ? AnnotatedInstance.annotation(node, "title", dialectId) : [];
  
  console.log(`\n${name}`);
  console.log(`  root titles:`, rootTitles);
  console.log(`  "${path}" titles:`, pathTitles);
}

// Test 1 — $ref ke through annotation — /name pe check karo
await test("$ref propagation", {
  properties: { name: { "$ref": "#/$defs/name" } },
  $defs: { name: { title: "Full Name", type: "string" } }
}, { name: "Jason" }, "/name");

// Test 2 — unevaluatedProperties — /bar pe check karo
await test("unevaluatedProperties", {
  properties: { foo: { title: "Foo Prop" } },
  unevaluatedProperties: { title: "Extra Prop" }
}, { foo: 1, bar: 2 }, "/bar");

// Test 3 — $ref at root level
await test("$ref at root", {
  "$ref": "#/$defs/thing",
  $defs: { thing: { title: "Root Thing" } }
}, {}, "");