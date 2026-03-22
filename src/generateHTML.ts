import fs from "fs";

export function generateHTMLReport(report, outputPath) {
  const rows = report.tests
    .map((t) => `
      <tr class="${t.pass ? "pass-row" : "fail-row"}">
        <td>${t.file}</td>
        <td>${t.draft}</td>
        <td>${t.keyword}</td>
        <td>${t.location}</td>
        <td>${JSON.stringify(t.expected)}</td>
        <td>${JSON.stringify(t.actual)}</td>
        <td>${t.pass ? "✅ PASS" : "❌ FAIL"}</td>
      </tr>
    `)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head>
  <title>Annotation Report</title>
  <style>
    body { font-family: Arial; padding: 20px; }

    .pass { color: green; }
    .fail { color: red; }

    table {
      border-collapse: collapse;
      width: 100%;
      margin-top: 20px;
    }

    th, td {
      border: 1px solid #ccc;
      padding: 6px;
      font-size: 12px;
    }

    th {
      background: #eee;
    }

    .pass-row {
      background-color: #e6ffed;
    }

    .fail-row {
      background-color: #ffe6e6;
    }
  </style>
</head>
<body>

<h1>📊 Annotation Test Report</h1>

<h2>Summary</h2>
<p>✅ Passed: <span class="pass">${report.summary.passed}</span></p>
<p>❌ Failed: <span class="fail">${report.summary.failed}</span></p>
<p>⚠ Errors: ${report.summary.errors}</p>
<p>⏭ Skipped: ${report.summary.skipped}</p>
<p>📉 Failure Rate: ${report.summary.failureRate}</p>

<h2>All Tests</h2>

<table>
<tr>
  <th>File</th>
  <th>Draft</th>
  <th>Keyword</th>
  <th>Location</th>
  <th>Expected</th>
  <th>Actual</th>
  <th>Status</th>
</tr>

${rows}

</table>

</body>
</html>
`;

  fs.writeFileSync(outputPath, html, "utf-8");
}