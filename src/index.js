"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var draft_04_1 = require("@hyperjump/json-schema/draft-04");
var draft_06_1 = require("@hyperjump/json-schema/draft-06");
var draft_07_1 = require("@hyperjump/json-schema/draft-07");
var draft_2019_09_1 = require("@hyperjump/json-schema/draft-2019-09");
var draft_2020_12_1 = require("@hyperjump/json-schema/draft-2020-12");
var experimental_1 = require("@hyperjump/json-schema/annotations/experimental");
var AnnotatedInstance = require("@hyperjump/json-schema/annotated-instance/experimental");
var path_1 = require("path");
var url_1 = require("url");
var fs_1 = require("fs");
var commander_1 = require("commander"); // npm install commander
var cli_table3_1 = require("cli-table3"); // npm install cli-table3
var xml2js_1 = require("xml2js"); // npm install xml2js (for JUnit)
var __dirname = path_1.default.dirname((0, url_1.fileURLToPath)(import.meta.url));
// ----------------------------------------------------------------------
// 1. Configuration & CLI
// ----------------------------------------------------------------------
commander_1.program
    .option("-d, --drafts <drafts>", "Comma-separated list of drafts to run (e.g., draft-04,draft-2020-12)")
    .option("-f, --file <file>", "Run only a specific test file (name or path)")
    .option("--filter <pattern>", "Run only tests whose description matches the pattern")
    .option("--format <format>", "Output format: console, json, junit", "console")
    .option("--strict", "Enable strict mode: fail on extra annotations")
    .option("--fail-fast", "Stop on first failure")
    .option("--mock", "Run against a mock implementation that returns no annotations (for self-test)")
    .parse(process.argv);
var options = commander_1.program.opts();
// ----------------------------------------------------------------------
// 2. Draft definitions
// ----------------------------------------------------------------------
var DRAFTS = [
    {
        name: "draft-04",
        dialectId: "http://json-schema.org/draft-04/schema",
        registerSchema: draft_04_1.registerSchema,
        compatibilityValue: 4,
    },
    {
        name: "draft-06",
        dialectId: "http://json-schema.org/draft-06/schema",
        registerSchema: draft_06_1.registerSchema,
        compatibilityValue: 6,
    },
    {
        name: "draft-07",
        dialectId: "http://json-schema.org/draft-07/schema",
        registerSchema: draft_07_1.registerSchema,
        compatibilityValue: 7,
    },
    {
        name: "draft-2019-09",
        dialectId: "https://json-schema.org/draft/2019-09/schema",
        registerSchema: draft_2019_09_1.registerSchema,
        compatibilityValue: 2019,
    },
    {
        name: "draft-2020-12",
        dialectId: "https://json-schema.org/draft/2020-12/schema",
        registerSchema: draft_2020_12_1.registerSchema,
        compatibilityValue: 2020,
    },
];
// Filter drafts by CLI option
var draftsToRun = DRAFTS;
if (options.drafts) {
    var names_1 = options.drafts.split(',').map(function (s) { return s.trim(); });
    draftsToRun = DRAFTS.filter(function (d) { return names_1.includes(d.name); });
    if (draftsToRun.length === 0) {
        console.error("No matching drafts. Available: ".concat(DRAFTS.map(function (d) { return d.name; }).join(', ')));
        process.exit(1);
    }
}
// ----------------------------------------------------------------------
// 3. Compatibility helper
// ----------------------------------------------------------------------
function isCompatible(compatibility, draftVersion) {
    if (!compatibility)
        return true;
    var versionMap = {
        "3": 3, "4": 4, "6": 6, "7": 7, "2019": 2019, "2020": 2020,
    };
    var resolveVersion = function (str) { var _a; return (_a = versionMap[str]) !== null && _a !== void 0 ? _a : parseInt(str); };
    var match = compatibility.match(/^(<=|>=|=)?(\d+)$/);
    if (!match)
        return false;
    var operator = match[1], versionStr = match[2];
    var version = resolveVersion(versionStr);
    if (operator === "<=")
        return draftVersion <= version;
    if (operator === ">=")
        return draftVersion >= version;
    if (operator === "=")
        return draftVersion === version;
    // default: assume >=
    return draftVersion >= version;
}
// ----------------------------------------------------------------------
// 4. Mock implementation for self-test
// ----------------------------------------------------------------------
function mockAnnotate(schemaId, instance) {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            // Return a dummy instance node with no annotations
            return [2 /*return*/, AnnotatedInstance.fromJs(instance)];
        });
    });
}
function extractAnnotations(actual) {
    // Try to detect if actual items contain location info
    return actual.map(function (item) {
        var _a;
        if (item && typeof item === 'object' && 'keywordLocation' in item) {
            return { value: (_a = item.value) !== null && _a !== void 0 ? _a : item, schemaLocation: item.keywordLocation };
        }
        // If it's just a primitive, we have no location
        return { value: item };
    });
}
function compareAnnotations(actual, expected, strict) {
    var _a, _b;
    var failures = [];
    var annotations = extractAnnotations(actual);
    // Build a map of schemaLocation -> list of values found
    var foundMap = new Map();
    for (var _i = 0, annotations_1 = annotations; _i < annotations_1.length; _i++) {
        var ann = annotations_1[_i];
        var loc = (_a = ann.schemaLocation) !== null && _a !== void 0 ? _a : ''; // use empty string for unknown location
        if (!foundMap.has(loc))
            foundMap.set(loc, []);
        foundMap.get(loc).push(ann.value);
    }
    var _loop_1 = function (schemaLoc, expectedValue) {
        var foundValues = (_b = foundMap.get(schemaLoc)) !== null && _b !== void 0 ? _b : [];
        var matchedIndex = foundValues.findIndex(function (v) {
            return JSON.stringify(v) === JSON.stringify(expectedValue);
        });
        if (matchedIndex === -1) {
            failures.push("Schema location \"".concat(schemaLoc, "\" \u2013 expected ").concat(JSON.stringify(expectedValue), " but not found (found: ").concat(JSON.stringify(foundValues), ")"));
        }
        else {
            // Remove matched value to handle duplicates
            foundValues.splice(matchedIndex, 1);
            if (foundValues.length === 0)
                foundMap.delete(schemaLoc);
        }
    };
    // Check each expected entry
    for (var _c = 0, _d = Object.entries(expected); _c < _d.length; _c++) {
        var _e = _d[_c], schemaLoc = _e[0], expectedValue = _e[1];
        _loop_1(schemaLoc, expectedValue);
    }
    // If strict, check for extra annotations
    if (strict) {
        for (var _f = 0, _g = foundMap.entries(); _f < _g.length; _f++) {
            var _h = _g[_f], loc = _h[0], values = _h[1];
            for (var _j = 0, values_1 = values; _j < values_1.length; _j++) {
                var val = values_1[_j];
                failures.push("Unexpected annotation at \"".concat(loc || '<unknown location>', "\": ").concat(JSON.stringify(val)));
            }
        }
    }
    return { pass: failures.length === 0, failures: failures };
}
// ----------------------------------------------------------------------
// 6. Test discovery
// ----------------------------------------------------------------------
var testDir = path_1.default.join(__dirname, "../JSON-Schema-Test-Suite/annotations/tests");
var testFiles = fs_1.default
    .readdirSync(testDir)
    .filter(function (f) { return f.endsWith(".json"); })
    .map(function (f) { return path_1.default.join(testDir, f); });
