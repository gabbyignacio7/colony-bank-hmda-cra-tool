import { read, utils, writeFile } from 'xlsx';
import { BRANCH_LIST } from './cra-wiz-transform';

export interface SbslRow {
  // Legacy fields
  ApplNumb?: string;
  'Last Name'?: string;
  'Loan Type'?: string;
  'Action Taken'?: string;
  'Loan Amount'?: number;
  'Note Date'?: string | number | Date;
  Revenue?: number;
  Affiliate?: string;
  Address?: string;
  City?: string;
  State?: string;
  Zip?: string;
  Comment?: string;

  // HMDA Fields
  Loan_Number?: string;
  Application_Date?: string;
  Action_Date?: string;
  Loan_Type?: string;
  Loan_Purpose?: string;
  Action?: string;
  Preapproval?: string;
  LastName?: string;
  FirstName?: string;
  Coa_LastName?: string;
  Coa_FirstName?: string;
  Property_Street?: string;
  Property_City?: string;
  Property_State?: string;
  Property_Zip?: string;
  County_Code?: string;
  Census_Tract?: string;
  Loan_Amount?: number;
  Interest_Rate?: number;
  Income?: number;
  Ethnicity_1?: string;
  Race_1?: string;
  Sex?: string;
  Age?: number;
  Coa_Age?: number;
  Credit_Score?: number;
  Coa_Credit_Score?: number;
  
  // Branch fields
  Branch?: string;
  BranchNumb?: string;
  BranchName?: string;
  'Branch Name'?: string;
  
  // Supplemental fields
  Lender?: string;
  LDP_PostCloser?: string;
  APR?: string | number;
  Rate_Lock_Date?: string;
  RateType?: string;
  LoanProgram?: string;
  
  // Additional fields
  ApplDate?: string;
  ActionDate?: string;
  LoanType?: string;
  Purpose?: string;
  ConstructionMethod?: string;
  OccupancyType?: string;
  LoanAmount?: number;
  
  // Allow any additional fields
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
  // Columns 1-10
  'BranchName',           // A - Branch name from VLOOKUP
  'Branch',               // B - Branch number
  'ApplNumb',             // C - Application/Loan number
  'LEI',                  // D - Legal Entity Identifier
  'ULI',                  // E - Universal Loan Identifier
  'LastName',             // F - Borrower last name
  'FirstName',            // G - Borrower first name
  'Coa_LastName',         // H - Co-applicant last name
  'Coa_FirstName',        // I - Co-applicant first name
  'Lender',               // J - Loan officer
  
  // Columns 11-20
  'AA_Processor',         // K - Loan processor
  'LDP_PostCloser',       // L - Post closer
  'Error_Made_By',        // M - Error tracking (blank initially)
  'ApplDate',             // N - Application date
  'LoanType',             // O - Loan type code
  'Purpose',              // P - Loan purpose code
  'ConstructionMethod',   // Q - Construction method
  'OccupancyType',        // R - Occupancy type
  'LoanAmount',           // S - Loan amount in dollars
  'Preapproval',          // T - Preapproval status
  
  // Columns 21-30
  'Action',               // U - Action taken code (1-8)
  'ActionDate',           // V - Action date
  'Address',              // W - Property street address
  'City',                 // X - Property city
  'State_abrv',           // Y - Property state (2-letter)
  'Zip',                  // Z - Property ZIP code
  'County_5',             // AA - County FIPS code (5 digits)
  'Tract_11',             // AB - Census tract (11 digits)
  'Ethnicity_1',          // AC - Applicant ethnicity 1
  'Ethnicity_2',          // AD - Applicant ethnicity 2
  
