# Design Insights from Building the Harness

## 1. Schema Location Attribution Limitation

The annotation test suite's `expected` format is keyed 
by schema location:
  { "#/properties/foo": "Foo" }

But @hyperjump/json-schema's public API returns only values:
  ["Foo"]

No public API exists to determine WHICH schema location 
produced which value.

**Implication for #994:** If the unified validation suite 
adopts schema-location-keyed expected values, most 
implementations will struggle to verify them. A simpler 
format would lower the barrier for implementers.

## 2. Plain Number = Minimum Version, Not Exact Match

`"compatibility": "4"` means draft-04 AND ABOVE — not 
draft-04 only. My first implementation got this wrong 
and caused tests to run on only one draft.

**Implication for #994:** This convention must be 
explicitly documented when migrating validation tests.

## 3. $id Is Required for $dynamicRef Tests

Discovered while adding $dynamicRef annotation tests 
(PR #862) — without $id boundaries, dynamic scope 
collapses and $dynamicRef always resolves to the same 
anchor regardless of evaluation path.

**Implication for #994:** Tests involving $dynamicRef 
in the unified suite will need $id fields — conflicting 
with the annotation suite's guideline to avoid $id 
where possible.