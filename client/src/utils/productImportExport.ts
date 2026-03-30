import type { Product, ProductInput } from '../types';
import { getProductImages } from './product';

const CSV_HEADERS = [
  'id',
  'name',
  'price',
  'category',
  'description',
  'stock',
  'requiresPrescription',
  'manufacturer',
  'dosage',
  'featured',
  'images',
] as const;

const normalizeHeader = (value: string) =>
  value.trim().toLowerCase().replace(/[\s-]+/g, '_');

const splitImageValues = (value: unknown) => {
  if (Array.isArray(value)) {
    return Array.from(
      new Set(value.map((item) => `${item ?? ''}`.trim()).filter(Boolean)),
    );
  }

  if (typeof value === 'string') {
    return Array.from(
      new Set(value.split(/[\r\n|]+/g).map((item) => item.trim()).filter(Boolean)),
    );
  }

  return [];
};

const parseBoolean = (value: unknown, fallback = false) => {
  if (typeof value === 'boolean') {
    return value;
  }

  if (typeof value === 'string') {
    const normalizedValue = value.trim().toLowerCase();
    if (['true', '1', 'yes'].includes(normalizedValue)) {
      return true;
    }
    if (['false', '0', 'no'].includes(normalizedValue)) {
      return false;
    }
  }

  return fallback;
};

const parseNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const parseCsvRows = (input: string) => {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentValue = '';
  let insideQuotes = false;

  for (let index = 0; index < input.length; index += 1) {
    const character = input[index];
    const nextCharacter = input[index + 1];

    if (character === '"') {
      if (insideQuotes && nextCharacter === '"') {
        currentValue += '"';
        index += 1;
      } else {
        insideQuotes = !insideQuotes;
      }
      continue;
    }

    if (character === ',' && !insideQuotes) {
      currentRow.push(currentValue);
      currentValue = '';
      continue;
    }

    if ((character === '\n' || character === '\r') && !insideQuotes) {
      if (character === '\r' && nextCharacter === '\n') {
        index += 1;
      }

      currentRow.push(currentValue);
      if (currentRow.some((value) => value.trim() !== '')) {
        rows.push(currentRow);
      }

      currentRow = [];
      currentValue = '';
      continue;
    }

    currentValue += character;
  }

  if (currentValue.length > 0 || currentRow.length > 0) {
    currentRow.push(currentValue);
    if (currentRow.some((value) => value.trim() !== '')) {
      rows.push(currentRow);
    }
  }

  return rows;
};

const escapeCsvValue = (value: unknown) => {
  const stringValue = `${value ?? ''}`;
  if (/[",\n\r]/.test(stringValue)) {
    return `"${stringValue.replace(/"/g, '""')}"`;
  }
  return stringValue;
};

const normalizeProductRecord = (
  record: Record<string, unknown>,
  rowNumber: number,
): ProductInput & { id?: string } => {
  const getValue = (...keys: string[]) => {
    for (const key of keys) {
      const normalizedKey = normalizeHeader(key);
      if (normalizedKey in record) {
        return record[normalizedKey];
      }
    }
    return undefined;
  };

  const name = `${getValue('name') ?? ''}`.trim();
  const category = `${getValue('category') ?? ''}`.trim();
  const description = `${getValue('description') ?? ''}`.trim();
  const rawPrice = getValue('price');

  if (!name) {
    throw new Error(`Row ${rowNumber}: Missing product name.`);
  }
  if (!category) {
    throw new Error(`Row ${rowNumber}: Missing product category.`);
  }
  if (!description) {
    throw new Error(`Row ${rowNumber}: Missing product description.`);
  }
  if (`${rawPrice ?? ''}`.trim() === '') {
    throw new Error(`Row ${rowNumber}: Missing product price.`);
  }

  const images = splitImageValues(
    getValue('images', 'image_urls', 'imageurls', 'image_url', 'image'),
  );

  return {
    id: `${getValue('id', '_id') ?? ''}`.trim() || undefined,
    name,
    price: parseNumber(rawPrice),
    category,
    description,
    image: images[0] ?? '',
    images,
    stock: Math.max(0, parseNumber(getValue('stock'), 0)),
    requiresPrescription: parseBoolean(
      getValue('requiresPrescription', 'requires_prescription', 'rx_required'),
      false,
    ),
    manufacturer: `${getValue('manufacturer') ?? ''}`.trim(),
    dosage: `${getValue('dosage', 'subtitle') ?? ''}`.trim(),
    featured: parseBoolean(getValue('featured'), false),
  };
};

export const parseProductImportFile = async (file: File): Promise<(ProductInput & { id?: string })[]> => {
  const content = await file.text();

  if (file.name.toLowerCase().endsWith('.json')) {
    const parsed = JSON.parse(content) as unknown;
    const records = Array.isArray(parsed)
      ? parsed
      : parsed && typeof parsed === 'object' && Array.isArray((parsed as { products?: unknown[] }).products)
        ? (parsed as { products: unknown[] }).products
        : null;

    if (!records) {
      throw new Error('JSON import must be an array of products or an object with a products array.');
    }

    return records.map((record, index) =>
      normalizeProductRecord(record as Record<string, unknown>, index + 1),
    );
  }

  const rows = parseCsvRows(content);
  if (rows.length < 2) {
    throw new Error('CSV import requires a header row and at least one product row.');
  }

  const headers = rows[0].map(normalizeHeader);

  return rows.slice(1).map((row, index) => {
    const record = headers.reduce<Record<string, unknown>>((result, header, columnIndex) => {
      result[header] = row[columnIndex] ?? '';
      return result;
    }, {});

    return normalizeProductRecord(record, index + 2);
  });
};

export const buildProductsCsv = (products: Product[]) => {
  const rows = [
    CSV_HEADERS.join(','),
    ...products.map((product) =>
      [
        product.id,
        product.name,
        product.price,
        product.category,
        product.description,
        product.stock,
        product.requiresPrescription,
        product.manufacturer,
        product.dosage,
        Boolean(product.featured),
        getProductImages(product).join(' | '),
      ]
        .map(escapeCsvValue)
        .join(','),
    ),
  ];

  return rows.join('\r\n');
};
