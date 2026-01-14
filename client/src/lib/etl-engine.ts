import { read, utils, writeFile } from 'xlsx';
import { BRANCH_LIST, getBranchFromLoanOfficer, getBranchName } from './cra-wiz-transform';
import { ErrorTracker, logError, logWarning, logInfo, logDebug, trackETLStep } from './error-tracker';

export interface SbslRow {
  [key: string]: any;
}

export interface ValidationResult {
  rowIdx: number;
  applNumb: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoCorrected: Record<string, { from: any; to: any }>;
}

// Complete 126-Column CRA Wiz Format - Matches HMDA Template Updated.xlsx exactly
export const CRA_WIZ_128_COLUMNS: string[] = [
  'Branch_Name',           // Col 0 - Note: underscore format to match template
  'Branch',                // Col 1
  'LEI',                   // Col 2
  'ULI',                   // Col 3
  'LastName',              // Col 4
  'FirstName',             // Col 5
  'Coa_LastName',          // Col 6
  'Coa_FirstName',         // Col 7
  'Lender',                // Col 8
  'AA_Processor',          // Col 9
  'LDP_PostCloser',        // Col 10
  'ErrorMadeBy',           // Col 11 - Note: no underscore to match template
  'ApplDate',              // Col 12
  'LoanType',              // Col 13
  'Purpose',               // Col 14
  'ConstructionMethod',    // Col 15
  'OccupancyType',         // Col 16
  'LoanAmountInDollars',   // Col 17 - Note: full name to match template
  'Preapproval',           // Col 18
  'Action',                // Col 19
  'ActionDate',            // Col 20
  'Address',               // Col 21
  'City',                  // Col 22
  'State_abrv',            // Col 23
  'Zip',                   // Col 24
  'County_5',              // Col 25
  'Tract_11',              // Col 26
  'Ethnicity_1',           // Col 27
  'Ethnicity_2',           // Col 28
  'Ethnicity_3',           // Col 29
  'Ethnicity_4',           // Col 30
  'Ethnicity_5',           // Col 31
  'EthnicityOther',        // Col 32
  'Coa_Ethnicity_1',       // Col 33
  'Coa_Ethnicity_2',       // Col 34
  'Coa_Ethnicity_3',       // Col 35
  'Coa_Ethnicity_4',       // Col 36
  'Coa_Ethnicity_5',       // Col 37
  'Coa_EthnicityOther',    // Col 38
  'Ethnicity_Determinant', // Col 39
  'Coa_Ethnicity_Determinant', // Col 40
  'Race_1',                // Col 41
  'Race_2',                // Col 42
  'Race_3',                // Col 43
  'Race_4',                // Col 44
  'Race_5',                // Col 45
  'Race1_Other',           // Col 46
  'Race27_Other',          // Col 47
  'Race44_Other',          // Col 48
  'CoaRace_1',             // Col 49
  'CoaRace_2',             // Col 50
  'CoaRace_3',             // Col 51
  'CoaRace_4',             // Col 52
  'CoaRace_5',             // Col 53
  'CoaRace1_Other',        // Col 54
  'CoaRace27_Other',       // Col 55
  'CoaRace44_Other',       // Col 56
  'Race_Determinant',      // Col 57
  'CoaRace_Determinant',   // Col 58
  'Sex',                   // Col 59
  'CoaSex',                // Col 60
  'Sex_Determinant',       // Col 61
  'CoaSex_Determinant',    // Col 62
  'Age',                   // Col 63
  'Coa_Age',               // Col 64
  'Income',                // Col 65
  'Purchaser',             // Col 66
  'Rate_Spread',           // Col 67
  'HOEPA_Status',          // Col 68
  'Lien_Status',           // Col 69
  'CreditScore',           // Col 70
  'Coa_CreditScore',       // Col 71
  'CreditModel',           // Col 72
  'CreditModelOther',      // Col 73
  'Coa_CreditModel',       // Col 74
  'Coa_CreditModelOther',  // Col 75
  'Denial1',               // Col 76
  'Denial2',               // Col 77
  'Denial3',               // Col 78
  'Denial4',               // Col 79
  'DenialOther',           // Col 80
  'TotalLoanCosts',        // Col 81
  'TotalPtsAndFees',       // Col 82
  'OrigFees',              // Col 83
  'DiscountPts',           // Col 84
  'LenderCredts',          // Col 85
  'InterestRate',          // Col 86
  'APR',                   // Col 87
  'Rate_Lock_Date',        // Col 88
  'PPPTerm',               // Col 89
  'DTIRatio',              // Col 90
  'DSC',                   // Col 91
  'CLTV',                  // Col 92
  'Loan_Term',             // Col 93
  'Loan_Term_Months',      // Col 94
  'IntroRatePeriod',       // Col 95
  'BalloonPMT',            // Col 96
  'IOPMT',                 // Col 97
  'NegAM',                 // Col 98
  'NonAmortz',             // Col 99
  'PropertyValue',         // Col 100
  'MHSecPropType',         // Col 101
  'MHLandPropInt',         // Col 102
  'TotalUnits',            // Col 103
  'MFAHU',                 // Col 104
  'APPMethod',             // Col 105
  'PayableInst',           // Col 106
  'NMLSRID',               // Col 107
  'AUSystem1',             // Col 108
  'AUSystem2',             // Col 109
  'AUSystem3',             // Col 110
  'AUSystem4',             // Col 111
  'AUSystem5',             // Col 112
  'AUSystemOther',         // Col 113
  'AUSResult1',            // Col 114
  'AUSResult2',            // Col 115
  'AUSResult3',            // Col 116
  'AUSResult4',            // Col 117
  'AUSResult5',            // Col 118
  'AUSResultOther',        // Col 119
  'REVMTG',                // Col 120
  'OpenLOC',               // Col 121
  'BUSCML',                // Col 122
  'RateType',              // Col 123 - Added per client feedback
  'Var_Term',              // Col 124 - Added per client feedback (Variable Rate Term)
  'EditStatus',            // Col 125
  'EditCkComments',        // Col 126
  'Comments',              // Col 127
];

