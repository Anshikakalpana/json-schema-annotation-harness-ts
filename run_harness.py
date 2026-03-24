import os
import json
import re
from jschon import create_catalog, JSON, JSONSchema
from generate_html import generate_html_report

__dir__ = os.path.dirname(os.path.abspath(__file__))


all_drafts = [
    {
        "name": "draft-2020-12",
        "dialectId": "https://json-schema.org/draft/2020-12/schema",
        "compatibilityValue": 2020
    },
   
]

catalog = create_catalog('2020-12')


def compatibility_checker(compat: str | None, draft_num: int) -> bool:
    if not compat:
        return True
    if ',' in compat:
        return all(compatibility_checker(p.strip(), draft_num) for p in compat.split(','))

    version_map = {"4": 4, "6": 6, "7": 7, "2019": 2019, "2020": 2020}
    match = re.match(r'^(<=|>=|=)?(\d+)$', compat)
    if not match:
        return False

    op, v_str = match.groups()
    ver = version_map.get(v_str, int(v_str))

    if op == '<=':  return draft_num <= ver
    if op == '>=':  return draft_num >= ver
    if op == '=':   return draft_num == ver
    return draft_num >= ver


def check_annotations(actual: list, expected: dict):
    failures = []
    expected_list = list(expected.items())

    if not expected_list:
        if actual:
            failures.append(f"expected no annotations but got {len(actual)}: {json.dumps(actual)}")
        return {"pass": not failures, "failures": failures}

    if len(actual) != len(expected_list):
        failures.append(f"count mismatch — expected {len(expected_list)}, got {len(actual)}")

    seen = {}
    for item in actual:
        key = json.dumps(item, sort_keys=True)
        seen[key] = seen.get(key, 0) + 1

    for schema_location, expected_val in expected_list:
        key = json.dumps(expected_val, sort_keys=True)
        if seen.get(key, 0) > 0:
            seen[key] -= 1
        else:
            failures.append(f'missing annotation at "{schema_location}": {key}')

    for key, leftover in list(seen.items()):
        for _ in range(leftover):
            failures.append(f"unexpected annotation: {key}")

    return {"pass": not failures, "failures": failures}


def extract_annotations(output: dict, keyword: str, location: str = "") -> list:
    """Correct extractor for jschon's 'basic' output format"""
    actual = []
    if not isinstance(output, dict):
        return actual

    # 1. Check top-level annotations (this is where jschon puts them in "basic" mode)
    for ann in output.get("annotations", []):
        if not isinstance(ann, dict):
            continue
        if ann.get("instanceLocation") != location:
            continue

        # keywordLocation ends with the keyword we are looking for
        kw_loc = ann.get("keywordLocation", "")
        if kw_loc.endswith(f"/{keyword}") or kw_loc == f"/{keyword}" or kw_loc == keyword:
            value = ann.get("annotation")
            if value is not None:
                actual.append(value)

    # 2. Recurse into nested details (needed for combinators like allOf, anyOf, unevaluated*, etc.)
    for detail in output.get("details", []):
        actual.extend(extract_annotations(detail, keyword, location))

    return actual


# ====================== Locate Test Suite ======================
possible_paths = [
    os.path.join(__dir__, "JSON-Schema-Test-Suite/annotations/tests"),
    os.path.join(__dir__, "../JSON-Schema-Test-Suite/annotations/tests"),
]

test_dir = next((p for p in possible_paths if os.path.exists(p)), None)
if not test_dir:
    raise FileNotFoundError("Could not locate JSON-Schema-Test-Suite/annotations/tests")

print("Using test_dir:", test_dir)

test_files = sorted(f for f in os.listdir(test_dir) if f.endswith(".json"))


# ====================== Run Tests ======================
stats_by_draft = {d["name"]: {"passed": 0, "failed": 0, "errors": 0, "skipped": 0} for d in all_drafts}
passed = failed = errors = skipped = 0

report = {"tests": [], "drafts": {}, "summary": {}}

for file_name in test_files:
    with open(os.path.join(test_dir, file_name), encoding="utf-8") as f:
        raw = json.load(f)

    suites = raw if isinstance(raw, list) else raw.get("suite", [])

    for suite in suites:
        for test_case in suite.get("tests", []):
            for draft in all_drafts:
                if not compatibility_checker(suite.get("compatibility"), draft["compatibilityValue"]):
                    stats_by_draft[draft["name"]]["skipped"] += 1
                    skipped += 1
                    continue

                try:
                    schema = JSONSchema(
                        {"$schema": draft["dialectId"], **suite["schema"]},
                        catalog=catalog
                    )
                    instance = JSON(test_case["instance"])
                    result = schema.evaluate(instance)
                    output = result.output("basic")

                    for assertion in test_case.get("assertions", []):
                        loc = assertion.get("location", "")
                        kw = assertion["keyword"]
                        expected = assertion["expected"]

                        actual = extract_annotations(output, kw, loc)

                        res = check_annotations(actual, expected)

                        report["tests"].append({
                            "file": file_name,
                            "suite": suite.get("description"),
                            "test": test_case.get("description", "(no description)"),
                            "draft": draft["name"],
                            "keyword": kw,
                            "location": loc,
                            "expected": expected,
                            "actual": actual,
                            "pass": res["pass"],
                            "failures": res["failures"],
                        })

                        if res["pass"]:
                            stats_by_draft[draft["name"]]["passed"] += 1
                            passed += 1
                        else:
                            stats_by_draft[draft["name"]]["failed"] += 1
                            failed += 1

                except Exception as e:
                    stats_by_draft[draft["name"]]["errors"] += 1
                    errors += 1
                    report["tests"].append({
                        "file": file_name,
                        "draft": draft["name"],
                        "status": "error",
                        "message": str(e)
                    })


report["drafts"] = stats_by_draft
report["summary"] = {
    "passed": passed,
    "failed": failed,
    "errors": errors,
    "skipped": skipped,
    "total": passed + failed + errors + skipped
}

# ====================== Save Results ======================
out_dir = os.path.join(__dir__, "data")
os.makedirs(out_dir, exist_ok=True)

json_out = os.path.join(out_dir, "report.json")
html_out = os.path.join(out_dir, "report.html")

with open(json_out, "w", encoding="utf-8") as f:
    json.dump(report, f, indent=2)

generate_html_report(report, html_out)

print("\nFINAL RESULTS")
print(report["summary"])
print(f"JSON → {json_out}")
print(f"HTML → {html_out}")
