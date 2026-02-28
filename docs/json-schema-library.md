# JSON Schema Annotation Harness – Library Evaluation

## 1. Objective

The goal of this project is to build a **test harness for the JSON Schema annotation test suite**, as required by the GSoC qualification task.

The harness is responsible for:
- Running annotation tests from the official test suite
- Collecting annotations from a JSON Schema implementation
- Comparing actual annotations with expected results
- Reporting pass/fail outcomes

---

## 2. Test Suite Overview

The annotation test suite defines expected annotation behavior for various JSON Schema keywords such as:

- `properties`, `patternProperties`, `additionalProperties`
- `prefixItems`, `items`
- `contains`
- `allOf`, `anyOf`, `oneOf`
- `not`
- `dependentSchemas`
- `if`, `then`, `else`

Each test includes:
- `instance` → input data
- `location` → JSON Pointer in instance
- `keyword` → annotation keyword (e.g., `title`)
- `expected` → expected annotations (schema location → value mapping)

**Example:**

```json
{
  "location": "/foo",
  "keyword": "title",
  "expected": {
    "#/properties/foo": "Foo"
  }
}
```

---

## 3. Approach

The harness follows this workflow:

1. Load test suites from JSON files
2. Compile schema using chosen JSON Schema library
3. Validate instance and collect annotations
4. Filter annotations by:
   - `instanceLocation`
   - `keyword`
5. Convert annotations into expected format
6. Compare with test suite expectations
7. Output `PASS` / `FAIL`

---

## 4. Library Evaluation

### Library Used

**`json-schema-library`**

### Claimed Features

According to documentation:
- Provides annotations in validation result
- Supports multiple JSON Schema drafts
- Extensible via custom keywords
- Introduces annotation system (recent versions)

### Observed Behavior

During testing:
- Validation works correctly ✅
- `annotations` field is returned ✅
- Only limited annotation types are supported

**Example output:**

```json
[
  {
    "type": "annotation",
    "code": "deprecated-warning",
    "message": "Value at `#/foo` is deprecated"
  }
]
```

---

## 5. Key Findings

### ✅ Supported

- Basic annotation infrastructure
- `deprecated` keyword produces annotations

### ❌ Not Supported

The following required features are missing or incomplete:

#### 1. `title` Annotation
- No annotations emitted for `title`
- Required by test suite → causes failures

#### 2. Applicator Annotation Propagation

Missing for:
- `properties`
- `patternProperties`
- `additionalProperties`
- `items`, `prefixItems`
- `contains`
- `allOf`, `anyOf`, `oneOf`
- `if`/`then`/`else`
- `dependentSchemas`

#### 3. Schema Location Tracking
- Expected: `#/properties/foo`
- Actual: no annotation emitted

---

## 6. Evidence from Test Runs

**Observed results:**

```
❌ FAIL — /foo [title]
   Expected: {"#/properties/foo":"Foo"}
   Got: []

❌ FAIL — /0 [title]
   Expected: {"#/prefixItems/0":"Foo"}
   Got: []

❌ FAIL —  [title]
   Expected: {"#/allOf/1":"Bar","#/allOf/0":"Foo"}
   Got: []
```

**Summary:**

| Result | Count |
|--------|-------|
| ✅ Passed | 9 |
| ❌ Failed | 15 |

> Failures consistently occur for **all title-based annotations**.

---

## 7. Root Cause Analysis

The issue is **not a bug**, but a **partial implementation**.

From library design:
- Annotation system exists
- Keyword-level support is optional
- Only a subset of annotations is implemented

Therefore, the library does not implement spec-compliant annotation collection for most keywords.

---

## 8. Conclusion

Although `json-schema-library` provides an annotation interface, it:

- Does not support required annotation keywords (e.g., `title`)
- Does not propagate annotations through applicators
- Does not match the JSON Schema annotation test suite expectations

> ❗ **This library is not suitable for building a compliant annotation test harness.**

---

## 9. Decision

Due to incomplete annotation support:
- The library was **rejected** for this task
- A different implementation with better annotation support will be used

---

## 10. Key Learning

This evaluation highlights an important distinction:

> **Validation support ≠ Annotation support**

A library may fully validate schemas but still fail annotation-based test suites.

---

## 11. Next Steps

- Switch to a JSON Schema implementation with better annotation support
- Integrate it into the existing harness
- Ensure correct annotation extraction and comparison
- Extend harness for full test suite compatibility

---

## 12. Summary

| Aspect | Status |
|--------|--------|
| Validation | ✅ Working |
| Annotation Infrastructure | ✅ Present |
| `deprecated` support | ✅ |
| `title` support | ❌ |
| Applicator annotations | ❌ |
| Test Suite Compatibility | ❌ |