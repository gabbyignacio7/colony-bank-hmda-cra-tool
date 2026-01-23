// CRA Wiz Transform - Colony Bank HMDA/CRA Compliance Tool
// Post-CRA Wiz processing (Step 6) - Transform 243 columns to 125 columns

import { read, utils, writeFile } from 'xlsx';

// Embedded Branch List (48 branches) - Updated to match specification exactly
export const BRANCH_LIST: Record<string, string> = {
  '101': 'Columbus',
  '103': 'Leesburg',
  '104': 'Savannah Hwy 17',
  '107': 'Savannah Hodgson',
  '108': 'Centerville',
  '109': 'Warner Robins',
  '110': 'Valdosta',
  '114': 'Statesboro',
  '116': 'LaGrange',
  '125': 'Albany NW',
  '127': 'Thomaston',
  '129': 'Manchester',
  '131': 'Fayetteville',
  '134': 'Cedartown',
  '136': 'Rockmart',
  '137': 'Chickamauga',
  '201': 'Rochelle',
  '203': 'Cordele',
  '204': 'Ashburn',
  '205': 'Moultrie',
  '206': 'Tifton',
  '208': 'Sylvester',
  '209': 'Fitzgerald',
  '210': 'Douglas',
  '212': 'Broxton',
  '213': 'Quitman',
  '216': 'Eastman',
  '218': 'Macon',
  '219': 'Northwest GA LPO',
  '220': 'Pooler LPO',
  '221': 'Birmingham LPO',
  '223': 'Augusta LPO',
  '226': 'Tallahassee LPO',
  '401': 'Savannah',
  '402': 'Valdosta Mortgage',
  '403': 'Macon',
  '404': 'Athens',
  '405': 'Lagrange',
  '406': 'Warner Robins',
  '407': 'Albany',
  '408': 'Columbus',
  '409': 'Statesboro',
  '410': 'Augusta',
  '412': 'Pooler',
  '413': 'Birmingham',
  '414': 'Milledgeville',
  '415': 'Atlanta',
  '416': 'Tallahassee',
};

// Loan Officer to Branch Mapping - Maps loan officer names to branch numbers
// This is used to derive branch when no branch column exists in source data
export const LOAN_OFFICER_BRANCH_MAP: Record<string, string> = {
  // Valdosta Mortgage (402)
  'Dana Williams': '402',
  'Sara Ellen Whiddon': '402',

  // Columbus (408)
  'Barry Raymond Butcher': '408',
  'Barry  Raymond Butcher': '408', // Handle extra space variant

  // Athens (404)
  'Billy Leopold': '404',
  'Alan Coleman': '404',

  // LaGrange (405)
  'Susan Blanche Whatley': '405',
  'Alex Paul Whatley': '405',

  // Tallahassee (416)
  'Tiffany H Mazo': '416',

  // Savannah (401)
  'Lucia Smith Barnes': '401',
  'Amber Davies': '401',

  // Macon (403)
  'Patrick Williams': '403',
  'Kelly Kremer': '403',

  // Warner Robins (406)
  'Kyle Harrison': '406',
  'Landon Lanier': '406',

  // Albany (407)
  'Jeffery Conzett': '407',
  'Bob Goodman': '407',

  // Augusta (410)
  'Jennifer Gross': '410',
  'Davis Clark': '410',

  // Statesboro (409)
  'Tim S. Hazelman': '409',
  'Tim S Hazelman': '409', // Handle variant without period
  'Lisa T. Brantley': '409',
  'Lisa T Brantley': '409', // Handle variant without period

  // Pooler (412)
  'Adrienne Granger': '412',

  // Milledgeville (414)
  'Kristen Laine Phillips': '414',
  'Lisa Canup': '414',
};

/**
 * Get branch number from loan officer name
 */