  // Columns 31-40
  'Ethnicity_3',          // AE - Applicant ethnicity 3
  'Ethnicity_4',          // AF - Applicant ethnicity 4
  'Ethnicity_5',          // AG - Applicant ethnicity 5
  'EthnicityOther',       // AH - Applicant ethnicity other
  'Coa_Ethnicity_1',      // AI - Co-applicant ethnicity 1
  'Coa_Ethnicity_2',      // AJ - Co-applicant ethnicity 2
  'Coa_Ethnicity_3',      // AK - Co-applicant ethnicity 3
  'Coa_Ethnicity_4',      // AL - Co-applicant ethnicity 4
  'Coa_Ethnicity_5',      // AM - Co-applicant ethnicity 5
  'Coa_EthnicityOther',   // AN - Co-applicant ethnicity other
  
  // Columns 41-50
  'Ethnicity_Determinant',      // AO - How ethnicity was collected
  'Coa_Ethnicity_Determinant',  // AP - How co-app ethnicity collected
  'Race_1',               // AQ - Applicant race 1
  'Race_2',               // AR - Applicant race 2
  'Race_3',               // AS - Applicant race 3
  'Race_4',               // AT - Applicant race 4
  'Race_5',               // AU - Applicant race 5
  'Race1_Other',          // AV - Applicant race other (AI/AN)
  'Race27_Other',         // AW - Applicant race other (Asian)
  'Race44_Other',         // AX - Applicant race other (PI)
  
  // Columns 51-60
  'CoaRace_1',            // AY - Co-applicant race 1
  'CoaRace_2',            // AZ - Co-applicant race 2
  'CoaRace_3',            // BA - Co-applicant race 3
  'CoaRace_4',            // BB - Co-applicant race 4
  'CoaRace_5',            // BC - Co-applicant race 5
  'CoaRace1_Other',       // BD - Co-app race other (AI/AN)
  'CoaRace27_Other',      // BE - Co-app race other (Asian)
  'CoaRace44_Other',      // BF - Co-app race other (PI)
  'Race_Determinant',     // BG - How race was collected
  'CoaRace_Determinant',  // BH - How co-app race collected
  
  // Columns 61-70
  'Sex',                  // BI - Applicant sex
  'CoaSex',               // BJ - Co-applicant sex
  'Sex_Determinant',      // BK - How sex was collected
  'CoaSex_Determinant',   // BL - How co-app sex collected
  'Age',                  // BM - Applicant age
  'Coa_Age',              // BN - Co-applicant age (9999 if none)
  'Income',               // BO - Income in thousands
  'Purchaser',            // BP - Purchaser type
  'Rate_Spread',          // BQ - Rate spread
  'HOEPA_Status',         // BR - HOEPA status
  
  // Columns 71-80
  'Lien_Status',          // BS - Lien status
  'CreditScore',          // BT - Applicant credit score
  'Coa_CreditScore',      // BU - Co-app credit score (9999 if none)
  'CreditModel',          // BV - Credit score model
  'CreditModelOther',     // BW - Credit model other
  'Coa_CreditModel',      // BX - Co-app credit model
  'Coa_CreditModelOther', // BY - Co-app credit model other
  'Denial1',              // BZ - Denial reason 1
  'Denial2',              // CA - Denial reason 2
  'Denial3',              // CB - Denial reason 3
  
  // Columns 81-90
  'Denial4',              // CC - Denial reason 4
  'DenialOther',          // CD - Denial reason other
  'TotalLoanCosts',       // CE - Total loan costs
  'TotalPtsAndFees',      // CF - Total points and fees
  'OrigFees',             // CG - Origination fees
  'DiscountPts',          // CH - Discount points
  'LenderCredts',         // CI - Lender credits
  'InterestRate',         // CJ - Interest rate
  'APR',                  // CK - Annual percentage rate
  'Rate_Lock_Date',       // CL - Rate lock date
  
  // Columns 91-100
  'PPPTerm',              // CM - Prepayment penalty term
  'DTIRatio',             // CN - Debt-to-income ratio
  'DSC',                  // CO - Debt service coverage (blank)
  'CLTV',                 // CP - Combined LTV
  'Loan_Term',            // CQ - Loan term in years
  'Loan_Term_Months',     // CR - Loan term in months
  'IntroRatePeriod',      // CS - Introductory rate period
  'BalloonPMT',           // CT - Balloon payment
  'IOPMT',                // CU - Interest-only payment
  'NegAM',                // CV - Negative amortization
  
