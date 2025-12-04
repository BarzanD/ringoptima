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

  // Kända operatörer för att matcha i texten
  const knownOperators = [
    'Telia Sverige AB',
    'TeliaSonera AB',
    'Tele2 Sverige AB',
    'HI3G Access AB',
    'Hi3G Access AB',
    'Telenor Sverige AB',
    'Telenor',
    'Telness AB',
    'Advoco Software AB',
    'Lycamobile Sweden Limited',
    'Comviq',
    'Halebop',
  ];

  if (phoneData) {
    // Regex för att matcha telefonnummer i början av raden
    const phonePattern = /^(0\d{1,4}[-\s]?[\d\s-]{4,15})/;
    const rawLines = phoneData.split('\n');

    for (const rawLine of rawLines) {
      const line = rawLine.trim();
      if (!line) continue;

      // Hoppa över irrelevanta rader
      if (
        line.startsWith('Telefonnummer') ||
        line.startsWith('Är det') ||
        line.startsWith('Info') ||
        line.startsWith('+46') ||
        line.startsWith('Nyhet') ||
        line.startsWith('Hittar du') ||
        line.startsWith('Lås upp') ||
        line.startsWith('Köp för') ||
        line.startsWith('Information om') ||
        line.startsWith('Andra format') ||
        line.includes('har') && line.includes('andra telefonnummer')
      )
        continue;

      const phoneMatch = line.match(phonePattern);
      if (phoneMatch) {
        const phone = phoneMatch[1].trim().replace(/\s+/g, ' ');
        numbers.push(phone);

        // Hitta operatör i raden
        let foundOperator = '';
        let operatorIndex = -1;
        for (const op of knownOperators) {
          const idx = line.toLowerCase().indexOf(op.toLowerCase());
          if (idx !== -1 && (operatorIndex === -1 || idx < operatorIndex)) {
            foundOperator = op;
            operatorIndex = idx;
          }
        }

        if (foundOperator && operatorIndex !== -1) {
          // Användare är texten mellan telefonnummer och operatör
          const afterPhone = line.substring(phoneMatch[0].length).trim();
          const userText = afterPhone.substring(0, afterPhone.toLowerCase().indexOf(foundOperator.toLowerCase())).trim();

          if (userText && !userText.toLowerCase().includes('kontakta')) {
            users.push(userText);
          }

          // Rensa operatör från (mobile)/(fix) suffix
          const cleanOp = foundOperator
            .replace(/\s*\(mobile\)/gi, '')
            .replace(/\s*\(fix\)/gi, '')
            .trim();
          if (cleanOp) operators.push(cleanOp);
        }
      }
    }
  }

  // Fallback: använd enkelt telefonnummer om inget annat hittades
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

    // VALIDERING: Hoppa över rader utan telefonnummer (firmatecknare är valfritt)
    const hasPhone = extracted.phones && extracted.phones.trim().length > 0;

    if (!hasPhone) {
      console.log(`Hoppar över rad ${i + 1}: ${r[0]} (Saknar telefonnummer)`);
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
