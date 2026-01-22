/**
 * ETL Engine - Re-exports from modular ETL components
 * 
 * This file maintains backward compatibility with existing imports.
 * New code should import directly from '@/lib/etl' instead.
 * 
 * @deprecated Import from '@/lib/etl' instead
 */

import { read, utils, writeFile } from 'xlsx';

// Re-export all types
export type {
  SbslRow,
  ValidationResult,
  ColumnStats,
  RowComparison,
  ComparisonResult,
  DeduplicationResult,
  FilterResult,
  SummaryStats,
} from './etl/types';

// Re-export field maps
export {
  CRA_WIZ_128_COLUMNS,
  ENCOMPASS_FIELD_MAP,
  COMPLIANCE_REPORTER_FIELD_MAP,
  FIELD_VARIATIONS,
  normalizeFieldName,
} from './etl/field-maps';

// Re-export utilities
export {
  excelDateToString,
  findFieldValue,
  parseBorrowerName,
  mapAUSResult,
  mapAUSystem,
  mapNonAmortz,
  convertLoanTermToYears,
  getLoanTermMonths,
  formatCensusTract,
  deriveRateType,
  deriveVarTerm,
  detectDelimiter,
  filterByCurrentMonth,
  generateSummaryStats,
} from './etl/utils';

// Re-export parsers
export {
  parseEncompassFile,
  parseLaserProFile,
  detectFileType,
} from './etl/parsers';

// Re-export transform
export {
  transformToCRAWizFormat,
  validateData,
  autoCorrectData,
  transformEncompassData,
  cleanAndFormatData,
} from './etl/transform';

// Re-export merge
export {
  deduplicateData,
  mergeSupplementalData,
} from './etl/merge';

// Import types for use in functions below
import type { SbslRow, ComparisonResult, RowComparison, ColumnStats } from './etl/types';
import { CRA_WIZ_128_COLUMNS } from './etl/field-maps';
import { excelDateToString, findFieldValue } from './etl/utils';
import { parseEncompassFile, parseLaserProFile } from './etl/parsers';
import { transformToCRAWizFormat, autoCorrectData } from './etl/transform';
import { deduplicateData, mergeSupplementalData } from './etl/merge';
import { logInfo, logWarning, logError, trackETLStep } from './error-tracker';

/**
 * Export to CRA Wiz Excel format
 */
export const exportCRAWizFormat = (data: SbslRow[], filename?: string): void => {
  const ws = utils.json_to_sheet(data, { header: CRA_WIZ_128_COLUMNS });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'CRA_Wiz_Data');

  // Auto-size columns
  const colWidths = CRA_WIZ_128_COLUMNS.map((col) => ({
    wch: Math.max(col.length, 12),
  }));
  ws['!cols'] = colWidths;

  const outputFilename = filename || `CRA_Wiz_Upload_${new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' }).replace(' ', '_')}.xlsx`;
  writeFile(wb, outputFilename);
};

/**
 * Process uploaded file (main entry point)
 */
