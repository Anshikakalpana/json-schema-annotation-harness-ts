// ─── COMPARE ─────────────────────────────────────────────────────────────────

/**
 * Compares actual annotations collected by hyperjump against expected
 * annotations from the test suite.
 *
 * Expected format from test suite:
 *   { "#/properties/foo": "Foo", "#/properties/bar": "Bar" }
 *   Keys   = schema locations (where in the SCHEMA annotation comes from)
 *   Values = annotation values
 *
 * Actual format from hyperjump:
 *   unknown[] — e.g. ["Foo", "Bar"]
 *   Only VALUES are returned — no schema location information.
 *
 * ─── SCHEMA LOCATION VERIFICATION LIMITATION ────────────────────────────────
 *
 * The test suite's expected format is keyed by SCHEMA location:
 *   { "#/properties/foo": "Foo" }
 *
 * However, @hyperjump/json-schema's public annotation API returns only VALUES:
 *   AnnotatedInstance.annotation(node, keyword, dialectId) → ["Foo"]
 *
 * There is no public API to determine which schema location produced which
 * annotation value. Therefore this harness:
 *
 *   ✅ Verifies all expected annotation VALUES are present
 *   ✅ Verifies no extra unexpected annotation values exist (count check)
 *   ✅ Reports exactly which expected schema location's value was not found
 *   ❌ Cannot verify which schema location produced which value (API limitation)
 *
 * ─── INSIGHT FOR #994 ────────────────────────────────────────────────────────
 *
 * This limitation has an important implication for the unified validation suite:
 * The expected format should NOT require schema-location-keyed values if most
 * implementations cannot easily expose this information. A simpler format
 * (just values, or instance-location-keyed) would be more implementer-friendly
 * and reduce the barrier for writing compliant test harnesses.
 *
 * Returns: { pass, failures[] } — failures lists exactly which entries failed
 */