// COMPREHENSIVE Encompass field name mapping - covers ALL known Encompass export formats
// Maps Encompass long names to our standard short names
const ENCOMPASS_FIELD_MAP: Record<string, string> = {
  // Core Identifiers
  'Legal Entity Identifier (LEI)': 'LEI',
  'Legal Entity Identifier': 'LEI',
  'Universal Loan Identifier (ULI)': 'ULI',
  'Universal Loan Identifier': 'ULI',
  'Loan ID': 'ApplNumb',
  'Loan Number': 'ApplNumb',
  'Application Number': 'ApplNumb',

  // Dates
  'Application Date': 'ApplDate',
  'Action Taken Date': 'ActionDate',
  'Action Date': 'ActionDate',
  'Rate Lock Date': 'Rate_Lock_Date',
  'Lock Date': 'Rate_Lock_Date',

  // Loan Details
  'Loan Type': 'LoanType',
  'Loan Purpose': 'Purpose',
  'Loan Amount': 'LoanAmount',
  'Loan Amount in Dollars': 'LoanAmount',
  'Construction Method': 'ConstructionMethod',
  'Occupancy Type': 'OccupancyType',
  'Occupancy': 'OccupancyType',
  'Preapproval': 'Preapproval',
  'Pre-approval': 'Preapproval',
  'Action Taken': 'Action',
  'Action': 'Action',

  // Property Info
  'Street Address': 'Address',
  'Property Street': 'Address',
  'Property Address': 'Address',
  'Property City': 'City',
  'Property State': 'State_abrv',
  'State': 'State_abrv',
  'Property ZIP Code': 'Zip',
  'ZIP Code': 'Zip',
  'Zip Code': 'Zip',
  'County': 'County_5',
  'County Code': 'County_5',
  'Census Tract': 'Tract_11',
  'Tract': 'Tract_11',

  // Borrower Demographics - Primary Applicant
  'Applicant Ethnicity 1': 'Ethnicity_1',
  'Applicant Ethnicity-1': 'Ethnicity_1',
  'Ethnicity of Applicant or Borrower: 1': 'Ethnicity_1',
  'Applicant Ethnicity 2': 'Ethnicity_2',
  'Applicant Ethnicity 3': 'Ethnicity_3',
  'Applicant Ethnicity 4': 'Ethnicity_4',
  'Applicant Ethnicity 5': 'Ethnicity_5',
  'Applicant Ethnicity: Free Form Text Field': 'EthnicityOther',
  'Ethnicity of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Ethnicity_Determinant',
  'Applicant Ethnicity Basis': 'Ethnicity_Determinant',

  // Borrower Demographics - Co-Applicant Ethnicity
  'Co-Applicant Ethnicity 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity-1': 'Coa_Ethnicity_1',
  'Ethnicity of Co-Applicant or Co-Borrower: 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity 2': 'Coa_Ethnicity_2',
  'Co-Applicant Ethnicity 3': 'Coa_Ethnicity_3',
  'Co-Applicant Ethnicity 4': 'Coa_Ethnicity_4',
  'Co-Applicant Ethnicity 5': 'Coa_Ethnicity_5',
  'Co-Applicant Ethnicity: Free Form Text Field': 'Coa_EthnicityOther',
  'Ethnicity of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'Coa_Ethnicity_Determinant',
  'Co-Applicant Ethnicity Basis': 'Coa_Ethnicity_Determinant',

  // Borrower Demographics - Race Primary
  'Applicant Race 1': 'Race_1',
  'Applicant Race-1': 'Race_1',
  'Race of Applicant or Borrower: 1': 'Race_1',
  'Applicant Race 2': 'Race_2',
  'Applicant Race 3': 'Race_3',
  'Applicant Race 4': 'Race_4',
  'Applicant Race 5': 'Race_5',
  'Applicant Race: Free Form Text Field for American Indian or Alaska Native Enrolled or Principal Tribe': 'Race1_Other',
  'Applicant Race: Free Form Text Field for Other Asian': 'Race27_Other',
  'Applicant Race: Free Form Text Field for Other Pacific Islander': 'Race44_Other',
  'Race of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Race_Determinant',
  'Applicant Race Basis': 'Race_Determinant',

  // Borrower Demographics - Race Co-Applicant
  'Co-Applicant Race 1': 'CoaRace_1',
  'Co-Applicant Race-1': 'CoaRace_1',
  'Race of Co-Applicant or Co-Borrower: 1': 'CoaRace_1',
  'Co-Applicant Race 2': 'CoaRace_2',
  'Co-Applicant Race 3': 'CoaRace_3',
  'Co-Applicant Race 4': 'CoaRace_4',
  'Co-Applicant Race 5': 'CoaRace_5',
  'Co-Applicant Race: Free Form Text Field for American Indian or Alaska Native': 'CoaRace1_Other',
  'Co-Applicant Race: Free Form Text Field for Other Asian': 'CoaRace27_Other',
  'Co-Applicant Race: Free Form Text Field for Other Pacific Islander': 'CoaRace44_Other',
  'Race of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaRace_Determinant',
  'Co-Applicant Race Basis': 'CoaRace_Determinant',

  // Sex/Gender
  'Sex of Applicant or Borrower': 'Sex',
  'Applicant Sex': 'Sex',
  'Sex of Co-Applicant or Co-Borrower': 'CoaSex',
  'Co-Applicant Sex': 'CoaSex',
  'Sex of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Sex_Determinant',
  'Applicant Sex Basis': 'Sex_Determinant',
  'Sex of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaSex_Determinant',
  'Co-Applicant Sex Basis': 'CoaSex_Determinant',

  // Age
  'Age of Applicant or Borrower': 'Age',
  'Applicant Age': 'Age',
  'Age of Co-Applicant or Co-Borrower': 'Coa_Age',
  'Co-Applicant Age': 'Coa_Age',

  // Income and Financial
  'Income': 'Income',
  'Gross Annual Income': 'Income',
  'Applicant Income': 'Income',
  'Debt-to-Income Ratio': 'DTIRatio',
  'DTI Ratio': 'DTIRatio',
  'Combined Loan-to-Value Ratio': 'CLTV',
  'CLTV': 'CLTV',
  'Property Value': 'PropertyValue',

  // Purchaser
  'Type of Purchaser': 'Purchaser',
  'Purchaser Type': 'Purchaser',

  // Rate Info
  'Rate Spread': 'Rate_Spread',
  'Rate Spread for Reporting Purposes': 'Rate_Spread',
  'Interest Rate': 'InterestRate',
  'Note Rate': 'InterestRate',
  'Annual Percentage Rate': 'APR',
  'APR': 'APR',
  'HOEPA Status': 'HOEPA_Status',
  'Lien Status': 'Lien_Status',

  // Credit Score
  'Credit Score of Applicant or Borrower': 'CreditScore',
  'Applicant Credit Score': 'CreditScore',
  'Credit Score': 'CreditScore',
  'Credit Score of Co-Applicant or Co-Borrower': 'Coa_CreditScore',
  'Co-Applicant Credit Score': 'Coa_CreditScore',
  'Name and Version of Credit Scoring Model': 'CreditModel',
  'Credit Scoring Model': 'CreditModel',
  'Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8': 'CreditModelOther',
  'Co-Applicant Credit Scoring Model': 'Coa_CreditModel',
  'Co-Applicant Name and Version of Credit Scoring Model: Conditional Free Form Text Field': 'Coa_CreditModelOther',

  // Denial Reasons
  'Denial Reason 1': 'Denial1',
  'Reason for Denial: 1': 'Denial1',
  'Denial Reason 2': 'Denial2',
  'Denial Reason 3': 'Denial3',
  'Denial Reason 4': 'Denial4',
  'Denial Reason: Free Form Text Field': 'DenialOther',

  // Loan Costs
  'Total Loan Costs': 'TotalLoanCosts',
  'Total Points and Fees': 'TotalPtsAndFees',
  'Origination Charges': 'OrigFees',
  'Origination Fees': 'OrigFees',
  'Discount Points': 'DiscountPts',
  'Lender Credits': 'LenderCredts',

  // Loan Terms
  'Loan Term': 'Loan_Term',
  'Loan Term (Months)': 'Loan_Term_Months',
  'Prepayment Penalty Term': 'PPPTerm',
  'Introductory Rate Period': 'IntroRatePeriod',
  'Balloon Payment': 'BalloonPMT',
  'Interest-Only Payments': 'IOPMT',
  'Negative Amortization': 'NegAM',
  'Non-Amortizing Features': 'NonAmortz',

  // Property Features
  'Manufactured Home Secured Property Type': 'MHSecPropType',
  'Manufactured Home Land Property Interest': 'MHLandPropInt',
  'Total Units': 'TotalUnits',
  'Multifamily Affordable Units': 'MFAHU',

  // Application Details
  'Application Channel': 'APPMethod',
  'Submission of Application': 'APPMethod',
  'Initially Payable to Your Institution': 'PayableInst',
  'Payable to Institution': 'PayableInst',
  'NMLS ID': 'NMLSRID',
  'Originator NMLSR ID': 'NMLSRID',
  'Loan Originator NMLSR ID': 'NMLSRID',

  // AUS
  'Automated Underwriting System 1': 'AUSystem1',
  'AUS 1': 'AUSystem1',
  'AUS: 1': 'AUSystem1',
  'Automated Underwriting System 2': 'AUSystem2',
  'Automated Underwriting System 3': 'AUSystem3',
  'Automated Underwriting System 4': 'AUSystem4',
  'Automated Underwriting System 5': 'AUSystem5',
  'Automated Underwriting System: Free Form Text Field': 'AUSystemOther',
  'AUS Result 1': 'AUSResult1',
  'Automated Underwriting System Result: 1': 'AUSResult1',
  'AUS Result 2': 'AUSResult2',
  'AUS Result 3': 'AUSResult3',
  'AUS Result 4': 'AUSResult4',
  'AUS Result 5': 'AUSResult5',
  'AUS Result: Free Form Text Field': 'AUSResultOther',

  // Special Loan Types
  'Reverse Mortgage': 'REVMTG',
  'Open-End Line of Credit': 'OpenLOC',
  'Business or Commercial Purpose': 'BUSCML',

  // Additional Fields from Supplemental File
  'Borrower First Name': 'FirstName',
  'Borrower Last Name': 'LastName',
  'Co-Borrower First Name': 'Coa_FirstName',
  'Co-Borrower Last Name': 'Coa_LastName',
  'Loan Officer': 'Lender',
  'Loan Processor': 'AA_Processor',
  'Post Closer': 'LDP_PostCloser',
  'Loan Program': 'LoanProgram',
  'Rate Type': 'RateType',
  'Product Type': 'ProductType',
  'Variable Rate Term': 'Var_Term',
  
  // Additional Fields file specific column names (from Encompass export)
  'Subject Property Address': 'Address',
  'Subject Property City': 'City',
  'Subject Property State': 'State_abrv',
  'Loan Team Member Name - Post Closer': 'LDP_PostCloser',
  'Borrower Name': 'BorrowerFullName',  // Full name field, will need to split
};

