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
  '416': 'Tallahassee'
};

// Work Item 125-Column Format (Phase 3 / Step 6 Output)
export const OUTPUT_COLUMNS: string[] = [
  'BRANCHNAME',           // From input OR VLOOKUP
  'BRANCHNUMB',           // Branch number
  'LEI',
  'ULI',
  'LASTNAME',
  'FIRSTNAME',
  'CLASTNAME',            // Co-applicant last name
  'CFIRSTNAME',           // Co-applicant first name
  'LENDER',
  'AA_LOANPROCESSOR',
  'LDP_POSTCLOSER',
  'ErrorMadeBy',          // NEW - blank column
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
  'COA_AGE',               // 9999 if no co-applicant
  'INCOME',
  'PURCHASER',
  'RATE_SPREAD',
  'HOEPA_STATUS',
  'LIEN_STATUS',
  'CREDITSCORE',
  'COA_CREDITSCORE',       // 9999 if no co-applicant
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
  'DSC',                   // NEW - blank column
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
  'VAR_TERM'
];

// Date columns that need Excel serial number conversion
const DATE_COLUMNS = ['APPLDATE', 'ACTIONDATE', 'RATE_LOCK_DATE'];

/**
 * Convert Excel serial date to M/D/YY format
 */
export const excelDateToString = (value: any): string => {
  // If already a string that looks like a date, return it
  if (typeof value === 'string' && value.includes('/')) {
    return value;
  }
  
  // If it's a number, convert from Excel serial
  const serial = Number(value);
  if (isNaN(serial) || serial < 1000 || serial > 100000) {
    return String(value || '');
  }
  
  // Excel serial date conversion
  // Excel's epoch is December 30, 1899
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
  // Priority 1: Keep existing name if present
  if (existingName && String(existingName).trim() !== '') {
    return String(existingName).trim();
  }
  // Priority 2: VLOOKUP from branch list
  const normalized = String(branchNumber).trim();
  return BRANCH_LIST[normalized] || '';
};

/**
 * Transform CRA Wiz 243-column export to Work Item 125-column format
 */
export const transformToWorkItemFormat = (data: any[]): any[] => {
  return data.map(row => {
    const output: Record<string, any> = {};
    
    OUTPUT_COLUMNS.forEach(col => {
      // Special handling for BRANCHNAME - preserve from input
      if (col === 'BRANCHNAME') {
        output[col] = getBranchName(
          row.BRANCHNUMB || row.Branch || row.BranchNumb || '',
          row.BRANCHNAME || row.BranchName || ''
        );
      }
      // New blank columns
      else if (col === 'ErrorMadeBy' || col === 'DSC') {
        output[col] = '';
      }
      // Date columns - convert from Excel serial
      else if (DATE_COLUMNS.includes(col)) {
        const rawValue = row[col] || row[col.toLowerCase()] || '';
        output[col] = excelDateToString(rawValue);
      }
      // Co-applicant age/credit score - use 9999 if no co-applicant
      else if (col === 'COA_AGE' || col === 'COA_CREDITSCORE') {
        const value = row[col] || row[col.toLowerCase()] || '';
        output[col] = value || '9999';
      }
      // Standard field lookup with case variations
      else {
        output[col] = row[col] || 
                      row[col.toLowerCase()] || 
                      row[col.replace(/_/g, '')] || 
                      '';
      }
    });
    
    return output;
  });
};

/**
 * Export Work Item file (Phase 3 / Step 6)
 */
export const exportWorkItemFile = (data: any[]): void => {
  // Transform to 125-column format
  const transformedData = transformToWorkItemFormat(data);
  
  // Create worksheet with exact headers
  const ws = utils.json_to_sheet(transformedData, {
    header: OUTPUT_COLUMNS
  });
  
  // Create workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'Work Items');
  
  // Generate filename with month/year
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const filename = `HMDA_WorkItem_${monthNames[now.getMonth()]}_${now.getFullYear()}.csv`;
  
  // Download
  writeFile(wb, filename, { bookType: 'csv' });
};

/**
 * Process CRA Wiz export file for Step 6 transformation
 */
export const processCRAWizExport = async (file: File): Promise<{
  inputColumns: number;
  outputColumns: number;
  rowCount: number;
  branchMatches: number;
  dateConversions: number;
  data: any[];
}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(worksheet);
        
        // Get input column count
        const inputColumns = Object.keys(jsonData[0] || {}).length;
        
        // Transform to work item format
        const transformed = transformToWorkItemFormat(jsonData);
        
        // Count branch matches
        const branchMatches = transformed.filter(row => 
          row.BRANCHNAME && row.BRANCHNAME.trim() !== ''
        ).length;
        
        // Count date conversions (approximate)
        const dateConversions = transformed.length * DATE_COLUMNS.length;
        
        resolve({
          inputColumns,
          outputColumns: OUTPUT_COLUMNS.length,
          rowCount: transformed.length,
          branchMatches,
          dateConversions,
          data: transformed
        });
      } catch (error) {
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};