if (options.file) {
    // Allow partial match
    testFiles = testFiles.filter(function (f) { return path_1.default.basename(f).includes(options.file); });
    if (testFiles.length === 0) {
        console.error("No test file matching \"".concat(options.file, "\""));
        process.exit(1);
    }
}
var draftStats = {};
for (var _i = 0, draftsToRun_1 = draftsToRun; _i < draftsToRun_1.length; _i++) {
    var d = draftsToRun_1[_i];
    draftStats[d.name] = { passed: 0, failed: 0, errors: 0, skipped: 0 };
}
var totalPassed = 0;
var totalFailed = 0;
var totalErrors = 0;
var totalSkipped = 0;
var testCases = [];
// ----------------------------------------------------------------------
// 8. Main test runner
// ----------------------------------------------------------------------
function run() {
    return __awaiter(this, void 0, void 0, function () {
        var _i, testFiles_1, filePath, fileName, raw, suites, _a, suites_1, suite, _b, _c, test, _d, draftsToRun_2, draft, schemaId, schemaToRegister, annotateFn, instance, _e, _f, assertion, location_1, keyword, expected, pointer, actual, node, _g, pass, failures, _h, failures_1, failure, err_1;
        var _j, _k, _l, _m, _o, _p, _q;
        return __generator(this, function (_r) {
            switch (_r.label) {
                case 0:
                    _i = 0, testFiles_1 = testFiles;
                    _r.label = 1;
                case 1:
                    if (!(_i < testFiles_1.length)) return [3 /*break*/, 12];
                    filePath = testFiles_1[_i];
                    fileName = path_1.default.basename(filePath);
                    console.log("\n".concat("=".repeat(60)));
                    console.log(" File: ".concat(fileName));
                    console.log("=".repeat(60));
                    raw = JSON.parse(fs_1.default.readFileSync(filePath, "utf-8"));
                    suites = Array.isArray(raw) ? raw : (_j = raw.suite) !== null && _j !== void 0 ? _j : [];
                    _a = 0, suites_1 = suites;
                    _r.label = 2;
                case 2:
                    if (!(_a < suites_1.length)) return [3 /*break*/, 11];
                    suite = suites_1[_a];
                    console.log("\n Suite: ".concat(suite.description));
                    _b = 0, _c = suite.tests;
                    _r.label = 3;
                case 3:
                    if (!(_b < _c.length)) return [3 /*break*/, 10];
                    test = _c[_b];
                    // Filter by description if --filter provided
                    if (options.filter && !((_k = test.description) === null || _k === void 0 ? void 0 : _k.includes(options.filter))) {
                        return [3 /*break*/, 9];
                    }
                    console.log("\n   Test: ".concat((_l = test.description) !== null && _l !== void 0 ? _l : "(no description)"));
                    _d = 0, draftsToRun_2 = draftsToRun;
                    _r.label = 4;
                case 4:
                    if (!(_d < draftsToRun_2.length)) return [3 /*break*/, 9];
                    draft = draftsToRun_2[_d];
                    if (!isCompatible(suite.compatibility, draft.compatibilityValue)) {
                        console.log("  SKIP [".concat(draft.name, "] \u2014 needs compat ").concat(suite.compatibility));
                        draftStats[draft.name].skipped++;
                        totalSkipped++;
                        testCases.push({
                            file: fileName,
                            suite: suite.description,
                            test: (_m = test.description) !== null && _m !== void 0 ? _m : "",
                            draft: draft.name,
                            keyword: "",
                            location: "",
                            status: 'skip'
                        });
                        return [3 /*break*/, 8];
                    }
                    schemaId = "https://example.com/test-".concat(Date.now(), "-").concat(Math.random());
                    _r.label = 5;
                case 5:
                    _r.trys.push([5, 7, , 8]);
                    schemaToRegister = suite.schema.$schema
                        ? suite.schema
                        : __assign({ $schema: draft.dialectId }, suite.schema);
                    draft.registerSchema(schemaToRegister, schemaId);
                    annotateFn = options.mock ? mockAnnotate : experimental_1.annotate;
                    return [4 /*yield*/, annotateFn(schemaId, test.instance)];
                case 6:
                    instance = _r.sent();
                    for (_e = 0, _f = test.assertions; _e < _f.length; _e++) {
                        assertion = _f[_e];
                        location_1 = assertion.location, keyword = assertion.keyword, expected = assertion.expected;
                        pointer = location_1 === "" ? "#" : "#".concat(location_1);
                        actual = [];
                        try {
                            node = AnnotatedInstance.get(pointer, instance);
                            actual = node
                                ? AnnotatedInstance.annotation(node, keyword, draft.dialectId)
                                : [];
                        }
                        catch (_s) {
                            actual = [];
                        }
                        _g = compareAnnotations(actual, expected, !!options.strict), pass = _g.pass, failures = _g.failures;
                        // Record result
                        if (pass) {
                            console.log("  PASS [".concat(draft.name, "] \u2014 [").concat(keyword, "] @ \"").concat(location_1, "\""));
                            draftStats[draft.name].passed++;
                            totalPassed++;
                            testCases.push({
                                file: fileName,
                                suite: suite.description,
                                test: (_o = test.description) !== null && _o !== void 0 ? _o : "",
                                draft: draft.name,
                                keyword: keyword,
                                location: location_1,
                                status: 'pass'
                            });
                        }
                        else {
                            console.log("  FAIL [".concat(draft.name, "] \u2014 [").concat(keyword, "] @ \"").concat(location_1, "\""));
                            console.log("   Expected : ".concat(JSON.stringify(expected)));
                            console.log("   Actual   : ".concat(JSON.stringify(actual)));
                            for (_h = 0, failures_1 = failures; _h < failures_1.length; _h++) {
                                failure = failures_1[_h];
                                console.log("   \u21B3 ".concat(failure));
                            }
                            draftStats[draft.name].failed++;
                            totalFailed++;
                            testCases.push({
                                file: fileName,
                                suite: suite.description,
                                test: (_p = test.description) !== null && _p !== void 0 ? _p : "",
                                draft: draft.name,
                                keyword: keyword,
                                location: location_1,
                                status: 'fail',
                                message: failures.join('; ')
                            });
                            if (options.failFast) {
                                console.error("Fail-fast enabled, exiting.");
                                process.exit(1);
                            }
                        }
                    }
                    return [3 /*break*/, 8];
                case 7:
                    err_1 = _r.sent();
                    console.log("  ERROR [".concat(draft.name, "] \u2014 ").concat(err_1.message));
                    draftStats[draft.name].errors++;
                    totalErrors++;
                    testCases.push({
                        file: fileName,
                        suite: suite.description,
                        test: (_q = test.description) !== null && _q !== void 0 ? _q : "",
                        draft: draft.name,
                        keyword: "",
                        location: "",
                        status: 'error',
                        message: err_1.message
                    });
                    if (options.failFast)
                        process.exit(1);
                    return [3 /*break*/, 8];
                case 8:
                    _d++;
                    return [3 /*break*/, 4];
                case 9:
                    _b++;
                    return [3 /*break*/, 3];
                case 10:
                    _a++;
                    return [3 /*break*/, 2];
                case 11:
                    _i++;
                    return [3 /*break*/, 1];
                case 12: return [2 /*return*/];
            }
        });
    });
}
// ----------------------------------------------------------------------
// 9. Reporting
// ----------------------------------------------------------------------
function printConsoleResults() {
    console.log("\n".concat("=".repeat(60)));
    console.log("RESULTS PER DRAFT");
    console.log("=".repeat(60));
    var table = new cli_table3_1.default({
        head: ['Draft', 'Passed', 'Failed', 'Errors', 'Skipped', 'Total'],
        colWidths: [15, 8, 8, 8, 8, 8]
    });
    for (var _i = 0, draftsToRun_3 = draftsToRun; _i < draftsToRun_3.length; _i++) {
        var draft = draftsToRun_3[_i];
        var s = draftStats[draft.name];
        var total = s.passed + s.failed + s.errors;
        table.push([draft.name, s.passed, s.failed, s.errors, s.skipped, total]);
    }
    console.log(table.toString());
    console.log("\n".concat("=".repeat(60)));
    console.log(" GRAND TOTAL");
    console.log("=".repeat(60));
    console.log(" Passed  : ".concat(totalPassed));
    console.log(" Failed  : ".concat(totalFailed));
    console.log(" Errors  : ".concat(totalErrors));
    console.log(" Skipped : ".concat(totalSkipped));
    console.log(" Total   : ".concat(totalPassed + totalFailed + totalErrors));
    console.log("=".repeat(60));
}
function writeJsonReport() {
    var report = {
        summary: {
            passed: totalPassed,
            failed: totalFailed,
            errors: totalErrors,
            skipped: totalSkipped,
            total: totalPassed + totalFailed + totalErrors
        },
        drafts: draftsToRun.map(function (d) { return (__assign({ name: d.name }, draftStats[d.name])); }),
        testCases: testCases
    };
    fs_1.default.writeFileSync('report.json', JSON.stringify(report, null, 2));
    console.log('JSON report written to report.json');
}
function writeJunitReport() {
    var builder = new xml2js_1.Builder();
    var testsuites = {
        testsuites: {
            testsuite: []
        }
    };
    // Group by file
    var byFile = new Map();
    for (var _i = 0, testCases_1 = testCases; _i < testCases_1.length; _i++) {
        var tc = testCases_1[_i];
        if (!byFile.has(tc.file))
            byFile.set(tc.file, []);
        byFile.get(tc.file).push(tc);
    }
    for (var _a = 0, _b = byFile.entries(); _a < _b.length; _a++) {
        var _c = _b[_a], file = _c[0], cases = _c[1];
        var suite = {
            $: {
                name: file,
                tests: cases.length,
                failures: cases.filter(function (c) { return c.status === 'fail'; }).length,
                errors: cases.filter(function (c) { return c.status === 'error'; }).length,
                skipped: cases.filter(function (c) { return c.status === 'skip'; }).length
            },
            testcase: []
        };
        for (var _d = 0, cases_1 = cases; _d < cases_1.length; _d++) {
            var tc = cases_1[_d];
            var testcase = {
                $: {
                    name: "".concat(tc.draft, ": ").concat(tc.suite, " - ").concat(tc.test, " [").concat(tc.keyword, "@").concat(tc.location, "]"),
                    classname: tc.file
                }
            };
            if (tc.status === 'fail') {
                testcase.failure = { $: { message: tc.message } };
            }
            else if (tc.status === 'error') {
                testcase.error = { $: { message: tc.message } };
            }
            else if (tc.status === 'skip') {
                testcase.skipped = {};
            }
            suite.testcase.push(testcase);
        }
        testsuites.testsuites.testsuite.push(suite);
    }
    var xml = builder.buildObject(testsuites);
    fs_1.default.writeFileSync('report.xml', xml);
    console.log('JUnit report written to report.xml');
}
// ----------------------------------------------------------------------
// 10. Main execution
// ----------------------------------------------------------------------
run().then(function () {
    if (options.format === 'json') {
        writeJsonReport();
    }
    else if (options.format === 'junit') {
        writeJunitReport();
    }
    else {
        printConsoleResults();
    }
    // Exit with appropriate code
    process.exit(totalFailed > 0 || totalErrors > 0 ? 1 : 0);
}).catch(function (err) {
    console.error('Unhandled error:', err);
    process.exit(1);
});