export const processFile = async (file: File): Promise<SbslRow[]> => {
  const startTime = Date.now();
  logInfo('ETL:ProcessFile', `Starting file processing: ${file.name}`, { 
    fileName: file.name, 
    fileSize: file.size, 
    fileType: file.type 
  });
  
  console.log('=== PROCESSING FILE ===');
  console.log('File name:', file.name);
  console.log('File type:', file.type);
  console.log('File size:', file.size);

  const name = file.name.toLowerCase();

  // Handle text/CSV files (LaserPro/Compliance Reporter format)
  if (name.endsWith('.txt') || name.endsWith('.csv')) {
    console.log('Detected LaserPro/Compliance Reporter text file');
    logInfo('ETL:ProcessFile', 'Detected LaserPro text file format');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        console.log('File content length:', content?.length);
        console.log('First 200 chars:', content?.substring(0, 200));

        const laserProData = parseLaserProFile(content);
        console.log('Parsed LaserPro records:', laserProData.length);
        
        const duration = Date.now() - startTime;
        trackETLStep('ProcessFile', 1, laserProData.length, duration, [], [], {
          fileType: 'LaserPro/text',
          fileName: file.name
        });
        
        resolve(laserProData);
      };
      reader.onerror = (e) => {
        logError('ETL:ProcessFile', 'File read error', { error: e });
        reject(e);
      };
      reader.readAsText(file);
    });
  }

  // Handle Excel files
  if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
    console.log('Detected Excel file');
    logInfo('ETL:ProcessFile', 'Detected Excel file format');
    
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          console.log('Sheet names:', workbook.SheetNames);
          console.log('Using sheet:', sheetName);

          const worksheet = workbook.Sheets[sheetName];
          const jsonData: any[][] = utils.sheet_to_json(worksheet, {
            header: 1,
            raw: false,
            defval: '',
          });
          console.log('Raw Excel rows:', jsonData.length);
          
          // Detect file type from first row content
          const firstRowStr = jsonData[0]?.join(' ') || '';
          const isHMDAFormat = firstRowStr.includes('Legal Entity') || 
                              firstRowStr.includes('Universal Loan') ||
                              firstRowStr.includes('LEI') ||
                              (firstRowStr.includes('APR') && !firstRowStr.includes('Legal Entity'));
          
          console.log('Detected HMDA format:', isHMDAFormat);
          console.log('First row preview:', firstRowStr.substring(0, 200));
          
          const parsedData = parseEncompassFile(jsonData);
          console.log('Parsed records:', parsedData.length);
          
          const duration = Date.now() - startTime;
          trackETLStep('ProcessFile', jsonData.length, parsedData.length, duration, [], [], {
            fileType: isHMDAFormat ? 'Encompass/HMDA' : 'Supplemental',
            fileName: file.name
          });
          
          resolve(parsedData);
        } catch (err) {
          logError('ETL:ProcessFile', 'Excel parsing error', { error: err });
          console.error('Error parsing Excel:', err);
          reject(err);
        }
      };
      reader.onerror = (e) => {
        logError('ETL:ProcessFile', 'File read error', { error: e });
        reject(e);
      };
      reader.readAsArrayBuffer(file);
    });
  }

  logWarning('ETL:ProcessFile', `Unknown file type: ${file.name}`);
  console.log('Unknown file type:', file.name);
  return [];
};

/**
 * Compare two output files and generate a detailed comparison report
 */
export const compareOutputs = (
  oldData: SbslRow[],
  newData: SbslRow[],
  columnsToCompare?: string[]
): ComparisonResult => {
  const columns = columnsToCompare || CRA_WIZ_128_COLUMNS;
  
  const columnChanges: Record<string, {
    blanksOld: number;
    blanksNew: number;
    uniqueValuesOld: number;
    uniqueValuesNew: number;
    changedRows: number;
  }> = {};
  
  const rowChanges: RowComparison[] = [];
  
  // Index by ULI for row-by-row comparison
  const oldByULI = new Map<string, SbslRow>();
  const newByULI = new Map<string, SbslRow>();
  
  oldData.forEach(row => {
    const uli = String(row.ULI || row['Universal Loan Identifier'] || '').trim();
    if (uli) oldByULI.set(uli, row);
  });
  
  newData.forEach(row => {
    const uli = String(row.ULI || row['Universal Loan Identifier'] || '').trim();
    if (uli) newByULI.set(uli, row);
  });
  
  // Analyze each column
  columns.forEach(col => {
    const oldStats: ColumnStats = { blank: 0, nonBlank: 0, uniqueValues: new Set() };
    const newStats: ColumnStats = { blank: 0, nonBlank: 0, uniqueValues: new Set() };
    let changedRows = 0;
    
    oldData.forEach(row => {
      const val = String(row[col] ?? '').trim();
      if (val === '' || val === 'undefined' || val === 'null') {
        oldStats.blank++;
      } else {
        oldStats.nonBlank++;
        oldStats.uniqueValues.add(val);
      }
    });
    
    newData.forEach((row, idx) => {
      const val = String(row[col] ?? '').trim();
      if (val === '' || val === 'undefined' || val === 'null') {
        newStats.blank++;
      } else {
        newStats.nonBlank++;
        newStats.uniqueValues.add(val);
      }
      
      // Check for row-level changes
      const uli = String(row.ULI || row['Universal Loan Identifier'] || '').trim();
      if (uli && oldByULI.has(uli)) {
        const oldRow = oldByULI.get(uli)!;
        const oldVal = String(oldRow[col] ?? '').trim();
        const newVal = val;
        
        if (oldVal !== newVal) {
          changedRows++;
          if (rowChanges.length < 100) { // Limit sample size
            rowChanges.push({
              rowIndex: idx,
              uli,
              column: col,
              oldValue: oldVal || '(blank)',
              newValue: newVal || '(blank)',
              changeType: 'changed'
            });
          }
        }
      }
    });
    
    columnChanges[col] = {
      blanksOld: oldStats.blank,
      blanksNew: newStats.blank,
      uniqueValuesOld: oldStats.uniqueValues.size,
      uniqueValuesNew: newStats.uniqueValues.size,
      changedRows
    };
  });
  
  // Generate summary
  const significantChanges = Object.entries(columnChanges)
    .filter(([_, stats]) => stats.changedRows > 0 || stats.blanksOld !== stats.blanksNew)
    .map(([col, stats]) => `${col}: ${stats.changedRows} changed, blanks ${stats.blanksOld}→${stats.blanksNew}`)
    .join('\n');
  
  return {
    totalRowsOld: oldData.length,
    totalRowsNew: newData.length,
    columnsCompared: columns,
    columnChanges,
    rowChanges,
    summary: significantChanges || 'No significant changes detected'
  };
};

