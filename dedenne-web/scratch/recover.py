import json
import re

transcript_path = r"C:\Users\user\.gemini\antigravity-ide\brain\7e1ac9a7-2077-43e7-97a7-e8e0b0356745\.system_generated\logs\transcript.jsonl"

lines_extracted = {}

with open(transcript_path, "r", encoding="utf-8") as f:
    for line in f:
        try:
            data = json.loads(line)
            if "tool_calls" in data:
                for tc in data["tool_calls"]:
                    func = tc.get("function", {})
                    if func.get("name") == "default_api:view_file":
                        response = tc.get("response", {})
                        output = response.get("output", "")
                        if "page.tsx" in output and "The following code has been modified to include a line number" in output:
                            for text_line in output.split("\n"):
                                match = re.match(r"^(\d+): (.*)$", text_line)
                                if match:
                                    lineno = int(match.group(1))
                                    lines_extracted[lineno] = match.group(2)
        except Exception as e:
            pass

with open("scratch/recovered_page.tsx", "w", encoding="utf-8") as out:
    if lines_extracted:
        for i in range(1, max(lines_extracted.keys()) + 1):
            out.write(lines_extracted.get(i, f"// MISSING LINE {i}") + "\n")
    else:
        out.write("// NO LINES EXTRACTED\n")

print(f"Recovered {len(lines_extracted)} lines")
