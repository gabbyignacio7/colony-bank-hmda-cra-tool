import { read, utils, writeFile } from 'xlsx';

// Embedded Branch List (48 branches)
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
  '207': 'Sylvester',
  '208': 'Fitzgerald',
  '209': 'Douglas',
  '210': 'Baxley',
  '211': 'Waycross',
  '212': 'Alma',
  '213': 'Albany Westover',
  '301': 'Quitman',
  '302': 'Thomasville',
  '303': 'Cairo',
  '304': 'Camilla',
  '305': 'Blakely',
  '306': 'Donalsonville',
  '307': 'Bainbridge',
  '308': 'Albany Dawson',
  '401': 'Dothan',
  '402': 'Valdosta Mortgage',
  '403': 'Gulf Shores',
  '404': 'Tallahassee Mortgage',
  '406': 'Albany Mortgage',
  '407': 'Tifton Mortgage',
  '408': 'Valdosta Mall',
  '410': 'Homerville',
  '411': 'Panama City',
  '414': 'Perry',
  '415': 'Tallahassee Mahan',
  '416': 'Tallahassee'
};

// Exact 125-column output order
export const OUTPUT_COLUMNS = [
  'BRANCHNAME',
  'BRANCHNUMB',
  'LEI',
  'ULI',
  'LASTNAME',
  'FIRSTNAME',
  'CLASTNAME',
  'CFIRSTNAME',
  'LENDER',
  'AA_LOANPROCESSOR',
  'LDP_POSTCLOSER',
  'ErrorMadeBy',
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
  'COA_AGE',
  'INCOME',
  'PURCHASER',
  'RATE_SPREAD',
  'HOEPA_STATUS',
  'LIEN_STATUS',
  'CREDITSCORE',
  'COA_CREDITSCORE',
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
  'DSC',
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

export interface CRAWizRow {
  [key: string]: any;
}

// Date columns that need Excel serial number to M/D/YY conversion
const DATE_COLUMNS = ['APPLDATE', 'ACTIONDATE', 'RATE_LOCK_DATE'];

// Convert Excel serial number to M/D/YY format
const excelDateToString = (serial: any): string => {
  if (!serial || isNaN(serial)) return serial;
  const numSerial = Number(serial);
  if (numSerial < 1000) return serial; // Not a valid Excel date serial
  const date = new Date((numSerial - 25569) * 86400 * 1000);
  return `${date.getMonth() + 1}/${date.getDate()}/${String(date.getFullYear()).slice(-2)}`;
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
    
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(sheet) as CRAWizRow[];
        console.log(`Parsed CRA Wiz file: ${jsonData.length} rows, ${Object.keys(jsonData[0] || {}).length} columns`);
        resolve(jsonData);
      } catch (error) {
        console.error("Error parsing CRA Wiz file:", error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
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
    // Use BRANCHNAME from input file first, only fallback to VLOOKUP if blank
    const inputBranchName = row.BRANCHNAME ? String(row.BRANCHNAME).trim() : '';
    const branchNum = String(row.BRANCHNUMB || '').trim();
    const lookupBranchName = branchLookup[branchNum] || '';
    
    // Preserve original BRANCHNAME, use lookup only as fallback
    const branchName = inputBranchName || lookupBranchName;
    
    if (branchName) {
      branchMatchCount++;
    } else {
      branchMissCount++;
    }
    
    // Build output row with exact 125-column order
    const outputRow: CRAWizRow = {};
    
    OUTPUT_COLUMNS.forEach(col => {
      if (col === 'BRANCHNAME') {
        outputRow[col] = branchName;
      } else if (col === 'ErrorMadeBy' || col === 'DSC') {
        outputRow[col] = '';
      } else if (DATE_COLUMNS.includes(col)) {
        // Convert Excel serial dates to M/D/YY format
        outputRow[col] = excelDateToString(row[col]);
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
    branchMissCount
  };
};

export const exportWorkItemFile = (data: CRAWizRow[], filename?: string) => {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const defaultFilename = `HMDA_WorkItem_${monthYear.replace(' ', '_')}.csv`;
  
  const ws = utils.json_to_sheet(data, { header: OUTPUT_COLUMNS });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Work Items");
  
  writeFile(wb, filename || defaultFilename);
};

export const exportTransformSummary = (result: TransformResult) => {
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const filename = `HMDA_Transform_Summary_${monthYear.replace(' ', '_')}.xlsx`;
  
  const summaryData = [{
    'Transformation Date': new Date().toLocaleString(),
    'Input Columns': result.inputColumns,
    'Output Columns': result.outputColumns,
    'Total Rows': result.rowCount,
    'Branch Matches': result.branchMatchCount,
    'Branch Misses': result.branchMissCount,
    'New Columns Added': 'ErrorMadeBy, DSC',
    'Columns Removed': result.inputColumns - result.outputColumns + 2
  }];
  
  const ws = utils.json_to_sheet(summaryData);
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "Summary");
  
  // Add branch reference sheet
  const branchData = Object.entries(BRANCH_LIST).map(([num, name]) => ({
    'Branch Number': num,
    'Branch Name': name
  }));
  const branchWs = utils.json_to_sheet(branchData);
  utils.book_append_sheet(wb, branchWs, "Branch Reference");
  
  writeFile(wb, filename);
};