  // Columns 101-110
  'NonAmortz',            // CW - Non-amortizing features
  'PropertyValue',        // CX - Property value
  'MHSecPropType',        // CY - Manufactured home secured prop type
  'MHLandPropInt',        // CZ - Manufactured home land prop interest
  'TotalUnits',           // DA - Total dwelling units
  'MFAHU',                // DB - Multifamily affordable units
  'APPMethod',            // DC - Application method
  'PayableInst',          // DD - Payable to institution
  'NMLSRID',              // DE - NMLS ID
  'AUSystem1',            // DF - Automated underwriting system 1
  
  // Columns 111-120
  'AUSystem2',            // DG - AUS 2
  'AUSystem3',            // DH - AUS 3
  'AUSystem4',            // DI - AUS 4
  'AUSystem5',            // DJ - AUS 5
  'AUSystemOther',        // DK - AUS other
  'AUSResult1',           // DL - AUS result 1
  'AUSResult2',           // DM - AUS result 2
  'AUSResult3',           // DN - AUS result 3
  'AUSResult4',           // DO - AUS result 4
  'AUSResult5',           // DP - AUS result 5
  
  // Columns 121-128
  'AUSResultOther',       // DQ - AUS result other
  'REVMTG',               // DR - Reverse mortgage
  'OpenLOC',              // DS - Open-end line of credit
  'BUSCML',               // DT - Business or commercial purpose
  'RateType',             // DU - Rate type (Fixed/Variable)
  'Var_Term',             // DV - Variable rate term
  'LoanProgram',          // DW - Loan program
  'ProductType'           // DX - Product type
];

// LaserPro field position mapping (tilde-delimited)
const LASERPRO_FIELD_MAP: Record<number, string> = {
  0: 'ApplNumb',
  1: 'ApplDate',
  2: 'LoanType',
  3: 'Purpose',
  4: 'Action',
  5: 'ActionDate',
  11: 'Preapproval',
  14: 'BorrowerFullName',  // Combined first + last
  15: 'LastName',
  16: 'Address',
  17: 'City',
  18: 'State_abrv',
  19: 'Zip',
  20: 'County_5',
  21: 'Tract_11',
  22: 'LoanAmount',
  23: 'Income',
  // Add more positions as needed based on actual LaserPro export format
};

/**
 * Convert Excel serial date to M/D/YY format
 */
