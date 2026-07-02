import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import { Account, Category, Transaction } from '@/types';
import * as transactionRepo from '@/db/transactionRepo';
import { createTransaction } from './transactionService';
import { generateId } from '@/utils/id';

const HEADER = ['id', 'type', 'amount', 'category', 'account', 'to_account', 'note', 'date'];

function escapeCsv(value: string): string {
  if (/[",\n]/.test(value)) return `"${value.replace(/"/g, '""')}"`;
  return value;
}

export async function exportTransactionsCsv(
  accounts: Account[],
  categories: Category[],
): Promise<void> {
  const transactions = await transactionRepo.getAllTransactionsForExport();
  const accountName = (id?: string) => accounts.find((a) => a.id === id)?.name ?? '';
  const categoryName = (id?: string) => categories.find((c) => c.id === id)?.name ?? '';

  const lines = [HEADER.join(',')];
  for (const t of transactions) {
    lines.push(
      [
        t.id,
        t.type,
        String(t.amount),
        escapeCsv(categoryName(t.categoryId)),
        escapeCsv(accountName(t.accountId)),
        escapeCsv(accountName(t.toAccountId)),
        escapeCsv(t.note),
        t.date,
      ].join(','),
    );
  }
  const csv = '﻿' + lines.join('\n'); // BOM so Excel reads Thai correctly

  const fileUri = `${FileSystem.cacheDirectory}transactions-${Date.now()}.csv`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: 'text/csv', dialogTitle: 'ส่งออกรายการ' });
  }
}

function parseCsvLine(line: string): string[] {
  const fields: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"') {
        if (line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ',') {
      fields.push(current);
      current = '';
    } else {
      current += ch;
    }
  }
  fields.push(current);
  return fields;
}

export interface ImportResult {
  imported: number;
  skipped: number;
}

/**
 * Import transactions from a CSV in the export format. Categories/accounts are
 * matched by name; rows that don't match an existing account are skipped.
 */
export async function importTransactionsCsv(
  accounts: Account[],
  categories: Category[],
): Promise<ImportResult | null> {
  const result = await DocumentPicker.getDocumentAsync({
    type: ['text/csv', 'text/comma-separated-values', 'text/plain'],
    copyToCacheDirectory: true,
  });
  if (result.canceled || !result.assets?.length) return null;

  let content = await FileSystem.readAsStringAsync(result.assets[0].uri, {
    encoding: FileSystem.EncodingType.UTF8,
  });
  if (content.charCodeAt(0) === 0xfeff) content = content.slice(1);

  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length < 2) return { imported: 0, skipped: 0 };

  let imported = 0;
  let skipped = 0;
  for (const line of lines.slice(1)) {
    const fields = parseCsvLine(line);
    if (fields.length < 8) {
      skipped++;
      continue;
    }
    const [, type, amountStr, categoryName, accountName, toAccountName, note, date] = fields;
    const amount = parseFloat(amountStr);
    if (!['income', 'expense', 'transfer'].includes(type) || !isFinite(amount) || amount <= 0) {
      skipped++;
      continue;
    }
    const account = accounts.find((a) => a.name === accountName);
    if (!account || !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      skipped++;
      continue;
    }
    const toAccount = accounts.find((a) => a.name === toAccountName);
    if (type === 'transfer' && !toAccount) {
      skipped++;
      continue;
    }
    const category = categories.find(
      (c) => c.name === categoryName && (type === 'transfer' || c.type === type),
    );
    const t: Transaction = {
      id: generateId(),
      type: type as Transaction['type'],
      amount,
      categoryId: category?.id ?? '',
      accountId: account.id,
      toAccountId: toAccount?.id,
      note,
      date,
      isRecurring: false,
      createdAt: new Date().toISOString(),
    };
    await createTransaction(t);
    imported++;
  }
  return { imported, skipped };
}
