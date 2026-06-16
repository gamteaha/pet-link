import json
import re

transcript_path = r"C:\Users\user\.gemini\antigravity-ide\brain\7e1ac9a7-2077-43e7-97a7-e8e0b0356745\.system_generated\logs\transcript.jsonl"
out_path = r"C:\antigravity\pet-link\dedenne-web\scratch\dump_filtered.tsx"

code_lines = {}

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            content = data.get("content", "")
            if "app/customize/page.tsx" in content and "The following code has been modified to include a line number" in content:
                for text_line in content.split("\n"):
                    match = re.match(r"^(\d+): (.*)$", text_line)
                    if match:
                        lineno = int(match.group(1))
                        code_lines[lineno] = match.group(2)
        except:
            pass

with open(out_path, "w", encoding="utf-8") as out:
    for i in range(1, max(code_lines.keys()) + 1 if code_lines else 1):
        out.write(code_lines.get(i, f"// MISSING {i}") + "\n")

print(f"Extracted {len(code_lines)} lines")