/**
 * Convert Encompass field names to standard names
 */
const normalizeFieldName = (fieldName: string): string => {
  // First check if there's a direct mapping
  if (ENCOMPASS_FIELD_MAP[fieldName]) {
    return ENCOMPASS_FIELD_MAP[fieldName];
  }

  // Try case-insensitive match
  const fieldLower = fieldName.toLowerCase().trim();
  for (const [encompassName, standardName] of Object.entries(ENCOMPASS_FIELD_MAP)) {
    if (encompassName.toLowerCase() === fieldLower) {
      return standardName;
    }
  }

  // Return the original field name if no mapping found
  return fieldName;
};

/**
 * Convert Excel serial date to M/D/YY format
 */
export const excelDateToString = (value: any): string => {
  if (!value) return '';

  // Already a date string
  if (typeof value === 'string' && (value.includes('/') || value.includes('-'))) {
    return value;
  }

  // YYYYMMDD format (like 20251006)
  const strValue = String(value);
  if (/^\d{8}$/.test(strValue)) {
    const year = strValue.substring(0, 4);
    const month = parseInt(strValue.substring(4, 6));
    const day = parseInt(strValue.substring(6, 8));
    return `${month}/${day}/${year.slice(-2)}`;
  }

  // Excel serial number
  const serial = Number(value);
  if (isNaN(serial) || serial < 1000 || serial > 100000) {
    return String(value ?? '');
  }

  const date = new Date((serial - 25569) * 86400 * 1000);
  const month = date.getMonth() + 1;
  const day = date.getDate();
  const year = String(date.getFullYear()).slice(-2);

  return `${month}/${day}/${year}`;
};

/**
 * Parse Encompass Excel file - IMPROVED to handle various formats
 */
export const parseEncompassFile = (worksheet: any[][]): SbslRow[] => {
  const startTime = Date.now();
  logInfo('ETL:Parse', 'Starting Encompass file parsing', { totalRows: worksheet.length });
  
  console.log('=== PARSING ENCOMPASS FILE ===');
  console.log('Total rows:', worksheet.length);
  console.log('Row 0 (first 5 cells):', worksheet[0]?.slice(0, 5));
  console.log('Row 1 (first 5 cells):', worksheet[1]?.slice(0, 5));
  console.log('Row 2 (first 5 cells):', worksheet[2]?.slice(0, 5));

  // Find the real header row by looking for HMDA-like column names
  const headerIndicators = [
    'LEI', 'ULI', 'Loan', 'Applicant', 'Property', 'Legal Entity',
    'Universal Loan', 'Application Date', 'Action', 'Census'
  ];

  const metadataIndicators = [
    'Financial Institution', 'Calendar Year', 'Calendar Quarter',
    'Contact Person', 'Colony Bank', 'Phone Number', 'Email'
  ];

  let headerRowIndex = 0;

  // Find the header row
  for (let i = 0; i < Math.min(10, worksheet.length); i++) {
    const row = worksheet[i];
    if (!row) continue;

    const rowString = row.map((c: any) => String(c ?? '')).join(' ');

    // Check if this is a metadata row to skip
    const isMetadata = metadataIndicators.some(ind => rowString.includes(ind));
    if (isMetadata) {
      console.log(`Row ${i} is metadata, skipping`);
      continue;
    }

    // Check if this looks like a header row
    const headerMatches = headerIndicators.filter(ind => rowString.includes(ind));
    if (headerMatches.length >= 2) {
      headerRowIndex = i;
      console.log(`Found header row at index ${i}, matches:`, headerMatches);
      break;
    }
  }

  console.log('Using header row index:', headerRowIndex);

  // Get headers from the identified row
  const rawHeaders = worksheet[headerRowIndex] || [];
  console.log('Raw headers (first 10):', rawHeaders.slice(0, 10));

  // Normalize header names
  const headers = rawHeaders.map((h: any) => normalizeFieldName(String(h ?? '').trim()));
  console.log('Normalized headers (first 10):', headers.slice(0, 10));

  // Get data rows (everything after the header)
  const dataRows = worksheet.slice(headerRowIndex + 1);
  console.log('Data rows count:', dataRows.length);

  // Map data rows to objects
  const results = dataRows.map((row, idx) => {
    const obj: SbslRow = {};

    headers.forEach((header: string, colIndex: number) => {
      if (header && row[colIndex] !== undefined && row[colIndex] !== null) {
        const value = row[colIndex];
        // Preserve zeros! Use nullish coalescing
        obj[header] = value;
      }
    });

    // Also keep the original Encompass names for debugging
    rawHeaders.forEach((rawHeader: any, colIndex: number) => {
      if (rawHeader && row[colIndex] !== undefined && row[colIndex] !== null) {
        const headerStr = String(rawHeader).trim();
        if (headerStr && !obj[headerStr]) {
          obj[headerStr] = row[colIndex];
        }
      }
    });

    if (idx === 0) {
      console.log('First data row keys:', Object.keys(obj).slice(0, 15));
      console.log('First data row values:', Object.values(obj).slice(0, 15));
    }

    return obj;
  }).filter(row => Object.keys(row).length > 0);

  console.log('Parsed rows:', results.length);
  
  const duration = Date.now() - startTime;
  trackETLStep('ParseEncompass', worksheet.length, results.length, duration, [], [], 
    results.length > 0 ? { firstRowKeys: Object.keys(results[0]).slice(0, 10) } : undefined
  );
  
  return results;
};

/**
 * Parse LaserPro text file (tilde-delimited)
 */
export const parseLaserProFile = (content: string): SbslRow[] => {
  const lines = content.split('\n');
  const results: SbslRow[] = [];

  // LaserPro field positions
  const LASERPRO_FIELD_MAP: Record<number, string> = {
    0: 'ApplNumb',
    1: 'ApplDate',
    2: 'LoanType',
    3: 'Purpose',
    4: 'Action',
    5: 'ActionDate',
    11: 'Preapproval',
    14: 'BorrowerFullName',
    15: 'LastName',
    16: 'Address',
    17: 'City',
    18: 'State_abrv',
    19: 'Zip',
    20: 'County_5',
    21: 'Tract_11',
    22: 'LoanAmount',
    23: 'Income',
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    // Skip metadata row (first row that contains pipe and "Colony Bank")
    if (i === 0 && ((line.includes('|') && line.includes('Colony Bank')) || line.startsWith('1|'))) {
      console.log('Skipping LaserPro metadata row');
      continue;
    }

    const values = line.split('~');

    const row: SbslRow = {};
    Object.entries(LASERPRO_FIELD_MAP).forEach(([position, fieldName]) => {
      const index = parseInt(position);
      if (values[index] !== undefined) {
        row[fieldName] = values[index];
      }
    });

    // Store all values with Field_ prefix for any unmapped fields
    values.forEach((val, idx) => {
      if (!row[`Field_${idx}`]) {
        row[`Field_${idx}`] = val;
      }
    });

    results.push(row);
  }

  return results;
};

/**
 * Find field value from various possible field names - COMPREHENSIVE version
 */
