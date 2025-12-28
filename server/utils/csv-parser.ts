/**
 * Simple CSV Parser
 * Handles CSV files with header row and converts to array of objects
 */

export interface ParsedCSVRow {
  [key: string]: string;
}

export interface ParseResult {
  data: ParsedCSVRow[];
  errors: Array<{ row: number; error: string }>;
}

/**
 * Parse CSV string into array of objects
 * @param csvText CSV content as string
 * @returns Object with data array and errors array
 */
export function parseCSV(csvText: string): ParseResult {
  const result: ParseResult = {
    data: [],
    errors: [],
  };

  try {
    const lines = csvText.split('\n').map(line => line.trim()).filter(line => line.length > 0);
    
    if (lines.length === 0) {
      result.errors.push({ row: 1, error: 'CSV file is empty' });
      return result;
    }

    // Parse header row
    const headers = parseCSVLine(lines[0]);
    if (headers.length === 0) {
      result.errors.push({ row: 1, error: 'CSV header row is empty' });
      return result;
    }

    // Normalize header names (trim, lowercase, replace spaces with underscores)
    const normalizedHeaders = headers.map(h => h.trim().toLowerCase().replace(/\s+/g, '_'));

    // Parse data rows
    for (let i = 1; i < lines.length; i++) {
      try {
        const values = parseCSVLine(lines[i]);
        
        // Skip empty rows
        if (values.every(v => !v || v.trim() === '')) {
          continue;
        }

        // Create object from headers and values
        const row: ParsedCSVRow = {};
        for (let j = 0; j < normalizedHeaders.length; j++) {
          const header = normalizedHeaders[j];
          const value = values[j] || '';
          row[header] = value.trim();
        }

        result.data.push(row);
      } catch (error: any) {
        result.errors.push({
          row: i + 1,
          error: `Error parsing row: ${error.message}`,
        });
      }
    }
  } catch (error: any) {
    result.errors.push({
      row: 0,
      error: `Error parsing CSV: ${error.message}`,
    });
  }

  return result;
}

/**
 * Parse a single CSV line, handling quoted fields
 * @param line CSV line string
 * @returns Array of field values
 */
function parseCSVLine(line: string): string[] {
  const fields: string[] = [];
  let currentField = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];
    const nextChar = line[i + 1];

    if (char === '"') {
      if (inQuotes && nextChar === '"') {
        // Escaped quote
        currentField += '"';
        i += 2;
      } else {
        // Toggle quote state
        inQuotes = !inQuotes;
        i++;
      }
    } else if (char === ',' && !inQuotes) {
      // Field separator
      fields.push(currentField);
      currentField = '';
      i++;
    } else {
      currentField += char;
      i++;
    }
  }

  // Add last field
  fields.push(currentField);

  return fields;
}

/**
 * Convert Excel file buffer to CSV string
 * For now, we'll require CSV format. Excel support can be added later with a library like xlsx
 */
export async function excelToCSV(fileBuffer: Buffer, mimeType: string): Promise<string> {
  // For now, we only support CSV files
  // Excel support would require adding 'xlsx' or 'exceljs' library
  if (mimeType === 'text/csv' || mimeType === 'text/plain') {
    return fileBuffer.toString('utf-8');
  }

  throw new Error(`Excel file format not yet supported. Please convert to CSV first. MIME type: ${mimeType}`);
}

