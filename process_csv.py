import csv
import re

input_file = "/Users/a313/Desktop/Dec - 1 - Blad1 (1).csv"
output_file = "/Users/a313/Desktop/B313/processed_output.csv"

# Read the input CSV
with open(input_file, 'r', encoding='utf-8') as f:
    reader = csv.DictReader(f)
    rows = list(reader)

print(f"Total rows read: {len(rows)}")

# Process each row
output_rows = []
for idx, row in enumerate(rows):
    bolag_col = row.get('Bolag', '')
    roll_col = row.get('Roll', '')

    # Extract phone numbers and operators from Bolag column
    phone_operator_pairs = []

    if bolag_col:
        lines = bolag_col.split('\n')
        for line in lines:
            # Split by tabs or multiple spaces
            parts = re.split(r'\t+|\s{2,}', line.strip())

            # Check if first part is a phone number (format: XXX-XXX XX XX or XXX-XX XX XX)
            if len(parts) >= 3:
                phone_match = re.match(r'(\d{3}-\d{3}\s\d{2}\s\d{2}|\d{3}-\d{2}\s\d{2}\s\d{2})', parts[0])
                if phone_match:
                    phone = parts[0].strip()
                    operator = parts[2].strip() if len(parts) > 2 else ''
                    # Clean operator name (remove text in parentheses)
                    operator = re.sub(r'\s*\([^)]*\)', '', operator)
                    phone_operator_pairs.append((phone, operator))

    # Extract companies and roles from Roll column
    company_role_pairs = []

    if roll_col:
        lines = roll_col.split('\n')
        for line in lines:
            # Split by tabs or multiple spaces
            parts = re.split(r'\t+|\s{2,}', line.strip())

            if len(parts) >= 2:
                company = parts[0].strip()
                role = parts[1].strip()
                # Skip header lines, empty lines, and descriptive text
                if (company and role and
                    company != 'Bolag' and role != 'Uppdrag' and
                    not company.startswith('Bolagsengagemang') and
                    not role.startswith('Bolagsengagemang') and
                    not line.strip().startswith('Visa alla') and
                    not re.match(r'\(\d+\s+st\)', line.strip())):
                    company_role_pairs.append((company, role))

    # Create output rows
    # Match phone numbers with companies if both exist
    if phone_operator_pairs or company_role_pairs:
        max_length = max(len(phone_operator_pairs) if phone_operator_pairs else 0,
                        len(company_role_pairs) if company_role_pairs else 0)

        for i in range(max_length):
            output_row = {}

            if i < len(phone_operator_pairs):
                output_row['Telefonnummer'] = phone_operator_pairs[i][0]
                output_row['Operatör'] = phone_operator_pairs[i][1]
            else:
                output_row['Telefonnummer'] = ''
                output_row['Operatör'] = ''

            if i < len(company_role_pairs):
                output_row['Bolag'] = company_role_pairs[i][0]
                output_row['Roll'] = company_role_pairs[i][1]
            else:
                output_row['Bolag'] = ''
                output_row['Roll'] = ''

            output_rows.append(output_row)

print(f"Total output rows: {len(output_rows)}")

# Write the output CSV
with open(output_file, 'w', encoding='utf-8', newline='') as f:
    fieldnames = ['Telefonnummer', 'Operatör', 'Bolag', 'Roll']
    writer = csv.DictWriter(f, fieldnames=fieldnames)
    writer.writeheader()
    writer.writerows(output_rows)

print(f"Output written to: {output_file}")
print(f"\nSample of first 15 rows:")
for i, row in enumerate(output_rows[:15]):
    print(f"Row {i+1}: {row}")
