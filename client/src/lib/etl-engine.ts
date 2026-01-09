import { read, utils, writeFile } from 'xlsx';
import { BRANCH_LIST } from './cra-wiz-transform';

export interface SbslRow {
  [key: string]: any;
}

export interface ValidationResult {
  applNumb: string;
  isValid: boolean;
  errors: string[];
  warnings: string[];
  autoCorrected: Record<string, { from: any; to: any }>;
}

// Complete 128-Column CRA Wiz Format (Jonathan Hester's Exact Requirement)
export const CRA_WIZ_128_COLUMNS: string[] = [
  'BranchName', 'Branch', 'ApplNumb', 'LEI', 'ULI', 'LastName', 'FirstName',
  'Coa_LastName', 'Coa_FirstName', 'Lender', 'AA_Processor', 'LDP_PostCloser',
  'Error_Made_By', 'ApplDate', 'LoanType', 'Purpose', 'ConstructionMethod',
  'OccupancyType', 'LoanAmount', 'Preapproval', 'Action', 'ActionDate',
  'Address', 'City', 'State_abrv', 'Zip', 'County_5', 'Tract_11',
  'Ethnicity_1', 'Ethnicity_2', 'Ethnicity_3', 'Ethnicity_4', 'Ethnicity_5',
  'EthnicityOther', 'Coa_Ethnicity_1', 'Coa_Ethnicity_2', 'Coa_Ethnicity_3',
  'Coa_Ethnicity_4', 'Coa_Ethnicity_5', 'Coa_EthnicityOther',
  'Ethnicity_Determinant', 'Coa_Ethnicity_Determinant',
  'Race_1', 'Race_2', 'Race_3', 'Race_4', 'Race_5',
  'Race1_Other', 'Race27_Other', 'Race44_Other',
  'CoaRace_1', 'CoaRace_2', 'CoaRace_3', 'CoaRace_4', 'CoaRace_5',
  'CoaRace1_Other', 'CoaRace27_Other', 'CoaRace44_Other',
  'Race_Determinant', 'CoaRace_Determinant',
  'Sex', 'CoaSex', 'Sex_Determinant', 'CoaSex_Determinant',
  'Age', 'Coa_Age', 'Income', 'Purchaser', 'Rate_Spread', 'HOEPA_Status',
  'Lien_Status', 'CreditScore', 'Coa_CreditScore', 'CreditModel',
  'CreditModelOther', 'Coa_CreditModel', 'Coa_CreditModelOther',
  'Denial1', 'Denial2', 'Denial3', 'Denial4', 'DenialOther',
  'TotalLoanCosts', 'TotalPtsAndFees', 'OrigFees', 'DiscountPts',
  'LenderCredts', 'InterestRate', 'APR', 'Rate_Lock_Date',
  'PPPTerm', 'DTIRatio', 'DSC', 'CLTV', 'Loan_Term', 'Loan_Term_Months',
  'IntroRatePeriod', 'BalloonPMT', 'IOPMT', 'NegAM', 'NonAmortz',
  'PropertyValue', 'MHSecPropType', 'MHLandPropInt', 'TotalUnits',
  'MFAHU', 'APPMethod', 'PayableInst', 'NMLSRID',
  'AUSystem1', 'AUSystem2', 'AUSystem3', 'AUSystem4', 'AUSystem5',
  'AUSystemOther', 'AUSResult1', 'AUSResult2', 'AUSResult3', 'AUSResult4',
  'AUSResult5', 'AUSResultOther',
  'REVMTG', 'OpenLOC', 'BUSCML', 'RateType', 'Var_Term', 'LoanProgram', 'ProductType'
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
    'LoanAmount': ['LoanAmount', 'Loan Amount', 'Loan Amount in Dollars', 'LOANAMOUNTINDOLLARS'],
    'Address': ['Address', 'Street Address', 'Property Address', 'Property Street', 'ADDRESS'],
    'City': ['City', 'Property City', 'CITY'],
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
    'BranchName': ['BranchName', 'Branch Name', 'BRANCHNAME'],
    'Branch': ['Branch', 'BranchNumb', 'Branch Number', 'BRANCHNUMB'],
    'LoanProgram': ['LoanProgram', 'Loan Program', 'LOANPROGRAM'],
    'RateType': ['RateType', 'Rate Type', 'RATETYPE'],
    'TotalUnits': ['TotalUnits', 'Total Units', 'TOTALUNITS'],
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
 * Transform data to CRA Wiz 128-column format
 */
export const transformToCRAWizFormat = (data: SbslRow[]): SbslRow[] => {
  console.log('=== TRANSFORMING TO CRA WIZ FORMAT ===');
  console.log('Input rows:', data.length);

  return data.map((row, idx) => {
    const output: SbslRow = {};

    CRA_WIZ_128_COLUMNS.forEach(col => {
      const value = findFieldValue(row, col);
      // IMPORTANT: Use nullish coalescing to preserve zeros
      output[col] = value ?? '';
    });

    // Branch name lookup
    const branchNum = String(output['Branch'] || findFieldValue(row, 'Branch') || '').trim();
    if (!output['BranchName'] || String(output['BranchName']).trim() === '') {
      output['BranchName'] = BRANCH_LIST[branchNum] || '';
    }

    // Add required blank fields
    if (!output['Error_Made_By']) output['Error_Made_By'] = '';
    if (!output['DSC']) output['DSC'] = '';

    // Default co-applicant values if empty
    if (!output['Coa_Age'] || String(output['Coa_Age']) === '') output['Coa_Age'] = '9999';
    if (!output['Coa_CreditScore'] || String(output['Coa_CreditScore']) === '') output['Coa_CreditScore'] = '9999';

    // Convert dates
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      if (output[field]) {
        output[field] = excelDateToString(output[field]);
      }
    });

    if (idx === 0) {
      console.log('First transformed row (first 10 keys):', Object.keys(output).slice(0, 10));
      console.log('First transformed row (first 10 values):', Object.values(output).slice(0, 10));
    }

    return output;
  });
};