export const findFieldValue = (row: Record<string, any>, targetField: string): any => {
  // Direct match first
  if (row[targetField] !== undefined) return row[targetField];

  // Comprehensive variations map
  const variations: Record<string, string[]> = {
    'LEI': ['LEI', 'Legal Entity Identifier (LEI)', 'Legal Entity Identifier'],
    'ULI': ['ULI', 'Universal Loan Identifier (ULI)', 'Universal Loan Identifier'],
    'ApplNumb': ['ApplNumb', 'Loan Number', 'Loan ID', 'Application Number', 'LoanNumber'],
    'LastName': ['LastName', 'Last Name', 'Borrower Last Name', 'Applicant Last Name', 'LASTNAME'],
    'FirstName': ['FirstName', 'First Name', 'Borrower First Name', 'Applicant First Name', 'FIRSTNAME'],
    'Coa_LastName': ['Coa_LastName', 'Co-Borrower Last Name', 'Co-Applicant Last Name', 'CLASTNAME'],
    'Coa_FirstName': ['Coa_FirstName', 'Co-Borrower First Name', 'Co-Applicant First Name', 'CFIRSTNAME'],
    'LoanAmount': ['LoanAmount', 'Loan Amount', 'Loan Amount in Dollars', 'LOANAMOUNTINDOLLARS', 'LoanAmountInDollars'],
    'LoanAmountInDollars': ['LoanAmount', 'Loan Amount', 'Loan Amount in Dollars', 'LOANAMOUNTINDOLLARS', 'LoanAmountInDollars'],
    'Address': ['Address', 'Street Address', 'Property Address', 'Property Street', 'Subject Property Address', 'ADDRESS'],
    'City': ['City', 'Property City', 'Subject Property City', 'CITY'],
    'State_abrv': ['State_abrv', 'State', 'Property State', 'STATE_ABRV', 'STATE'],
    'Zip': ['Zip', 'ZIP Code', 'Property ZIP Code', 'ZipCode', 'ZIP'],
    'County_5': ['County_5', 'County', 'County Code', 'COUNTY_5'],
    'Tract_11': ['Tract_11', 'Census Tract', 'Tract', 'TRACT_11'],
    'ApplDate': ['ApplDate', 'Application Date', 'ApplicationDate', 'APPLDATE'],
    'ActionDate': ['ActionDate', 'Action Taken Date', 'Action Date', 'ACTIONDATE'],
    'Action': ['Action', 'Action Taken', 'ACTION'],
    'LoanType': ['LoanType', 'Loan Type', 'LOANTYPE'],
    'Purpose': ['Purpose', 'Loan Purpose', 'PURPOSE'],
    'Purchaser': ['Purchaser', 'Type of Purchaser', 'Purchaser Type', 'PURCHASER'],
    'Income': ['Income', 'Gross Annual Income', 'Applicant Income', 'INCOME'],
    'CreditScore': ['CreditScore', 'Credit Score', 'Applicant Credit Score', 'Credit Score of Applicant or Borrower', 'CREDITSCORE'],
    'Coa_CreditScore': ['Coa_CreditScore', 'Co-Applicant Credit Score', 'Credit Score of Co-Applicant or Co-Borrower', 'COA_CREDITSCORE'],
    'Age': ['Age', 'Applicant Age', 'Age of Applicant or Borrower', 'AGE'],
    'Coa_Age': ['Coa_Age', 'Co-Applicant Age', 'Age of Co-Applicant or Co-Borrower', 'COA_AGE'],
    'Sex': ['Sex', 'Applicant Sex', 'Sex of Applicant or Borrower', 'SEX'],
    'CoaSex': ['CoaSex', 'Co-Applicant Sex', 'Sex of Co-Applicant or Co-Borrower', 'COASEX'],
    'Ethnicity_1': ['Ethnicity_1', 'Applicant Ethnicity 1', 'Ethnicity of Applicant or Borrower: 1', 'ETHNICITY_1'],
    'Race_1': ['Race_1', 'Applicant Race 1', 'Race of Applicant or Borrower: 1', 'RACE_1'],
    'InterestRate': ['InterestRate', 'Interest Rate', 'Note Rate', 'INTERESTRATE'],
    'APR': ['APR', 'Annual Percentage Rate'],
    'Rate_Lock_Date': ['Rate_Lock_Date', 'Rate Lock Date', 'Lock Date', 'RATE_LOCK_DATE'],
    'DTIRatio': ['DTIRatio', 'Debt-to-Income Ratio', 'DTI Ratio', 'DTIRATIO'],
    'CLTV': ['CLTV', 'Combined Loan-to-Value Ratio', 'Combined LTV'],
    'PropertyValue': ['PropertyValue', 'Property Value', 'PROPERTYVALUE'],
    'Lender': ['Lender', 'Loan Officer', 'Originator', 'LENDER'],
    'AA_Processor': ['AA_Processor', 'Loan Processor', 'Processor', 'AA_LOANPROCESSOR'],
    'LDP_PostCloser': ['LDP_PostCloser', 'Post Closer', 'LDP_POSTCLOSER'],
    'NMLSRID': ['NMLSRID', 'NMLS ID', 'Originator NMLSR ID', 'Loan Originator NMLSR ID'],
    'Lien_Status': ['Lien_Status', 'Lien Status', 'LIEN_STATUS'],
    'HOEPA_Status': ['HOEPA_Status', 'HOEPA Status', 'HOEPA_STATUS'],
    'Rate_Spread': ['Rate_Spread', 'Rate Spread', 'Rate Spread for Reporting Purposes', 'RATE_SPREAD'],
    'BranchName': ['BranchName', 'Branch Name', 'BRANCHNAME', 'Branch_Name'],
    'Branch_Name': ['BranchName', 'Branch Name', 'BRANCHNAME', 'Branch_Name'],
    'Branch': ['Branch', 'BranchNumb', 'Branch Number', 'BRANCHNUMB'],
    'ErrorMadeBy': ['ErrorMadeBy', 'Error_Made_By', 'Error Made By'],
    'LoanProgram': ['LoanProgram', 'Loan Program', 'LOANPROGRAM'],
    'RateType': ['RateType', 'Rate Type', 'RATETYPE', 'Rate_Type'],
    'Var_Term': ['Var_Term', 'Variable Rate Term', 'VAR_TERM', 'VarTerm', 'Variable Term'],
    'TotalUnits': ['TotalUnits', 'Total Units', 'TOTALUNITS'],
    'NonAmortz': ['NonAmortz', 'Non-Amortizing Features', 'NONAMORTZ', 'NonAmortizing'],
    'CreditModel': ['CreditModel', 'Credit Scoring Model', 'Name and Version of Credit Scoring Model', 'CREDITMODEL'],
    'ConstructionMethod': ['ConstructionMethod', 'Construction Method', 'CONSTRUCTIONMETHOD'],
    'OccupancyType': ['OccupancyType', 'Occupancy Type', 'Occupancy', 'OCCUPANCYTYPE'],
    'Preapproval': ['Preapproval', 'Pre-approval', 'PREAPPROVAL'],
  };

  const possibleNames = variations[targetField] || [targetField];

  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name];
    // Try case-insensitive
    const lowerName = name.toLowerCase();
    const matchingKey = Object.keys(row).find(k => k.toLowerCase() === lowerName);
    if (matchingKey && row[matchingKey] !== undefined) return row[matchingKey];
  }

  return null;
};

/**
 * Parse "Borrower Name" field (like "McKettrick III, Robert L") into FirstName and LastName
 */
export const parseBorrowerName = (fullName: string): { firstName: string; lastName: string } => {
  if (!fullName) return { firstName: '', lastName: '' };
  
  const parts = fullName.split(',').map(p => p.trim());
  if (parts.length >= 2) {
    // Format: "LastName, FirstName MiddleName" or "LastName Suffix, FirstName"
    return {
      lastName: parts[0],
      firstName: parts[1].split(' ')[0] // Take first word after comma as first name
    };
  }
  
  // Fallback: split on space
  const spaceParts = fullName.trim().split(' ');
  if (spaceParts.length >= 2) {
    return {
      firstName: spaceParts[0],
      lastName: spaceParts.slice(1).join(' ')
    };
  }
  
  return { firstName: fullName, lastName: '' };
};

/**
 * Transform data to CRA Wiz 128-column format
 */