export const getBranchFromLoanOfficer = (loanOfficer: string): string => {
  if (!loanOfficer) return '';

  // Direct lookup
  const branch = LOAN_OFFICER_BRANCH_MAP[loanOfficer];
  if (branch) return branch;

  // Try normalized lookup (trim spaces, lowercase compare)
  const normalized = loanOfficer.trim();
  for (const [name, branchNum] of Object.entries(LOAN_OFFICER_BRANCH_MAP)) {
    if (name.toLowerCase().trim() === normalized.toLowerCase()) {
      return branchNum;
    }
  }

  return '';
};

// Work Item 125-Column Format (Phase 3 / Step 6 Output)
export const OUTPUT_COLUMNS: string[] = [
  'BRANCHNAME', // From input OR VLOOKUP
  'BRANCHNUMB', // Branch number
  'LEI',
  'ULI',
  'LASTNAME',
  'FIRSTNAME',
  'CLASTNAME', // Co-applicant last name
  'CFIRSTNAME', // Co-applicant first name
  'LENDER',
  'AA_LOANPROCESSOR',
  'LDP_POSTCLOSER',
  'ErrorMadeBy', // NEW - blank column
  'APPLDATE',
  'LOANTYPE',
  'PURPOSE',
  'CONSTRUCTIONMETHOD',
  'OCCUPANCYTYPE',
  'LOANAMOUNTINDOLLARS',
  'PREAPPROVAL',
  'ACTION',
  'ACTIONDATE',
  'ADDRESS',
  'CITY',
  'STATE_ABRV',
  'ZIP',
  'COUNTY_5',
  'TRACT_11',
  'ETHNICITY_1',
  'ETHNICITY_2',
  'ETHNICITY_3',
  'ETHNICITY_4',
  'ETHNICITY_5',
  'ETHNICITYOTHER',
  'COA_ETHNICITY_1',
  'COA_ETHNICITY_2',
  'COA_ETHNICITY_3',
  'COA_ETHNICITY_4',
  'COA_ETHNICITY_5',
  'COA_ETHNICITYOTHER',
  'ETHNICITY_DETERMINANT',
  'COA_ETHNICITY_DETERMINANT',
  'RACE_1',
  'RACE_2',
  'RACE_3',
  'RACE_4',
  'RACE_5',
  'RACE1_OTHER',
  'RACE27_OTHER',
  'RACE44_OTHER',
  'COARACE_1',
  'COARACE_2',
  'COARACE_3',
  'COARACE_4',
  'COARACE_5',
  'COARACE1_OTHER',
  'COARACE27_OTHER',
  'COARACE44_OTHER',
  'RACE_DETERMINANT',
  'COARACE_DETERMINANT',
  'SEX',
  'COASEX',
  'SEX_DETERMINANT',
  'COASEX_DETERMINANT',
  'AGE',
  'COA_AGE', // 9999 if no co-applicant
  'INCOME',
  'PURCHASER',
  'RATE_SPREAD',
  'HOEPA_STATUS',
  'LIEN_STATUS',
  'CREDITSCORE',
  'COA_CREDITSCORE', // 9999 if no co-applicant
  'CREDITMODEL',
  'CREDITMODELOTHER',
  'COA_CREDITMODEL',
  'COA_CREDITMODELOTHER',
  'DENIAL1',
  'DENIAL2',
  'DENIAL3',
  'DENIAL4',
  'DENIALOTHER',
  'TOTALLOANCOSTS',
  'TOTALPTSANDFEES',
  'ORIGFEES',
  'DISCOUNTPTS',
  'LENDERCREDTS',
  'INTERESTRATE',
  'APR',
  'RATE_LOCK_DATE',
  'PPPTERM',
  'DTIRATIO',
  'DSC', // NEW - blank column
  'CLTV',
  'LOAN_TERM',
  'LOAN_TERM_MONTHS',
  'INTRORATEPERIOD',
  'BALLOONPMT',
  'IOPMT',
  'NEGAM',
  'NONAMORTZ',
  'PROPERTYVALUE',
  'MHSECPROPTYPE',
  'MHLANDPROPINT',
  'TOTALUNITS',
  'MFAHU',
  'APPMETHOD',
  'PAYABLEINST',
  'NMLSRID',
  'AUSYSTEM1',
  'AUSYSTEM2',
  'AUSYSTEM3',
  'AUSYSTEM4',
  'AUSYSTEM5',
  'AUSYSTEMOTHER',
  'AUSRESULT1',
  'AUSRESULT2',
  'AUSRESULT3',
  'AUSRESULT4',
  'AUSRESULT5',
  'AUSRESULTOTHER',
  'REVMTG',
  'OPENLOC',
  'BUSCML',
  'RATETYPE',
  'VAR_TERM',
];