/**
 * Merge supplemental data (Additional Fields file)
 */
export const mergeSupplementalData = (primaryData: SbslRow[], supplementalData: SbslRow[]): SbslRow[] => {
  if (!supplementalData || supplementalData.length === 0) {
    console.log('No supplemental data to merge');
    return primaryData;
  }

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

    // Try all possible Address field names
    const address = String(
      row['Address'] || row['Property Address'] || row['Street Address'] || row['Property Street'] || ''
    ).toLowerCase().trim();

    // Try all possible City field names
    const city = String(
      row['City'] || row['Property City'] || ''
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

    // Try all possible Address field names
    const address = String(
      row['Address'] || row['Property Address'] || row['Street Address'] || ''
    ).toLowerCase().trim();

    // Try all possible City field names
    const city = String(
      row['City'] || row['Property City'] || ''
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
      const postCloser = supp['LDP_PostCloser'] || supp['Post Closer'] || '';
      const apr = supp['APR'] || supp['Annual Percentage Rate'] || '';
      const rateLockDate = supp['Rate_Lock_Date'] || supp['Rate Lock Date'] || supp['Lock Date'] || '';
      const loanProgram = supp['LoanProgram'] || supp['Loan Program'] || '';
      const rateType = supp['RateType'] || supp['Rate Type'] || '';
      const branchName = supp['BranchName'] || supp['Branch Name'] || supp['Branch'] || '';

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
      };
    }

    return row;
  });

  console.log('Merge complete - matched', matchCount, 'of', primaryData.length, 'rows');
  return result;
};

/**
 * Validate HMDA data
 */
export const validateData = (data: SbslRow[]): ValidationResult[] => {
  return data.map(row => {
    const applNumb = String(row.ApplNumb || row.ULI || '-');
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoCorrected: Record<string, { from: any; to: any }> = {};

    // Census Tract validation - accept both formats
    const tract = findFieldValue(row, 'Tract_11');
    if (tract) {
      const tractStr = String(tract).trim();
      // Accept: 11 digits (FIPS), decimal format (####.##), NA, Exempt
      const isValidFIPS = /^\d{11}$/.test(tractStr);
      const isValidDecimal = /^\d{2,6}\.\d{2}$/.test(tractStr);
      const isValidSpecial = ['NA', 'Exempt', ''].includes(tractStr);

      if (!isValidFIPS && !isValidDecimal && !isValidSpecial) {
        warnings.push(`Census Tract format unusual: ${tract}`);
      }
    }

    // Interest Rate validation
    const rate = parseFloat(String(findFieldValue(row, 'InterestRate') || 0));
    if (!isNaN(rate) && rate > 0 && (rate < 0 || rate > 20)) {
      errors.push(`Interest Rate out of bounds: ${rate}% (must be 0-20%)`);
    }

    // Action code validation
    const action = parseInt(String(findFieldValue(row, 'Action') || 0));
    if (!isNaN(action) && action > 0 && ![1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
      errors.push(`Invalid Action Taken Code: ${action} (must be 1-8)`);
    }

    // Loan amount check
    const loanAmt = parseFloat(String(findFieldValue(row, 'LoanAmount') || 0));
    if (loanAmt <= 0) {
      warnings.push('Loan Amount is zero or missing');
    }

    return {
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
        reject(error);
      }
    };

    reader.onerror = () => reject(new Error('Failed to read file'));

    if (fileName.endsWith('.txt')) {
      reader.readAsText(file);
    } else {
      reader.readAsArrayBuffer(file);
    }
  });
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