export const transformToCRAWizFormat = (data: SbslRow[]): SbslRow[] => {
  const startTime = Date.now();
  const errors: string[] = [];
  const warnings: string[] = [];
  
  logInfo('ETL:Transform', 'Starting CRA Wiz transformation', { inputRows: data.length, targetColumns: CRA_WIZ_128_COLUMNS.length });
  
  console.log('=== TRANSFORMING TO CRA WIZ FORMAT ===');
  console.log('Input rows:', data.length);

  const result = data.map((row, idx) => {
    const output: SbslRow = {};

    CRA_WIZ_128_COLUMNS.forEach(col => {
      const value = findFieldValue(row, col);
      // IMPORTANT: Explicitly preserve numeric zeros (0, 0.0, "0")
      // The issue was that zeros were being treated as "falsy" and dropped
      if (value === 0 || value === '0' || value === 0.0) {
        output[col] = value;
      } else {
        output[col] = value ?? '';
      }
    });
    
    // Parse Borrower Name if FirstName/LastName are missing
    if ((!output['FirstName'] || !output['LastName']) && row['BorrowerFullName']) {
      const { firstName, lastName } = parseBorrowerName(String(row['BorrowerFullName']));
      if (!output['FirstName']) output['FirstName'] = firstName;
      if (!output['LastName']) output['LastName'] = lastName;
    }
    
    // Also check for "Borrower Name" field directly
    if ((!output['FirstName'] || !output['LastName']) && row['Borrower Name']) {
      const { firstName, lastName } = parseBorrowerName(String(row['Borrower Name']));
      if (!output['FirstName']) output['FirstName'] = firstName;
      if (!output['LastName']) output['LastName'] = lastName;
    }

    // Branch lookup - derive from Lender/Loan Officer if no direct branch value
    let branchNum = String(output['Branch'] || findFieldValue(row, 'Branch') || '').trim();
    
    // If no branch number, try to derive from Lender/Loan Officer
    if (!branchNum) {
      const lender = output['Lender'] || findFieldValue(row, 'Lender') || '';
      if (lender) {
        branchNum = getBranchFromLoanOfficer(String(lender));
        if (branchNum) {
          output['Branch'] = branchNum;
          logDebug('ETL:Transform', `Derived branch ${branchNum} from Lender: ${lender}`);
        } else {
          warnings.push(`Row ${idx}: Could not determine branch for Lender "${lender}"`);
        }
      }
    }
    
    // Set Branch_Name from branch number
    if (branchNum) {
      const branchName = getBranchName(branchNum, output['Branch_Name']);
      if (branchName) {
        output['Branch_Name'] = branchName;
      } else {
        warnings.push(`Row ${idx}: Unknown branch number "${branchNum}"`);
      }
    }

    // Add required blank fields
    if (!output['ErrorMadeBy']) output['ErrorMadeBy'] = '';
    if (!output['DSC']) output['DSC'] = '';
    if (!output['EditStatus']) output['EditStatus'] = '';
    if (!output['EditCkComments']) output['EditCkComments'] = '';
    if (!output['Comments']) output['Comments'] = '';

    // Default co-applicant values if empty (per HMDA spec, 9999 = N/A)
    if (!output['Coa_Age'] || String(output['Coa_Age']) === '') output['Coa_Age'] = '9999';
    if (!output['Coa_CreditScore'] || String(output['Coa_CreditScore']) === '') output['Coa_CreditScore'] = '9999';

    // Fix fields identified in client feedback:

    // DTIRatio: should be numeric value or "NA" (HMDA code for Exempt)
    if (output['DTIRatio'] === '' || output['DTIRatio'] === null || output['DTIRatio'] === undefined) {
      output['DTIRatio'] = 'NA';
    }

    // CreditModel: should not be blank - use "9" for "Not applicable" per HMDA spec
    if (output['CreditModel'] === '' || output['CreditModel'] === null || output['CreditModel'] === undefined) {
      // Try to get from source data
      const creditModel = findFieldValue(row, 'CreditModel');
      output['CreditModel'] = creditModel ?? '9';  // 9 = Not applicable
    }

    // NonAmortz: HMDA values are 1=Balloon, 2=Interest-only, 3=Negative amortization, 1111=N/A
    // If has value, keep it; if blank, check other amortization fields
    if (output['NonAmortz'] === '' || output['NonAmortz'] === null || output['NonAmortz'] === undefined) {
      const balloon = findFieldValue(row, 'BalloonPMT');
      const interestOnly = findFieldValue(row, 'IOPMT');
      const negAm = findFieldValue(row, 'NegAM');

      // If any non-amortizing feature is present, derive NonAmortz
      if (balloon === '1' || balloon === 1) {
        output['NonAmortz'] = '1';
      } else if (interestOnly === '1' || interestOnly === 1) {
        output['NonAmortz'] = '2';
      } else if (negAm === '1' || negAm === 1) {
        output['NonAmortz'] = '3';
      } else {
        output['NonAmortz'] = '1111';  // N/A - no non-amortizing features
      }
    }

    // NMLSRID: should not be blank - get from Loan Officer/Lender lookup if available
    if (output['NMLSRID'] === '' || output['NMLSRID'] === null || output['NMLSRID'] === undefined) {
      const nmls = findFieldValue(row, 'NMLSRID');
      if (nmls) {
        output['NMLSRID'] = String(nmls).replace(/^NMLS?#?\s*/i, '').trim();
      }
      // Still blank? Will need manual lookup or data enrichment
    }

    // RateType: 1=Fixed, 2=Variable (if not set, default based on loan type)
    if (output['RateType'] === '' || output['RateType'] === null || output['RateType'] === undefined) {
      const rateType = findFieldValue(row, 'RateType');
      if (rateType) {
        output['RateType'] = rateType;
      } else {
        // Check if there's an intro rate period which would indicate variable
        const introRate = output['IntroRatePeriod'];
        if (introRate && introRate !== '' && introRate !== 'NA' && introRate !== 'Exempt') {
          output['RateType'] = '2';  // Variable
        }
        // Otherwise leave blank - needs manual input
      }
    }

    // Var_Term: Variable rate term in months (only applicable if RateType=2)
    if (output['Var_Term'] === '' || output['Var_Term'] === null || output['Var_Term'] === undefined) {
      const varTerm = findFieldValue(row, 'Var_Term');
      if (varTerm) {
        output['Var_Term'] = varTerm;
      } else if (output['RateType'] === '1') {
        output['Var_Term'] = 'NA';  // Fixed rate loans don't have variable term
      }
    }

    // ConstructionMethod: HMDA values 1=Site-built, 2=Manufactured home
    if (output['ConstructionMethod'] === '' || output['ConstructionMethod'] === null || output['ConstructionMethod'] === undefined) {
      const constructMethod = findFieldValue(row, 'ConstructionMethod');
      output['ConstructionMethod'] = constructMethod ?? '1';  // Default to site-built
    }

    // Convert dates
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      if (output[field]) {
        output[field] = excelDateToString(output[field]);
      }
    });

    if (idx === 0) {
      console.log('First transformed row (first 10 keys):', Object.keys(output).slice(0, 10));
      console.log('First transformed row (first 10 values):', Object.values(output).slice(0, 10));
      logDebug('ETL:Transform', 'First row sample', {
        keys: Object.keys(output).slice(0, 15),
        values: Object.values(output).slice(0, 15)
      });
    }
    
    // Track missing critical fields
    if (!output['ULI'] && !output['LEI']) {
      warnings.push(`Row ${idx}: Missing ULI and LEI`);
    }
    if (!output['LoanAmountInDollars'] || output['LoanAmountInDollars'] === '' || output['LoanAmountInDollars'] === 0) {
      warnings.push(`Row ${idx}: Missing or zero LoanAmountInDollars`);
    }

    return output;
  });
  
  const duration = Date.now() - startTime;
  trackETLStep('TransformCRAWiz', data.length, result.length, duration, errors, warnings,
    result.length > 0 ? { 
      outputColumns: Object.keys(result[0]).length,
      expectedColumns: CRA_WIZ_128_COLUMNS.length,
      sampleRow: Object.fromEntries(Object.entries(result[0]).slice(0, 10))
    } : undefined
  );
  
  if (warnings.length > 0) {
    logWarning('ETL:Transform', `Completed with ${warnings.length} warnings`, { warningsSample: warnings.slice(0, 5) });
  }
  
  return result;
};

/**
 * Merge supplemental data (Additional Fields file)
 */
