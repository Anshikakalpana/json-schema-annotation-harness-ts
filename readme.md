# JSON Schema Annotation Harness (Python)

Test harness for the [JSON Schema Annotation Test Suite](https://github.com/json-schema-org/JSON-Schema-Test-Suite/tree/main/annotations).  
Built for the GSoC 2026 qualification task (**Unify the Test Suite**).

---

## Library Choice

I used **[jschon](https://github.com/marksparkza/jschon)**, a Python implementation that supports annotations and **does not** already use the official annotation test suite.  
It covers draft-2020-12.

---

## Results

The harness runs the full annotation test suite and produces a report.

- **Passed:** 80  
- **Failed:** 4  
- **Errors:** 0  
- **Skipped:** 0  

The 4 failures are due to **known limitations in the library** (not the harness):

- `propertyNames` annotates property values where the test expects none  
- `contains` annotates every array element, while the test expects only the matching index  

These have been verified with standalone tests. The harness correctly reports them.

---

## How to Run

1. **Clone the repository** (including the test suite submodule):
   ```bash
   git clone --recursive https://github.com/Anshikakalpana/JSON-Schema-annotation-harness.git
   cd JSON-Schema-annotation-harness

```
2. **Install dependencies:**
```bash
    pip install jschon

```

3. **Run the harness:**

```bash
   python annotation_test_runner.py

 ```

## Results are saved to:

data/report.json
data/report.html

## Known Limitations

jschon supports only draft‑2020‑12; earlier drafts (04, 06, 07, 2019‑09) are not covered.

Four tests fail because of library implementation details (see above).

The harness compares annotation values but does not verify the exact schema location (the expected key). In practice this does not affect the results, but it’s a potential area for future improvement.

## Previous Version (Hyperjump)

I initially built a harness using @hyperjump/json-schema (TypeScript), which passed all 84 tests. However, Hyperjump already uses the annotation test suite, so it did not meet the “does not already use” condition. The Hyperjump version is kept in the hyperjump/ folder for reference and verification. Only library is changed , harness idea is reserved 


