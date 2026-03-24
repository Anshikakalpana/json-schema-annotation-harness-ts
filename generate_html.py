import json

def generate_html_report(report, output_path):
    rows = ""
    for t in report["tests"]:
        if "status" in t:
            rows += f"<tr><td>{t.get('file')}</td><td colspan='6' style='color:red'>ERROR: {t.get('message')}</td></tr>"
        else:
            color = "#e6ffed" if t["pass"] else "#ffe6e6"
            rows += f"<tr style='background:{color}'><td>{t['file']}</td><td>{t['draft']}</td><td>{t['keyword']}</td><td>{t['location']}</td><td>{json.dumps(t['expected'])}</td><td>{json.dumps(t['actual'])}</td><td>{'✅ PASS' if t['pass'] else '❌ FAIL'}</td></tr>"

    s = report["summary"]
    html = f"""<!DOCTYPE html>
<html>
<head>
<title>Annotation Report</title>
<style>
body {{font-family:Arial;padding:20px}}
table {{border-collapse:collapse;width:100%}}
th,td {{border:1px solid #ccc;padding:6px;font-size:12px}}
th {{background:#eee}}
</style>
</head>
<body>
<h1>Annotation Test Report</h1>
<p>✅ Passed: {s['passed']} | ❌ Failed: {s['failed']} | ⏭ Skipped: {s['skipped']} | 📉 Failure Rate: {s.get('failureRate','N/A')}</p>
<table>
<tr>
<th>File</th><th>Draft</th><th>Keyword</th><th>Location</th><th>Expected</th><th>Actual</th><th>Status</th>
</tr>
{rows}
</table>
</body>
</html>"""

    with open(output_path, "w", encoding="utf-8") as f:
        f.write(html)