export const mergeSupplementalData = (primaryData: SbslRow[], supplementalData: SbslRow[]): SbslRow[] => {
  const startTime = Date.now();
  
  if (!supplementalData || supplementalData.length === 0) {
    console.log('No supplemental data to merge');
    logWarning('ETL:Merge', 'No supplemental data provided for merge');
    return primaryData;
  }

  logInfo('ETL:Merge', 'Starting supplemental data merge', { 
    primaryRows: primaryData.length, 
    supplementalRows: supplementalData.length 
  });
  
  console.log('=== MERGING SUPPLEMENTAL DATA ===');
  console.log('Primary data rows:', primaryData.length);
  console.log('Supplemental data rows:', supplementalData.length);

  if (supplementalData.length > 0) {
    console.log('Supplemental first row keys:', Object.keys(supplementalData[0]).slice(0, 15));
  }

  // Create lookup maps for supplemental data
  // Try multiple keys: ULI, Loan Number, Address+City
  const suppByULI = new Map<string, SbslRow>();
  const suppByLoanNum = new Map<string, SbslRow>();
  const suppByAddress = new Map<string, SbslRow>();

  supplementalData.forEach((row, idx) => {
    // Try all possible ULI field names
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    // Try all possible Loan Number field names
    const loanNum = String(
      row['ApplNumb'] || row['Loan Number'] || row['LoanNumber'] || row['Loan ID'] || row['Application Number'] || ''
    ).trim();

    // Try all possible Address field names (including Subject Property Address from Additional Fields)
    const address = String(
      row['Address'] || row['Property Address'] || row['Street Address'] || row['Property Street'] || 
      row['Subject Property Address'] || ''
    ).toLowerCase().trim();

    // Try all possible City field names (including Subject Property City from Additional Fields)
    const city = String(
      row['City'] || row['Property City'] || row['Subject Property City'] || ''
    ).toLowerCase().trim();

    if (uli) suppByULI.set(uli, row);
    if (loanNum) suppByLoanNum.set(loanNum, row);
    if (address && city) suppByAddress.set(`${address}|${city}`, row);

    if (idx === 0) {
      console.log('First supplemental row - ULI:', uli, 'LoanNum:', loanNum, 'Address:', address, 'City:', city);
    }
  });

  console.log('Lookup maps - ULI:', suppByULI.size, 'LoanNum:', suppByLoanNum.size, 'Address:', suppByAddress.size);

  let matchCount = 0;
  const result = primaryData.map((row, idx) => {
    // Try all possible ULI field names from primary data
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    // Try all possible Loan Number field names
    const loanNum = String(
      row['ApplNumb'] || row['Loan Number'] || row['LoanNumber'] || row['Loan ID'] || ''
    ).trim();

    // Try all possible Address field names (including Subject Property Address)
    const address = String(
      row['Address'] || row['Property Address'] || row['Street Address'] || 
      row['Subject Property Address'] || ''
    ).toLowerCase().trim();

    // Try all possible City field names (including Subject Property City)
    const city = String(
      row['City'] || row['Property City'] || row['Subject Property City'] || ''
    ).toLowerCase().trim();

    // Try to find matching supplemental data
    const supp = suppByULI.get(uli) || suppByLoanNum.get(loanNum) || suppByAddress.get(`${address}|${city}`);

    if (idx === 0) {
      console.log('First primary row - ULI:', uli, 'LoanNum:', loanNum, 'Address:', address);
      console.log('Match found:', !!supp);
    }

    if (supp) {
      matchCount++;
      // Get values from supplemental with all possible field name variations
      const firstName = supp['FirstName'] || supp['First Name'] || supp['Borrower First Name'] || '';
      const lastName = supp['LastName'] || supp['Last Name'] || supp['Borrower Last Name'] || '';
      const coaFirstName = supp['Coa_FirstName'] || supp['Co-Borrower First Name'] || supp['Co-Applicant First Name'] || '';
      const coaLastName = supp['Coa_LastName'] || supp['Co-Borrower Last Name'] || supp['Co-Applicant Last Name'] || '';
      const lender = supp['Lender'] || supp['Loan Officer'] || supp['Originator'] || '';
      const processor = supp['AA_Processor'] || supp['Processor'] || supp['Loan Processor'] || '';
      const postCloser = supp['LDP_PostCloser'] || supp['Post Closer'] || supp['Loan Team Member Name - Post Closer'] || '';
      const apr = supp['APR'] || supp['Annual Percentage Rate'] || '';
      const rateLockDate = supp['Rate_Lock_Date'] || supp['Rate Lock Date'] || supp['Lock Date'] || '';
      const loanProgram = supp['LoanProgram'] || supp['Loan Program'] || '';
      const rateType = supp['RateType'] || supp['Rate Type'] || '';
      const branchName = supp['BranchName'] || supp['Branch Name'] || supp['Branch'] || '';
      
      // Also get address fields from supplemental if primary is missing them
      const suppAddress = supp['Address'] || supp['Subject Property Address'] || supp['Street Address'] || '';
      const suppCity = supp['City'] || supp['Subject Property City'] || '';
      const suppState = supp['State_abrv'] || supp['Subject Property State'] || '';

      return {
        ...row,
        FirstName: firstName || row.FirstName,
        LastName: lastName || row.LastName,
        Coa_FirstName: coaFirstName || row.Coa_FirstName,
        Coa_LastName: coaLastName || row.Coa_LastName,
        Lender: lender || row.Lender,
        AA_Processor: processor || row.AA_Processor,
        LDP_PostCloser: postCloser || row.LDP_PostCloser,
        APR: apr || row.APR,
        Rate_Lock_Date: rateLockDate || row.Rate_Lock_Date,
        LoanProgram: loanProgram || row.LoanProgram,
        RateType: rateType || row.RateType,
        BranchName: branchName || row.BranchName,
        // Fill in address from supplemental if primary is missing
        Address: row.Address || suppAddress,
        City: row.City || suppCity,
        State_abrv: row.State_abrv || suppState,
        _merged: true, // Flag to indicate this record was merged
      };
    }

    return row;
  });

  console.log('Merge complete - matched', matchCount, 'of', primaryData.length, 'rows');
  
  const duration = Date.now() - startTime;
  const mergeWarnings: string[] = [];
  if (matchCount === 0) {
    mergeWarnings.push('No records matched - check if files have matching addresses');
  } else if (matchCount < primaryData.length * 0.5) {
    mergeWarnings.push(`Low match rate: only ${matchCount}/${primaryData.length} records matched`);
  }
  
  trackETLStep('MergeSupplemental', primaryData.length, result.length, duration, [], mergeWarnings, {
    matchCount,
    matchRate: `${((matchCount / primaryData.length) * 100).toFixed(1)}%`,
    lookupMaps: { byULI: suppByULI.size, byLoanNum: suppByLoanNum.size, byAddress: suppByAddress.size }
  });
  
  return result;
};

/**
 * Validate HMDA data
 */
export const validateData = (data: SbslRow[]): ValidationResult[] => {
  return data.map((row, idx) => {
    const applNumb = String(row.ApplNumb || row.ULI || '-');
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoCorrected: Record<string, { from: any; to: any }> = {};

    // Census Tract validation - accept ALL valid formats
    // Valid: 11-digit FIPS (13081010202), decimal (1234.56), NA, Exempt, empty
    const tract = findFieldValue(row, 'Tract_11');
    if (tract) {
      const tractStr = String(tract).trim();
      // Accept: 11 digits (FIPS like 13081010202), decimal format, NA, Exempt
      const isValidFIPS = /^\d{11}$/.test(tractStr);
      const isValidDecimal = /^\d{1,6}\.?\d{0,2}$/.test(tractStr);
      const isValidSpecial = ['NA', 'Exempt', ''].includes(tractStr);

      if (!isValidFIPS && !isValidDecimal && !isValidSpecial) {
        // Only warn, don't error - many formats are valid
        warnings.push(`Census Tract format unusual: ${tract}`);
      }
    }

    // Interest Rate validation
    const rate = parseFloat(String(findFieldValue(row, 'InterestRate') || 0));
    if (!isNaN(rate) && rate > 0 && (rate < 0 || rate > 25)) {
      errors.push(`Interest Rate out of bounds: ${rate}% (must be 0-25%)`);
    }

    // Action code validation
    const action = parseInt(String(findFieldValue(row, 'Action') || 0));
    if (!isNaN(action) && action > 0 && ![1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
      errors.push(`Invalid Action Taken Code: ${action} (must be 1-8)`);
    }

    // Loan amount check - only warn if zero/missing
    const loanAmt = parseFloat(String(findFieldValue(row, 'LoanAmount') || 0));
    if (loanAmt <= 0) {
      warnings.push('Loan Amount is zero or missing');
    }

    return {
      rowIdx: idx + 1, // 1-indexed for user display
      applNumb,
      isValid: errors.length === 0,
      errors,
      warnings,
      autoCorrected
    };
  });
};

/**
 * Auto-correct common validation issues
 */
export const autoCorrectData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const corrected = { ...row };

    // State abbreviation
    const state = findFieldValue(row, 'State_abrv');
    if (state && String(state).length !== 2) {
      corrected.State_abrv = String(state).trim().toUpperCase().substring(0, 2);
    }

    // County padding
    const county = findFieldValue(row, 'County_5');
    if (county) {
      corrected.County_5 = String(county).padStart(5, '0');
    }

    // Date formatting
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      const value = corrected[field];
      if (value) {
        corrected[field] = excelDateToString(value);
      }
    });

    return corrected;
  });
};

