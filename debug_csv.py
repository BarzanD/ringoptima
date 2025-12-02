import csv

input_file = "/Users/a313/Desktop/Dec - 1 - Blad1 (1).csv"

# Read the input CSV
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

# Check first few rows
for idx in range(min(5, len(rows))):
    print(f"\n{'='*80}")
    print(f"ROW {idx + 1}")
    print(f"{'='*80}")
    print(f"Förnamn: {rows[idx].get('Förnamn', 'N/A')}")
    print(f"Efternamn: {rows[idx].get('Efternamn', 'N/A')}")
    print(f"\nTelefonnummer column content:")
    print(repr(rows[idx].get('Telefonnummer', '')))
    print(f"\nBolag column content:")
    print(repr(rows[idx].get('Bolag', '')))
    print(f"\nRoll column content:")
    print(repr(rows[idx].get('Roll', '')))