export interface CRAWizRow {
  [key: string]: any;
}

// Date columns that need Excel serial number conversion
const DATE_COLUMNS = ['APPLDATE', 'ACTIONDATE', 'RATE_LOCK_DATE'];

/**
 * Convert Excel serial date to M/D/YY format
 */
export const excelDateToString = (value: any): string => {
  if (typeof value === 'string' && value.includes('/')) {
    return value;
  }

  const serial = Number(value);
  if (isNaN(serial) || serial < 1000 || serial > 100000) {
    return String(value || '');
  }

  const date = new Date((serial - 25569) * 86400 * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(-2);

  return `${month}/${day}/${year}`;
};

/**
 * Get branch name with priority: preserve existing, then VLOOKUP
 */
export const getBranchName = (branchNumber: string | number, existingName?: string): string => {
  if (existingName && String(existingName).trim() !== '') {
    return String(existingName).trim();
  }
  const normalized = String(branchNumber).trim();
  return BRANCH_LIST[normalized] || '';
};

export interface TransformResult {
  data: CRAWizRow[];
  inputColumns: number;
  outputColumns: number;
  rowCount: number;
  branchMatchCount: number;
  branchMissCount: number;
}

export const parseCRAWizFile = async (file: File): Promise<CRAWizRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(sheet) as CRAWizRow[];
        console.log(
          `Parsed CRA Wiz file: ${jsonData.length} rows, ${Object.keys(jsonData[0] || {}).length} columns`
        );
        resolve(jsonData);
      } catch (error) {
        console.error('Error parsing CRA Wiz file:', error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Transform CRA Wiz 243-column export to Work Item 125-column format
 */
export const transformToWorkItemFormat = (data: any[]): any[] => {
  return data.map(row => {
    const output: Record<string, any> = {};

    OUTPUT_COLUMNS.forEach(col => {
      if (col === 'BRANCHNAME') {
        output[col] = getBranchName(
          row.BRANCHNUMB || row.Branch || row.BranchNumb || '',
          row.BRANCHNAME || row.BranchName || ''
        );
      } else if (col === 'ErrorMadeBy' || col === 'DSC') {
        output[col] = '';
      } else if (DATE_COLUMNS.includes(col)) {
        const rawValue = row[col] || row[col.toLowerCase()] || '';
        output[col] = excelDateToString(rawValue);
      } else if (col === 'COA_AGE' || col === 'COA_CREDITSCORE') {
        // Use ?? to preserve valid zero values, only default to 9999 if truly missing
        const value = row[col] ?? row[col.toLowerCase()] ?? '';
        output[col] = value !== '' && value !== null && value !== undefined ? value : '9999';
      } else {
        // IMPORTANT: Use ?? to preserve zeros (0, "0") - || would drop them
        const val = row[col] ?? row[col.toLowerCase()] ?? row[col.replace(/_/g, '')];
        output[col] = val !== undefined && val !== null ? val : '';
      }
    });

    return output;
  });
};

export const transformCRAWizExport = (
  inputData: CRAWizRow[],
  customBranchList?: Record<string, string>
): TransformResult => {
  const branchLookup = customBranchList || BRANCH_LIST;
  let branchMatchCount = 0;
  let branchMissCount = 0;

  const transformedData = inputData.map(row => {
    const inputBranchName = row.BRANCHNAME ? String(row.BRANCHNAME).trim() : '';
    const branchNum = String(row.BRANCHNUMB || '').trim();
    const lookupBranchName = branchLookup[branchNum] || '';

    const branchName = inputBranchName || lookupBranchName;

    if (branchName) {
      branchMatchCount++;
    } else {
      branchMissCount++;
    }

    const outputRow: CRAWizRow = {};

    OUTPUT_COLUMNS.forEach(col => {
      if (col === 'BRANCHNAME') {
        outputRow[col] = branchName;
      } else if (col === 'ErrorMadeBy' || col === 'DSC') {
        outputRow[col] = '';
      } else if (DATE_COLUMNS.includes(col)) {
        outputRow[col] = excelDateToString(row[col]);
      } else if (col === 'COA_AGE' || col === 'COA_CREDITSCORE') {
        // Use ?? to preserve valid zero values, only default to 9999 if truly missing
        const value = row[col] ?? '';
        outputRow[col] = value !== '' && value !== null && value !== undefined ? value : '9999';
      } else {
        outputRow[col] = row[col] !== undefined ? row[col] : '';
      }
    });

    return outputRow;
  });

  return {
    data: transformedData,
    inputColumns: Object.keys(inputData[0] || {}).length,
    outputColumns: OUTPUT_COLUMNS.length,
    rowCount: transformedData.length,
    branchMatchCount,
    branchMissCount,
  };
};

/**
 * Export Work Item file (Phase 3 / Step 6)
 */
export const exportWorkItemFile = (data: CRAWizRow[], filename?: string) => {
  const transformedData = transformToWorkItemFormat(data);

  const ws = utils.json_to_sheet(transformedData, {
    header: OUTPUT_COLUMNS,
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Work Items');

  const now = new Date();
  const monthNames = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  const defaultFilename = `HMDA_WorkItem_${monthNames[now.getMonth()]}_${now.getFullYear()}.csv`;

  writeFile(wb, filename || defaultFilename, { bookType: 'csv' });
};

export const exportTransformSummary = (result: TransformResult) => {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const filename = `HMDA_Transform_Summary_${monthYear.replace(' ', '_')}.xlsx`;

  const summaryData = [
    {
      'Transformation Date': new Date().toLocaleString(),
      'Input Columns': result.inputColumns,
      'Output Columns': result.outputColumns,
      'Total Rows': result.rowCount,
      'Branch Matches': result.branchMatchCount,
      'Branch Misses': result.branchMissCount,
      'New Columns Added': 'ErrorMadeBy, DSC',
      'Columns Removed': result.inputColumns - result.outputColumns + 2,
    },
  ];

  const ws = utils.json_to_sheet(summaryData);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Summary');

  const branchData = Object.entries(BRANCH_LIST).map(([num, name]) => ({
    'Branch Number': num,
    'Branch Name': name,
  }));
  const branchWs = utils.json_to_sheet(branchData);
  utils.book_append_sheet(wb, branchWs, 'Branch Reference');

  writeFile(wb, filename);
};

/**
 * Process CRA Wiz export file for Step 6 transformation
 */
export const processCRAWizExport = async (
  file: File
): Promise<{
  inputColumns: number;
  outputColumns: number;
  rowCount: number;
  branchMatches: number;
  dateConversions: number;
  data: any[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = e => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet) as CRAWizRow[];

        const result = transformCRAWizExport(jsonData);

        resolve({
          inputColumns: result.inputColumns,
          outputColumns: result.outputColumns,
          rowCount: result.rowCount,
          branchMatches: result.branchMatchCount,
          dateConversions: result.rowCount * DATE_COLUMNS.length,
          data: result.data,
        });
      } catch (error) {
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