/**
 * Export CRA Wiz 128-column format
 */
export const exportCRAWizFormat = (data: SbslRow[], filename?: string): void => {
  logInfo('ETL:Export', 'Starting CRA Wiz export', { rowCount: data.length, targetColumns: CRA_WIZ_128_COLUMNS.length });
  
  console.log('=== EXPORT CRA WIZ FORMAT ===');
  console.log('exportCRAWizFormat called with', data.length, 'rows');

  const transformedData = transformToCRAWizFormat(data);
  console.log('Transformed data count:', transformedData.length);

  if (transformedData.length > 0) {
    console.log('First row keys:', Object.keys(transformedData[0]).slice(0, 5));
    console.log('First row values:', Object.values(transformedData[0]).slice(0, 5));
  }

  const ws = utils.json_to_sheet(transformedData, {
    header: CRA_WIZ_128_COLUMNS
  });

  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'CRA Data');

  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const defaultFilename = `CRA_Wiz_Upload_${monthNames[now.getMonth()]}_${now.getFullYear()}.xlsx`;

  console.log('Exporting file:', filename || defaultFilename);
  writeFile(wb, filename || defaultFilename);
};

/**
 * Process uploaded file
 */
export const processFile = async (file: File): Promise<SbslRow[]> => {
  const startTime = Date.now();
  logInfo('ETL:FileProcess', `Starting file processing: ${file.name}`, { 
    fileName: file.name, 
    fileSize: file.size,
    fileType: file.type 
  });
  
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();

    console.log('Processing file:', file.name);

    reader.onload = (e) => {
      try {
        if (fileName.endsWith('.txt')) {
          const content = e.target?.result as string;
          resolve(parseLaserProFile(content));
        } else {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];

          // Get as 2D array for better control
          const rows = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          console.log('Sheet has', rows.length, 'rows');

          // Check file type by examining headers and content
          const firstCell = String(rows[0]?.[0] || '');
          const secondCell = String(rows[0]?.[1] || '');
          const firstRowStr = rows[0]?.map(c => String(c || '')).join(' ') || '';
          const secondRowStr = rows[1]?.map(c => String(c || '')).join(' ') || '';

          // Check for Additional Fields file FIRST (has Loan Number column typically)
          const hasAdditionalFieldsIndicators =
            firstRowStr.includes('Loan Number') ||
            firstRowStr.includes('Borrower First Name') ||
            firstRowStr.includes('Borrower Last Name') ||
            (firstRowStr.includes('APR') && !firstRowStr.includes('Legal Entity'));

          // Check for Encompass HMDA export (has metadata rows or specific headers)
          const hasEncompassIndicators =
            firstCell.includes('Financial Institution') ||
            firstCell.includes('Calendar') ||
            firstCell.includes('Colony Bank') ||
            secondCell.includes('LEI') ||
            firstRowStr.includes('Legal Entity Identifier') ||
            secondRowStr.includes('Legal Entity Identifier') ||
            rows.slice(0, 5).some(row => String(row?.[0] || '').includes('Legal Entity'));

          if (hasAdditionalFieldsIndicators && !hasEncompassIndicators) {
            // Additional Fields / Supplemental file - parse as standard Excel
            console.log('Detected Additional Fields format');
            const jsonData = utils.sheet_to_json(worksheet) as SbslRow[];
            // Normalize field names for supplemental data too
            const normalizedData = jsonData.map(row => {
              const normalized: SbslRow = {};
              Object.entries(row).forEach(([key, value]) => {
                const normalizedKey = normalizeFieldName(key);
                normalized[normalizedKey] = value;
                // Keep original key too for backup matching
                if (normalizedKey !== key) {
                  normalized[key] = value;
                }
              });
              return normalized;
            });
            resolve(normalizedData);
          } else if (hasEncompassIndicators) {
            console.log('Detected Encompass HMDA export format');
            resolve(parseEncompassFile(rows));
          } else {
            // Standard Excel file - still normalize field names
            console.log('Detected standard Excel format');
            const jsonData = utils.sheet_to_json(worksheet) as SbslRow[];
            const normalizedData = jsonData.map(row => {
              const normalized: SbslRow = {};
              Object.entries(row).forEach(([key, value]) => {
                const normalizedKey = normalizeFieldName(key);
                normalized[normalizedKey] = value;
              });
              return normalized;
            });
            resolve(normalizedData);
          }
        }
      } catch (error) {
        console.error('File processing error:', error);
        logError('ETL:FileProcess', `Error processing file: ${file.name}`, { error: String(error) }, error as Error);
        reject(error);
      }
    };

    reader.onerror = () => {
      logError('ETL:FileProcess', `Failed to read file: ${file.name}`);
      reject(new Error('Failed to read file'));
    };

    if (fileName.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
};

// ============================================
// OUTPUT COMPARISON / VALIDATION FEATURE
// ============================================

export interface ColumnStats {
  matches: number;
  total: number;
  mismatches: string[];
}

export interface RowComparison {
  key: string;
  generated: SbslRow;
  expected: SbslRow | null;
  differences: Record<string, { generated: any; expected: any }>;
  isMatch: boolean;
  isNewRecord: boolean;
}

export interface ComparisonResult {
  totalRecords: number;
  matchedRecords: number;
  partialMatches: number;
  newRecords: number;
  matchPercentage: number;
  columnStats: Record<string, ColumnStats>;
  rowComparisons: RowComparison[];
  worstColumns: Array<{ column: string; matchRate: number; mismatches: number }>;
}

/**
 * Compare generated output against desired/expected output
 * Returns detailed comparison with green/red scoring for each cell
 */
