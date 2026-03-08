import { registerSchema } from "@hyperjump/json-schema/draft-2020-12";
import { annotate } from "@hyperjump/json-schema/annotations/experimental";
import * as AnnotatedInstance from "@hyperjump/json-schema/annotated-instance/experimental";

const dialectId = "https://json-schema.org/draft/2020-12/schema";

async function test(
  name: string,
  schema: object,
  instance: unknown,
  location: string,
  keyword: string,
  expected: unknown[]
) {
  const id = `https://example.com/test-${Math.random()}`;
  registerSchema({ $schema: dialectId, ...schema }, id);

  try {
    const result = await annotate(id, instance as any);
    const pointer = location === "" ? "#" : `#${location}`;
    const node = AnnotatedInstance.get(pointer, result);
    const actual = node ? AnnotatedInstance.annotation(node, keyword, dialectId) : [];

    const pass = JSON.stringify(actual) === JSON.stringify(expected);

    console.log(`\n${pass ? "✅ PASS" : "❌ FAIL"} — ${name}`);
    console.log(`  Expected : ${JSON.stringify(expected)}`);
    console.log(`  Actual   : ${JSON.stringify(actual)}`);
  } catch (err) {
    console.log(`\n❌ ERROR — ${name}`);
    console.log(`  ${(err as Error).message}`);
  }
}

// ── Test 1 — $ref and $defs ───────────────────────────────────────────────
await test(
  "$ref and $defs",
  {
    "$ref": "#/$defs/foo",
    "$defs": { "foo": { "title": "Foo" } }
  },
  "foo",
  "",
  "title",
  ["Foo"]
);

// ── Test 2 — Simple $dynamicRef → $dynamicAnchor ──────────────────────────
await test(
  "$dynamicRef resolves to $dynamicAnchor",
  {
    "$dynamicRef": "#foo",
    "$defs": {
      "foo": {
        "$dynamicAnchor": "foo",
        "title": "Foo"
      }
    }
  },
  "bar",
  "",
  "title",
  ["Foo"]
);

// ── Test 3a — Dynamic path: numbers ──────────────────────────────────────
await test(
  "$dynamicRef resolves to numberList anchor",
  {
    "$id": "https://test.json-schema.org/dynamic-ref-annotation/main",
    "if": {
      "properties": { "kindOfList": { "const": "numbers" } },
      "required": ["kindOfList"]
    },
    "then": { "$ref": "numberList" },
    "else": { "$ref": "stringList" },
    "$defs": {
      "genericList": {
        "$id": "genericList",
        "properties": {
          "list": { "items": { "$dynamicRef": "#itemType" } }
        },
        "$defs": {
          "defaultItemType": { "$dynamicAnchor": "itemType" }
        }
      },
      "numberList": {
        "$id": "numberList",
        "$defs": {
          "itemType": { "$dynamicAnchor": "itemType", "title": "Number Item" }
        },
        "$ref": "genericList"
      },
      "stringList": {
        "$id": "stringList",
        "$defs": {
          "itemType": { "$dynamicAnchor": "itemType", "title": "String Item" }
        },
        "$ref": "genericList"
      }
    }
  },
  { kindOfList: "numbers", list: [1] },
  "/list/0",
  "title",
  ["Number Item"]
);

// ── Test 3b — Dynamic path: strings ──────────────────────────────────────
await test(
  "$dynamicRef resolves to stringList anchor",
  {
    "$id": "https://test.json-schema.org/dynamic-ref-annotation/main2",
    "if": {
      "properties": { "kindOfList": { "const": "numbers" } },
      "required": ["kindOfList"]
    },
    "then": { "$ref": "numberList3" },
    "else": { "$ref": "stringList3" },
    "$defs": {
      "genericList": {
        "$id": "genericList3",
        "properties": {
          "list": { "items": { "$dynamicRef": "#itemType" } }
        },
        "$defs": {
          "defaultItemType": { "$dynamicAnchor": "itemType" }
        }
      },
      "numberList": {
        "$id": "numberList3",
        "$defs": {
          "itemType": { "$dynamicAnchor": "itemType", "title": "Number Item" }
        },
        "$ref": "genericList3"
      },
      "stringList": {
        "$id": "stringList3",
        "$defs": {
          "itemType": { "$dynamicAnchor": "itemType", "title": "String Item" }
        },
        "$ref": "genericList3"
      }
    }
  },
  { kindOfList: "strings", list: ["foo"] },
  "/list/0",
  "title",
  ["String Item"]
);