export const excelDateToString = (value: any): string => {
  if (!value) return '';
  
  // If already a string that looks like a date, return it
  if (typeof value === 'string' && (value.includes('/') || value.includes('-'))) {
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
 * Detect if a cell value contains delimited data
 */
export const detectDelimiterInValue = (value: any): string | null => {
  if (!value || typeof value !== 'string') return null;
  
  const str = String(value);
  const delimiters = [
    { char: '~', name: 'tilde' },
    { char: '|', name: 'pipe' },
    { char: '\t', name: 'tab' }
  ];
  
  for (const { char } of delimiters) {
    const regex = char === '|' ? /\|/g : new RegExp(char, 'g');
    const matches = str.match(regex);
    // If 10+ occurrences, it's delimited data stuck in one cell
    if (matches && matches.length >= 10) {
      return char;
    }
  }
  return null;
};

/**
 * Split delimited data that's stuck in a single cell
 */
export const splitDelimitedRow = (
  row: Record<string, any>,
  targetColumns: string[]
): Record<string, any> => {
  // Check each cell for delimited data
  for (const [key, value] of Object.entries(row)) {
    const delimiter = detectDelimiterInValue(value);
    if (delimiter) {
      // Split the delimited string
      const values = String(value).split(delimiter);
      // Map to target columns
      const newRow: Record<string, any> = {};
      targetColumns.forEach((col, index) => {
        newRow[col] = values[index] !== undefined ? values[index] : '';
      });
      return newRow;
    }
  }
  return row; // Return original if no delimited data found
};

/**
 * Parse LaserPro text file (tilde-delimited)
 */
export const parseLaserProFile = (content: string): SbslRow[] => {
  const lines = content.split('\n');
  const results: SbslRow[] = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    // Skip metadata row (row 1) - pipe-delimited with "Colony Bank"
    if (i === 0 && (line.includes('|') && line.includes('Colony Bank')) || line.startsWith('1|')) {
      console.log('Skipping LaserPro metadata row');
      continue;
    }
    
    // Parse tilde-delimited data
    const values = line.split('~');
    
    // Map to columns using LASERPRO_FIELD_MAP
    const row: SbslRow = {};
    Object.entries(LASERPRO_FIELD_MAP).forEach(([position, fieldName]) => {
      const index = parseInt(position);
      if (values[index] !== undefined) {
        row[fieldName] = values[index];
      }
    });
    
    // Also store all values by index for unmapped fields
    values.forEach((val, idx) => {
      if (!Object.values(LASERPRO_FIELD_MAP).some((_, i) => parseInt(Object.keys(LASERPRO_FIELD_MAP)[i]) === idx)) {
        row[`Field_${idx}`] = val;
      }
    });
    
    results.push(row);
  }
  
  return results;
};

/**
 * Parse Encompass Excel file
 */
export const parseEncompassFile = (worksheet: any[][]): SbslRow[] => {
  // Skip rows with metadata indicators
  const metadataIndicators = [
    'Financial Institution Name',
    'Calendar Year',
    'Calendar Quarter',
    'Contact Person',
    'Colony Bank'
  ];
  
  let dataStartRow = 0;
  for (let i = 0; i < Math.min(5, worksheet.length); i++) {
    const row = worksheet[i];
    const firstCell = String(row?.[0] || '');
    if (metadataIndicators.some(ind => firstCell.includes(ind))) {
      dataStartRow = i + 1;
    }
  }
  
  // Find actual header row
  let headerRow = dataStartRow;
  for (let i = dataStartRow; i < Math.min(dataStartRow + 3, worksheet.length); i++) {
    const row = worksheet[i];
    // Look for row that has typical header names
    if (row && row.some((cell: any) => 
      String(cell).includes('Loan') || 
      String(cell).includes('Applicant') ||
      String(cell).includes('Property')
    )) {
      headerRow = i;
      break;
    }
  }
  
  const headers = worksheet[headerRow] || [];
  const dataRows = worksheet.slice(headerRow + 1);
  
  return dataRows.map(row => {
    const obj: SbslRow = {};
    headers.forEach((header: string, index: number) => {
      if (header && row[index] !== undefined) {
        obj[String(header).trim()] = row[index];
      }
    });
    return obj;
  }).filter(row => Object.keys(row).length > 0);
};

/**
 * Field mapping helper - finds value from various possible field names
 */
export const findFieldValue = (row: Record<string, any>, targetField: string): any => {
  // Direct match
  if (row[targetField] !== undefined) return row[targetField];
  
  // Check common variations
  const variations: Record<string, string[]> = {
    'BranchName': ['BranchName', 'Branch Name', 'BRANCHNAME', 'Branch_Name'],
    'Branch': ['Branch', 'BranchNumb', 'BRANCHNUMB', 'Branch_Number'],
    'ApplNumb': ['ApplNumb', 'Loan_Number', 'LoanNumber', 'Application_Number', 'ULI'],
    'LastName': ['LastName', 'Last Name', 'Borrower_Last_Name', 'LASTNAME', 'Last_Name'],
    'FirstName': ['FirstName', 'First Name', 'Borrower_First_Name', 'FIRSTNAME', 'First_Name'],
    'LoanAmount': ['LoanAmount', 'Loan Amount', 'Loan_Amount', 'LOANAMOUNTINDOLLARS'],
    'Address': ['Address', 'Property_Street', 'PropertyStreet', 'ADDRESS', 'Property_Address'],
    'City': ['City', 'Property_City', 'PropertyCity', 'CITY'],
    'State_abrv': ['State_abrv', 'State', 'Property_State', 'STATE_ABRV', 'State_Abrv'],
    'Zip': ['Zip', 'Property_Zip', 'PropertyZip', 'ZipCode', 'ZIP', 'Zip_Code'],
    'County_5': ['County_5', 'County', 'County_Code', 'COUNTY_5'],
    'Tract_11': ['Tract_11', 'Census_Tract', 'Tract', 'TRACT_11'],
    'InterestRate': ['InterestRate', 'Interest_Rate', 'Interest Rate', 'INTERESTRATE'],
    'Income': ['Income', 'Income_Thousands', 'INCOME'],
    'CreditScore': ['CreditScore', 'Credit_Score', 'CREDITSCORE'],
    'ApplDate': ['ApplDate', 'Application_Date', 'ApplicationDate', 'APPLDATE'],
    'ActionDate': ['ActionDate', 'Action_Date', 'ACTIONDATE'],
    'Action': ['Action', 'Action_Taken', 'ActionTaken', 'ACTION'],
    'LoanType': ['LoanType', 'Loan_Type', 'LOANTYPE'],
    'Purpose': ['Purpose', 'Loan_Purpose', 'PURPOSE'],
    'Lender': ['Lender', 'Loan_Officer', 'LENDER'],
    'APR': ['APR', 'Annual_Percentage_Rate'],
    'Rate_Lock_Date': ['Rate_Lock_Date', 'RateLockDate', 'Rate Lock Date'],
  };
  
  const possibleNames = variations[targetField] || [targetField];
  for (const name of possibleNames) {
    if (row[name] !== undefined) return row[name];
    // Also try uppercase/lowercase variations
    if (row[name.toUpperCase()] !== undefined) return row[name.toUpperCase()];
    if (row[name.toLowerCase()] !== undefined) return row[name.toLowerCase()];
  }
  
  return '';
};

/**
 * Merge supplemental data with primary data (VLOOKUP)
 */
export const mergeSupplementalData = (primaryData: SbslRow[], supplementalData: SbslRow[]): SbslRow[] => {
  if (!supplementalData || supplementalData.length === 0) {
    return primaryData;
  }
  
  // Create lookup map from supplemental data
  const suppMap = new Map<string, SbslRow>();
  supplementalData.forEach(row => {
    const key = String(row.Loan_Number || row.ApplNumb || row.LoanNumber || '').trim();
    if (key) {
      suppMap.set(key, row);
    }
  });
  
  // Merge supplemental fields into primary data
  return primaryData.map(row => {
    const key = String(row.ApplNumb || row.Loan_Number || row.LoanNumber || '').trim();
    const supp = suppMap.get(key);
    
    if (supp) {
      return {
        ...row,
        Lender: supp.Lender || row.Lender,
        LDP_PostCloser: supp['Post Closer'] || supp.LDP_PostCloser || row.LDP_PostCloser,
        APR: supp.APR || row.APR,
        Rate_Lock_Date: supp['Rate Lock Date'] || supp.Rate_Lock_Date || row.Rate_Lock_Date,
        LoanProgram: supp['Loan Program'] || supp.LoanProgram || row.LoanProgram,
        RateType: supp['Rate Type'] || supp.RateType || row.RateType,
      };
    }
    
    return row;
  });
};

/**
 * Transform data to CRA Wiz 128-column format
 */
export const transformToCRAWizFormat = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    // Check for delimited data and split if necessary
    const processedRow = splitDelimitedRow(row, CRA_WIZ_128_COLUMNS);
    
    // Map to output columns in exact order
    const output: SbslRow = {};
    CRA_WIZ_128_COLUMNS.forEach(col => {
      output[col] = findFieldValue(processedRow, col) || '';
    });
    
    // Apply branch VLOOKUP
    const branchNum = String(output['Branch'] || processedRow['Branch'] || processedRow['BranchNumb'] || '').trim();
    if (!output['BranchName'] || String(output['BranchName']).trim() === '') {
      output['BranchName'] = BRANCH_LIST[branchNum] || '';
    }
    
    // Set default values for blank required columns
    if (!output['Error_Made_By']) output['Error_Made_By'] = '';
    if (!output['DSC']) output['DSC'] = '';
    
    // Handle co-applicant defaults
    if (!output['Coa_Age'] || output['Coa_Age'] === '') output['Coa_Age'] = '9999';
    if (!output['Coa_CreditScore'] || output['Coa_CreditScore'] === '') output['Coa_CreditScore'] = '9999';
    
    return output;
  });
};