/**
 * Export comparison report to Excel
 */
export const exportComparisonReport = (
  comparison: ComparisonResult,
  filename?: string
): void => {
  const wb = utils.book_new();
  
  // Summary sheet
  const summaryData = [
    ['Comparison Summary'],
    ['Old File Rows', comparison.totalRowsOld],
    ['New File Rows', comparison.totalRowsNew],
    ['Columns Compared', comparison.columnsCompared.length],
    [],
    ['Column', 'Old Blanks', 'New Blanks', 'Old Unique', 'New Unique', 'Changed Rows']
  ];
  
  Object.entries(comparison.columnChanges)
    .filter(([_, stats]) => stats.changedRows > 0 || stats.blanksOld !== stats.blanksNew)
    .forEach(([col, stats]) => {
      summaryData.push([
        col,
        stats.blanksOld,
        stats.blanksNew,
        stats.uniqueValuesOld,
        stats.uniqueValuesNew,
        stats.changedRows
      ]);
    });
  
  const summarySheet = utils.aoa_to_sheet(summaryData);
  utils.book_append_sheet(wb, summarySheet, 'Summary');
  
  // Row changes sheet
  if (comparison.rowChanges.length > 0) {
    const changesData = [
      ['Row Index', 'ULI', 'Column', 'Old Value', 'New Value', 'Change Type'],
      ...comparison.rowChanges.map(c => [
        c.rowIndex, c.uli, c.column, c.oldValue, c.newValue, c.changeType
      ])
    ];
    const changesSheet = utils.aoa_to_sheet(changesData);
    utils.book_append_sheet(wb, changesSheet, 'Row Changes');
  }
  
  const outputFilename = filename || `Comparison_Report_${new Date().toISOString().split('T')[0]}.xlsx`;
  writeFile(wb, outputFilename);
};

/**
 * Mock data for testing
 */
export const MOCK_SBSL_DATA: SbslRow[] = [
  {
    Branch_Name: "Colony Bank - Fitzgerald",
    Branch: "001",
    LEI: "549300SAMPLE0001LEI001",
    ULI: "549300SAMPLE0001LEI001202410000001",
    LastName: "Smith",
    FirstName: "John",
    LoanType: "1",
    Purpose: "1",
    Action: "1",
    LoanAmountInDollars: "250000",
    Address: "123 Main Street",
    City: "Fitzgerald",
    State_abrv: "GA",
    Zip: "31750",
    County_5: "13109",
    Tract_11: "13109010100",
    Income: "75",
    CreditScore: "720",
    APR: "8.588"
  }
];
