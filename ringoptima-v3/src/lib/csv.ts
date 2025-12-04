import type { Contact } from '../types';

export function parseCSV(text: string): string[][] {
  const lines = text.split('\n');
  const result: string[][] = [];
  let currentLine = '';
  let inQuotes = false;

  for (const line of lines) {
    currentLine += line;
    inQuotes = (currentLine.match(/"/g) || []).length % 2 !== 0;

    if (!inQuotes) {
      const row: string[] = [];
      let cell = '';
      let inside = false;

      for (const char of currentLine) {
        if (char === '"') inside = !inside;
        else if (char === ',' && !inside) {
          row.push(cell);
          cell = '';
        } else cell += char;
      }
      row.push(cell);
      if (row.some((c) => c.trim())) result.push(row);
      currentLine = '';
    } else currentLine += '\n';
  }

  return result;
}

function extractPhoneData(simplePhone: string, phoneData: string, styrelse: string) {
  const numbers: string[] = [];
  const users: string[] = [];
  const operators: string[] = [];
  let kontakt = '';
  let roll = '';

  if (phoneData) {
    const phonePattern = /^0\d{1,3}[-\s]?[\d\s-]{4,}/;
    const continuationPattern = /^[\d\s-]{2,}$/;
    const rawLines = phoneData.split('\n');

    // Pre-process: join lines that are continuations of phone numbers
    const processedLines: string[] = [];
    for (let i = 0; i < rawLines.length; i++) {
      let line = rawLines[i].trim();
      if (!line) continue;

      // Check if next line is a continuation
      while (i + 1 < rawLines.length) {
        const nextLine = rawLines[i + 1].trim();
        if (nextLine && continuationPattern.test(nextLine) && !nextLine.startsWith('0')) {
          line += ' ' + nextLine;
          i++;
        } else {
          break;
        }
      }
      processedLines.push(line);
    }

    for (const line of processedLines) {
      if (
        line.startsWith('Telefonnummer') ||
        line.startsWith('Är det') ||
        line.startsWith('Info') ||
        line.startsWith('+46')
      )
        continue;

      if (phonePattern.test(line)) {
        let parts = line.split('\t').filter((p) => p.trim());
        if (parts.length < 3) parts = line.split(/\s{4,}/).filter((p) => p.trim());
        if (parts.length < 3) parts = line.split(/\s{2,}/).filter((p) => p.trim());

        if (parts.length >= 3) {
          const phone = parts[0].trim().replace(/\s+/g, ' ');
          numbers.push(phone);
          users.push(parts[1].trim());
          const op = parts[2]
            .trim()
            .replace(/\s*\(mobile\)/gi, '')
            .replace(/\s*\(fix\)/gi, '');
          if (op && !op.toLowerCase().includes('kontakta')) operators.push(op);
        } else if (parts.length >= 1) {
          const phone = parts[0].trim().replace(/\s+/g, ' ');
          numbers.push(phone);
        }
      }
    }
  }

  if (numbers.length === 0 && simplePhone?.trim() && /^0\d{1,3}[-\s]?[\d\s-]{4,}/.test(simplePhone)) {
    numbers.push(simplePhone.trim());
  }

  if (styrelse) {
    const patterns: [RegExp, string][] = [
      [/Verkställande direktör[:\t\s]+([^\n\t]+)/i, 'Verkställande direktör'],
      [/Extern verkställande direktör[:\t\s]+([^\n\t]+)/i, 'Extern VD'],
      [/Ordförande[:\t\s]+([^\n\t]+)/i, 'Ordförande'],
      [/Styrelseledamot[:\t\s]+([^\n\t]+)/i, 'Styrelseledamot'],
      [/Styrelsesuppleant[:\t\s]+([^\n\t]+)/i, 'Styrelsesuppleant'],
    ];

    for (const [pat, r] of patterns) {
      const m = styrelse.match(pat);
      if (m) {
        const name = m[1].trim().split('\t')[0].trim();
        if (name && !name.toLowerCase().includes('lägg till')) {
          kontakt = name;
          roll = r;
          break;
        }
      }
    }
  }

  return {
    phones: numbers.join('\n'),
    users: users.join('\n'),
    operators: operators.join('\n'),
    contact: kontakt,
    role: roll,
  };
}

export function transformCSV(rows: string[][], batchId: number): Omit<Contact, 'id'>[] {
  const contacts: Omit<Contact, 'id'>[] = [];
  const now = new Date().toISOString();

  for (let i = 1; i < rows.length; i++) {
    const r = rows[i];
    if (r.length < 3 || !r[0]?.trim()) continue;

    const extracted = extractPhoneData(r[4] || '', r[5] || '', r[6] || '');

    // KRITISK VALIDERING: Hoppa över rader utan telefonnummer ELLER firmatecknare
    const hasPhone = extracted.phones && extracted.phones.trim().length > 0;
    const hasContact = extracted.contact && extracted.contact.trim().length > 0;

    if (!hasPhone || !hasContact) {
      console.log(`Hoppar över rad ${i + 1}: ${r[0]} (Saknar ${!hasPhone ? 'telefonnummer' : ''} ${!hasPhone && !hasContact ? 'och' : ''} ${!hasContact ? 'firmatecknare' : ''})`);
      continue;
    }

    contacts.push({
      batchId,
      name: r[0].trim(),
      org: (r[1] || '').trim(),
      address: (r[2] || '').trim(),
      city: (r[3] || '').trim(),
      ...extracted,
      notes: '',
      priority: 'medium',
      status: 'new',
      createdAt: now,
      updatedAt: now,
    });
  }

  return contacts;
}

export function exportToCSV(contacts: Contact[]): string {
  const headers = [
    'NAMN',
    'ORG',
    'ADRESS',
    'ORT',
    'NUMMER',
    'ANVÄNDARE',
    'OPERATÖR',
    'KONTAKT',
    'ROLL',
    'STATUS',
    'PRIORITET',
    'ANTECKNINGAR',
  ];

  const rows = contacts.map((c) => [
    c.name,
    c.org,
    c.address,
    c.city,
    c.phones,
    c.users,
    c.operators,
    c.contact,
    c.role,
    c.status,
    c.priority,
    c.notes || '',
  ]);

  const csvData = [headers, ...rows].map((row) =>
    row
      .map((cell) =>
        cell?.includes(',') || cell?.includes('\n') ? `"${cell.replace(/"/g, '""')}"` : cell || ''
      )
      .join(',')
  );

  return '\ufeff' + csvData.join('\n');
}