/**
 * Validate HMDA data with errors AND warnings
 */
export const validateData = (data: SbslRow[]): ValidationResult[] => {
  return data.map(row => {
    const applNumb = String(row.ApplNumb || row.Loan_Number || '-');
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoCorrected: Record<string, { from: any; to: any }> = {};
    
    // 1. Census Tract validation: Must be ##.## or ####.##
    const tract = row.Tract_11 || row.Census_Tract || row.TRACT_11;
    if (tract && !/^\d{2,4}\.\d{2}$/.test(String(tract))) {
      const corrected = formatCensusTract(tract);
      if (corrected) {
        autoCorrected['Census_Tract'] = { from: tract, to: corrected };
      } else {
        errors.push(`Census Tract format invalid: ${tract} (expected ##.## or ####.##)`);
      }
    }
    
    // 2. Interest Rate validation: 0-20%
    const rate = parseFloat(String(row.InterestRate || row.Interest_Rate || row.INTERESTRATE || 0));
    if (!isNaN(rate) && rate > 0) {
      if (rate < 0 || rate > 20) {
        errors.push(`Interest Rate out of bounds: ${rate}% (must be 0-20%)`);
      }
    }
    
    // 3. Income validation: 1-9999 thousands
    const income = parseInt(String(row.Income || row.INCOME || 0));
    if (!isNaN(income) && income > 0) {
      if (income < 1 || income > 9999) {
        warnings.push(`Income value unusual: ${income} (expected 1-9999 thousands)`);
      }
    }
    
    // 4. Action Taken Code validation: Must be 1-8
    const action = parseInt(String(row.Action || row.ACTION || row.Action_Taken || 0));
    if (!isNaN(action) && action > 0) {
      if (![1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
        errors.push(`Invalid Action Taken Code: ${action} (must be 1-8)`);
      }
    }
    
    // 5. State validation: 2-letter code
    const state = row.State_abrv || row.State || row.STATE_ABRV || row.Property_State;
    if (state && String(state).length !== 2) {
      const corrected = String(state).trim().toUpperCase().substring(0, 2);
      autoCorrected['State'] = { from: state, to: corrected };
    }
    
    // 6. County validation: 5 digits
    const county = row.County_5 || row.County || row.COUNTY_5;
    if (county) {
      const padded = String(county).padStart(5, '0');
      if (padded !== String(county)) {
        autoCorrected['County'] = { from: county, to: padded };
      }
    }
    
    // 7. Loan Amount validation
    const loanAmt = parseFloat(String(row.LoanAmount || row.Loan_Amount || row.LOANAMOUNTINDOLLARS || 0));
    if (loanAmt <= 0) {
      warnings.push('Loan Amount is zero or missing');
    }
    
    // 8. Date format validation
    const dateFields = ['ApplDate', 'ActionDate', 'Rate_Lock_Date'];
    dateFields.forEach(field => {
      const value = row[field];
      if (value && typeof value === 'number' && value > 40000 && value < 50000) {
        // Excel serial number detected
        autoCorrected[field] = { from: value, to: excelDateToString(value) };
      }
    });
    
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
 * Format census tract to ##.## or ####.## format
 */
const formatCensusTract = (value: any): string | null => {
  const str = String(value).replace(/[^\d.]/g, '');
  
  // Already correct format
  if (/^\d{2,4}\.\d{2}$/.test(str)) return str;
  
  // Try to fix common issues
  const match = str.match(/^(\d{2,4})\.?(\d{2})$/);
  if (match) {
    return `${match[1]}.${match[2]}`;
  }
  
  return null;
};

/**
 * Auto-correct common validation issues
 */
export const autoCorrectData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const corrected = { ...row };
    
    // Census Tract formatting
    const tract = row.Tract_11 || row.Census_Tract;
    if (tract) {
      const formatted = formatCensusTract(tract);
      if (formatted) {
        corrected.Tract_11 = formatted;
        corrected.Census_Tract = formatted;
      }
    }
    
    // State abbreviation
    const state = row.State_abrv || row.State || row.Property_State;
    if (state && String(state).length !== 2) {
      const abbr = String(state).trim().toUpperCase().substring(0, 2);
      corrected.State_abrv = abbr;
      corrected.State = abbr;
    }
    
    // County padding
    const county = row.County_5 || row.County;
    if (county) {
      corrected.County_5 = String(county).padStart(5, '0');
    }
    
    // Date formatting
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      if (row[field] && typeof row[field] === 'number') {
        corrected[field] = excelDateToString(row[field]);
      }
    });
    
    // Interest rate formatting
    const rate = row.InterestRate || row.Interest_Rate;
    if (rate) {
      const numRate = parseFloat(String(rate).replace('%', ''));
      if (!isNaN(numRate)) {
        corrected.InterestRate = numRate.toFixed(3);
      }
    }
    
    return corrected;
  });
};