export const compareOutputs = (
  generated: SbslRow[],
  desired: SbslRow[],
  keyFields: string[] = ['ULI', 'Address', 'City']
): ComparisonResult => {
  const startTime = Date.now();
  logInfo('ETL:Compare', 'Starting output comparison', {
    generatedRows: generated.length,
    desiredRows: desired.length
  });

  // Build lookup from desired output using multiple key strategies
  const desiredByULI = new Map<string, SbslRow>();
  const desiredByAddress = new Map<string, SbslRow>();
  const desiredByLoanNum = new Map<string, SbslRow>();

  desired.forEach(row => {
    const uli = String(row.ULI || row['Universal Loan Identifier'] || '').trim().toUpperCase();
    const address = String(row.Address || row['Street Address'] || '').trim().toLowerCase();
    const city = String(row.City || row['Property City'] || '').trim().toLowerCase();
    const loanNum = String(row.ApplNumb || row['Loan Number'] || row.LoanNumber || '').trim();

    if (uli) desiredByULI.set(uli, row);
    if (address && city) desiredByAddress.set(`${address}|${city}`, row);
    if (loanNum) desiredByLoanNum.set(loanNum, row);
  });

  const rowComparisons: RowComparison[] = [];
  const columnStats: Record<string, ColumnStats> = {};
  let matchedRecords = 0;
  let partialMatches = 0;
  let newRecords = 0;

  // Compare each generated row against desired output
  generated.forEach((genRow, idx) => {
    const uli = String(genRow.ULI || genRow['Universal Loan Identifier'] || '').trim().toUpperCase();
    const address = String(genRow.Address || genRow['Street Address'] || '').trim().toLowerCase();
    const city = String(genRow.City || genRow['Property City'] || '').trim().toLowerCase();
    const loanNum = String(genRow.ApplNumb || genRow['Loan Number'] || genRow.LoanNumber || '').trim();

    // Try to find matching expected row using multiple keys
    const expRow = desiredByULI.get(uli) ||
                   desiredByAddress.get(`${address}|${city}`) ||
                   desiredByLoanNum.get(loanNum);

    const key = uli || `${address}|${city}` || loanNum || `row-${idx}`;
    const differences: Record<string, { generated: any; expected: any }> = {};

    if (expRow) {
      // Compare each column
      const allColumns = new Set([...Object.keys(genRow), ...Object.keys(expRow)]);

      allColumns.forEach(col => {
        // Skip internal/metadata columns
        if (col.startsWith('_') || col === 'BorrowerFullName') return;

        const genVal = normalizeValue(genRow[col]);
        const expVal = normalizeValue(expRow[col]);

        if (!columnStats[col]) {
          columnStats[col] = { matches: 0, total: 0, mismatches: [] };
        }
        columnStats[col].total++;

        if (genVal === expVal) {
          columnStats[col].matches++;
        } else {
          columnStats[col].mismatches.push(key);
          differences[col] = { generated: genRow[col], expected: expRow[col] };
        }
      });
    }

    const isMatch = Object.keys(differences).length === 0;
    const isNewRecord = !expRow;

    if (isMatch && expRow) {
      matchedRecords++;
    } else if (expRow && Object.keys(differences).length <= 5) {
      partialMatches++;
    }
    if (isNewRecord) {
      newRecords++;
    }

    rowComparisons.push({
      key,
      generated: genRow,
      expected: expRow ?? null,
      differences,
      isMatch: isMatch && !isNewRecord,
      isNewRecord
    });
  });

  // Calculate worst columns (lowest match rate)
  const worstColumns = Object.entries(columnStats)
    .filter(([_, stats]) => stats.total > 0)
    .map(([column, stats]) => ({
      column,
      matchRate: stats.total > 0 ? (stats.matches / stats.total) * 100 : 100,
      mismatches: stats.total - stats.matches
    }))
    .filter(c => c.mismatches > 0)
    .sort((a, b) => a.matchRate - b.matchRate)
    .slice(0, 20);

  const result: ComparisonResult = {
    totalRecords: generated.length,
    matchedRecords,
    partialMatches,
    newRecords,
    matchPercentage: generated.length > 0 ? (matchedRecords / generated.length) * 100 : 0,
    columnStats,
    rowComparisons,
    worstColumns
  };

  const duration = Date.now() - startTime;
  logInfo('ETL:Compare', 'Comparison complete', {
    duration,
    matchedRecords,
    partialMatches,
    newRecords,
    totalColumns: Object.keys(columnStats).length,
    worstColumnsCount: worstColumns.length
  });

  return result;
};

/**
 * Normalize values for comparison (handle different formats)
 */
const normalizeValue = (value: any): string => {
  if (value === null || value === undefined || value === '') return '';

  const strVal = String(value).trim();

  // Normalize numbers (remove trailing zeros after decimal)
  if (/^\d+\.?\d*$/.test(strVal)) {
    const num = parseFloat(strVal);
    if (!isNaN(num)) {
      // For whole numbers, return as integer string
      if (Number.isInteger(num)) return String(Math.round(num));
      // For decimals, limit to 4 decimal places and remove trailing zeros
      return parseFloat(num.toFixed(4)).toString();
    }
  }

  // Normalize dates (convert to consistent format)
  if (/^\d{1,2}\/\d{1,2}\/\d{2,4}$/.test(strVal)) {
    const parts = strVal.split('/');
    const month = parseInt(parts[0]);
    const day = parseInt(parts[1]);
    const year = parts[2].length === 2 ? '20' + parts[2] : parts[2];
    return `${month}/${day}/${year.slice(-2)}`;
  }

  return strVal.toUpperCase();
};

/**
 * Export comparison report as Excel with multiple sheets
 */
export const exportComparisonReport = (
  generated: SbslRow[],
  desired: SbslRow[],
  comparison: ComparisonResult,
  filename?: string
): void => {
  logInfo('ETL:Export', 'Exporting comparison report');

  // Sheet 1: Generated Output
  const generatedWs = utils.json_to_sheet(generated);

  // Sheet 2: Desired Output
  const desiredWs = utils.json_to_sheet(desired);

  // Sheet 3: Diff Report
  const diffData = comparison.rowComparisons.map(row => {
    const diffRecord: Record<string, any> = {
      'Match Key': row.key,
      'Status': row.isNewRecord ? 'NEW RECORD' : row.isMatch ? 'MATCH' : 'MISMATCH',
      'Differences Count': Object.keys(row.differences).length,
      'Mismatched Columns': Object.keys(row.differences).join(', ')
    };

    // Add first few differences
    Object.entries(row.differences).slice(0, 5).forEach(([col, diff], i) => {
      diffRecord[`Diff ${i + 1} Column`] = col;
      diffRecord[`Diff ${i + 1} Generated`] = diff.generated;
      diffRecord[`Diff ${i + 1} Expected`] = diff.expected;
    });

    return diffRecord;
  });
  const diffWs = utils.json_to_sheet(diffData);

  // Sheet 4: Column Stats
  const columnStatsData = comparison.worstColumns.map(col => ({
    'Column': col.column,
    'Match Rate': `${col.matchRate.toFixed(1)}%`,
    'Mismatches': col.mismatches,
    'Status': col.matchRate === 100 ? 'PASS' : col.matchRate >= 90 ? 'WARN' : 'FAIL'
  }));
  const statsWs = utils.json_to_sheet(columnStatsData);

  // Sheet 5: Summary
  const summaryData = [{
    'Total Generated Records': comparison.totalRecords,
    'Exact Matches': comparison.matchedRecords,
    'Partial Matches (<=5 diffs)': comparison.partialMatches,
    'New Records (no match found)': comparison.newRecords,
    'Overall Match Rate': `${comparison.matchPercentage.toFixed(1)}%`,
    'Columns Compared': Object.keys(comparison.columnStats).length,
    'Columns with Issues': comparison.worstColumns.length,
    'Generated Date': new Date().toISOString()
  }];
  const summaryWs = utils.json_to_sheet(summaryData);

  const wb = utils.book_new();
  utils.book_append_sheet(wb, generatedWs, 'Generated Output');
  utils.book_append_sheet(wb, desiredWs, 'Desired Output');
  utils.book_append_sheet(wb, diffWs, 'Diff Report');
  utils.book_append_sheet(wb, statsWs, 'Column Stats');
  utils.book_append_sheet(wb, summaryWs, 'Summary');

  const now = new Date();
  const defaultFilename = `Comparison_Report_${now.toISOString().slice(0, 10)}.xlsx`;

  writeFile(wb, filename || defaultFilename);
};

// Legacy compatibility exports
export const filterByCurrentMonth = (data: SbslRow[]): { filtered: SbslRow[], count: number } => {
  return { filtered: data, count: data.length };
};

export const generateSummaryStats = (data: SbslRow[]) => {
  const totalLoanAmount = data.reduce((sum, row) => {
    const amount = parseFloat(String(findFieldValue(row, 'LoanAmount') || 0));
    return sum + (isNaN(amount) ? 0 : amount);
  }, 0);

  return {
    totalRecords: data.length,
    totalLoanAmount,
    avgLoanAmount: data.length > 0 ? totalLoanAmount / data.length : 0
  };
};

export const transformEncompassData = (data: SbslRow[]): SbslRow[] => data;
export const cleanAndFormatData = (data: SbslRow[]): SbslRow[] => autoCorrectData(data);

// Mock data for demo
export const MOCK_SBSL_DATA: SbslRow[] = [
  {
    ApplNumb: "114030351",
    LastName: "Bozeman",
    FirstName: "Marcus",
    LoanType: "02",
    Action: "1",
    LoanAmount: 120000,
    ApplDate: "1/7/25",
    ActionDate: "3/5/25",
    Address: "285 Whittington Rd",
    City: "Omega",
    State_abrv: "GA",
    Zip: "31775",
    Branch: "209",
    BranchName: "Fitzgerald",
    InterestRate: "7.740",
    APR: "8.588"
  }
];
