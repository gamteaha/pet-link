import json
import re

transcript_path = r"C:\Users\user\.gemini\antigravity-ide\brain\7e1ac9a7-2077-43e7-97a7-e8e0b0356745\.system_generated\logs\transcript.jsonl"
out_path = r"C:\antigravity\pet-link\dedenne-web\scratch\dump.txt"

with open(transcript_path, "r", encoding="utf-8") as f, open(out_path, "w", encoding="utf-8") as out:
    for line in f:
        if "page.tsx" in line:
            # write raw line to see what it looks like
            out.write(line + "\n")
