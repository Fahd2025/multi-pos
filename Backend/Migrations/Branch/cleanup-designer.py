#!/usr/bin/env python3
import sys
import re

if len(sys.argv) != 2:
    print("Usage: python cleanup-designer.py <designer-file>")
    sys.exit(1)

filename = sys.argv[1]

# Read the file
with open(filename, 'r', encoding='utf-8') as f:
    content = f.read()

# Remove .HasColumnType(...) calls while preserving line structure
# Pattern matches: .HasColumnType("...") or .HasColumnType("TEXT") etc.
content = re.sub(r'\s*\.HasColumnType\([^)]+\)', '', content)

# Write back
with open(filename, 'w', encoding='utf-8') as f:
    f.write(content)

print(f"✅ Cleaned up {filename}")