/**
 * Export CRA Wiz 128-column format (Phase 1)
 */
export const exportCRAWizFormat = (data: SbslRow[]): void => {
  // Transform to 128-column format
  const transformedData = transformToCRAWizFormat(data);
  
  // Create worksheet with exact headers
  const ws = utils.json_to_sheet(transformedData, {
    header: CRA_WIZ_128_COLUMNS
  });
  
  // Create workbook
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, 'CRA Data');
  
  // Generate filename
  const now = new Date();
  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June',
                      'July', 'August', 'September', 'October', 'November', 'December'];
  const filename = `CRA_Wiz_Upload_${monthNames[now.getMonth()]}_${now.getFullYear()}.xlsx`;
  
  // Download
  writeFile(wb, filename);
};

/**
 * Process uploaded file
 */
export const processFile = async (file: File): Promise<SbslRow[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    const fileName = file.name.toLowerCase();
    
    reader.onload = (e) => {
      try {
        if (fileName.endsWith('.txt')) {
          // LaserPro text file
          const content = e.target?.result as string;
          resolve(parseLaserProFile(content));
        } else {
          // Excel file
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = read(data, { type: 'array' });
          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          
          // Get as array of arrays for Encompass parsing
          const rows = utils.sheet_to_json(worksheet, { header: 1 }) as any[][];
          
          // Check if it's Encompass format (has metadata rows)
          const firstCell = String(rows[0]?.[0] || '');
          if (firstCell.includes('Financial Institution') || 
              firstCell.includes('Calendar') || 
              firstCell.includes('Colony Bank')) {
            resolve(parseEncompassFile(rows));
          } else {
            // Standard Excel - use default parsing
            const jsonData = utils.sheet_to_json(worksheet) as SbslRow[];
            resolve(jsonData);
          }
        }
      } catch (error) {
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

/**
 * Fetch and parse CSV file from URL
 */
export const fetchCsvFile = async (url: string): Promise<SbslRow[]> => {
  try {
    const response = await fetch(url);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];
    return utils.sheet_to_json(worksheet) as SbslRow[];
  } catch (error) {
    console.error('Failed to fetch CSV:', error);
    return [];
  }
};

// Legacy functions for compatibility
export const filterByCurrentMonth = (data: SbslRow[]): SbslRow[] => data;
export const generateSummaryStats = (data: SbslRow[]) => {
  const totalLoanAmount = data.reduce((sum, row) => {
    const amount = parseFloat(String(row.LoanAmount || row.Loan_Amount || row['Loan Amount'] || 0));
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
