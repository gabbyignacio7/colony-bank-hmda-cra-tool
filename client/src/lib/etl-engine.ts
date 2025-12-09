import { read, utils, writeFile } from 'xlsx';

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
  
  // HMDA Test File Fields (from test data)
  Loan_Number?: string;
  Application_Date?: string | number | Date;
  Interest_Rate?: number;
  Loan_Term_Months?: number;
  Loan_Purpose_Code?: number;
  Property_Type_Code?: number;
  Loan_Type_Code?: number;
  Action_Taken_Code?: number;
  County_Code?: string;
  Census_Tract?: string;
  Borrower_Last_Name?: string;
  Borrower_First_Name?: string;
  Property_Street?: string;
  Property_City?: string;
  Property_State?: string;
  Property_Zip?: string;
  Income_Thousands?: number;
  Credit_Score?: number;
  Closing_Date?: string | number | Date;
  Applicant_Ethnicity?: number;
  Applicant_Race_1?: number;
  Applicant_Sex?: number;
  
  // Calculated Fields from Phase 2
  'Branch Name'?: string;
  'Branch'?: string;
  'Application Number'?: string;
  'Loan Term Years'?: number;
  'Customer Name'?: string;
  'Borrower Name Code'?: string;
  'Lender'?: string;
  'Lender Assistant'?: string;
  'Post Closer'?: string;
  'APR'?: string | number;
  'Rate Lock Date'?: string;
  'Rate Type'?: string;
  'Variable Term'?: string;
  'Loan Program'?: string;
  
  [key: string]: any;
}

export interface ValidationResult {
  rowIdx: number;
  applNumb: string;
  errors: string[];
}

// Mock Data for Demo (Updated with new fields)
export const MOCK_SBSL_DATA: SbslRow[] = [
  {
    ApplNumb: "2024-001",
    "Last Name": "Smith",
    "Loan Type": "Small Business",
    "Action Taken": "Originated",
    "Loan Amount": 75000,
    "Note Date": new Date().toISOString().split('T')[0],
    Revenue: 500000,
    Affiliate: "Main Branch",
    Address: "123 Main St",
    City: "Atlanta",
    State: "GA",
    Zip: "30301",
    "Branch": "001",
    "Branch Name": "Main Branch",
    "APR": "7.125",
    "Loan Term Years": 5
  },
  {
    ApplNumb: "2024-002",
    "Last Name": "Johnson",
    "Loan Type": "Commercial",
    "Action Taken": "Originated",
    "Loan Amount": 150000,
    "Note Date": "2023-12-15",
    Revenue: 1200000,
    Affiliate: "North Branch",
    Address: "456 Oak Rd",
    City: "Savannah",
    State: "GA",
    Zip: "31401",
    "Branch": "002",
    "Branch Name": "North Branch",
    "APR": "6.500",
    "Loan Term Years": 10
  },
];

export const fetchCsvFile = async (filename: string): Promise<SbslRow[]> => {
  try {
    const response = await fetch(`/sample_data/${filename}`);
    if (!response.ok) throw new Error(`Failed to fetch ${filename}`);
    const arrayBuffer = await response.arrayBuffer();
    const data = new Uint8Array(arrayBuffer);
    const workbook = read(data, { type: 'array' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    return utils.sheet_to_json(sheet) as SbslRow[];
  } catch (error) {
    console.error("Error fetching CSV:", error);
    throw error;
  }
};

export const processFile = async (file: File): Promise<any[]> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    // Handle text files - try to parse as pipe, tab, or comma delimited
    if (file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());
          
          if (lines.length > 0) {
            // Detect delimiter: check first line for pipe, tab, or comma
            const firstLine = lines[0];
            let delimiter = ',';
            let skipRows = 0;
            
            if (firstLine.split('|').length > 3) {
              delimiter = '|';
              // LaserPro format: Row 1 is metadata (1|Colony Bank|2025|...), skip it
              // Row 2 contains the actual data starting with record type "2"
              skipRows = 1;
              console.log('Detected pipe-delimited format (LaserPro), skipping metadata row');
            } else if (firstLine.split('\t').length > 1) {
              delimiter = '\t';
              console.log('Detected tab-delimited format');
            } else {
              console.log('Using comma-delimited format');
            }
            
            // For LaserPro, there's no header row - data starts with record type
            // We'll use positional column indices and map to our standard format
            if (delimiter === '|' && skipRows > 0) {
              // LaserPro pipe-delimited: parse all data rows (skip metadata row 1)
              const dataLines = lines.slice(skipRows);
              const data = dataLines.map((line, idx) => {
                const values = line.split(delimiter);
                // Map LaserPro positional fields to named fields
                // Position 0: Record Type, 1: LEI, 2: ULI, 3: ApplDate, etc.
                return {
                  _rowIndex: idx + skipRows + 1,
                  RecordType: values[0]?.trim() || '',
                  LEI: values[1]?.trim() || '',
                  ULI: values[2]?.trim() || '',
                  ApplDate: values[3]?.trim() || '',
                  LoanType: values[4]?.trim() || '',
                  Purpose: values[5]?.trim() || '',
                  Preapproval: values[6]?.trim() || '',
                  ConstructionMethod: values[7]?.trim() || '',
                  OccupancyType: values[8]?.trim() || '',
                  LoanAmount: values[9]?.trim() || '',
                  Action: values[10]?.trim() || '',
                  ActionDate: values[11]?.trim() || '',
                  Address: values[12]?.trim() || '',
                  City: values[13]?.trim() || '',
                  State_abrv: values[14]?.trim() || '',
                  Zip: values[15]?.trim() || '',
                  County_5: values[16]?.trim() || '',
                  Tract_11: values[17]?.trim() || '',
                  Ethnicity_1: values[18]?.trim() || '',
                  Ethnicity_2: values[19]?.trim() || '',
                  Ethnicity_3: values[20]?.trim() || '',
                  Ethnicity_4: values[21]?.trim() || '',
                  Ethnicity_5: values[22]?.trim() || '',
                  EthnicityOther: values[23]?.trim() || '',
                  Coa_Ethnicity_1: values[24]?.trim() || '',
                  Coa_Ethnicity_2: values[25]?.trim() || '',
                  Coa_Ethnicity_3: values[26]?.trim() || '',
                  Coa_Ethnicity_4: values[27]?.trim() || '',
                  Coa_Ethnicity_5: values[28]?.trim() || '',
                  Coa_EthnicityOther: values[29]?.trim() || '',
                  Ethnicity_Determinant: values[30]?.trim() || '',
                  Coa_Ethnicity_Determinant: values[31]?.trim() || '',
                  Race_1: values[32]?.trim() || '',
                  Race_2: values[33]?.trim() || '',
                  Race_3: values[34]?.trim() || '',
                  Race_4: values[35]?.trim() || '',
                  Race_5: values[36]?.trim() || '',
                  Race1_Other: values[37]?.trim() || '',
                  Race27_Other: values[38]?.trim() || '',
                  Race44_Other: values[39]?.trim() || '',
                  CoaRace_1: values[40]?.trim() || '',
                  CoaRace_2: values[41]?.trim() || '',
                  CoaRace_3: values[42]?.trim() || '',
                  CoaRace_4: values[43]?.trim() || '',
                  CoaRace_5: values[44]?.trim() || '',
                  CoaRace1_Other: values[45]?.trim() || '',
                  CoaRace27_Other: values[46]?.trim() || '',
                  CoaRace44_Other: values[47]?.trim() || '',
                  Race_Determinant: values[48]?.trim() || '',
                  CoaRace_Determinant: values[49]?.trim() || '',
                  Sex: values[50]?.trim() || '',
                  CoaSex: values[51]?.trim() || '',
                  Sex_Determinant: values[52]?.trim() || '',
                  CoaSex_Determinant: values[53]?.trim() || '',
                  Age: values[54]?.trim() || '',
                  Coa_Age: values[55]?.trim() || '',
                  Income: values[56]?.trim() || '',
                  Purchaser: values[57]?.trim() || '',
                  Rate_Spread: values[58]?.trim() || '',
                  HOEPA_Status: values[59]?.trim() || '',
                  Lien_Status: values[60]?.trim() || '',
                  CreditScore: values[61]?.trim() || '',
                  Coa_CreditScore: values[62]?.trim() || '',
                  CreditModel: values[63]?.trim() || '',
                  CreditModelOther: values[64]?.trim() || '',
                  Coa_CreditModel: values[65]?.trim() || '',
                  Coa_CreditModelOther: values[66]?.trim() || '',
                  Denial1: values[67]?.trim() || '',
                  Denial2: values[68]?.trim() || '',
                  Denial3: values[69]?.trim() || '',
                  Denial4: values[70]?.trim() || '',
                  DenialOther: values[71]?.trim() || '',
                  TotalLoanCosts: values[72]?.trim() || '',
                  TotalPtsAndFees: values[73]?.trim() || '',
                  OrigFees: values[74]?.trim() || '',
                  DiscountPts: values[75]?.trim() || '',
                  LenderCredts: values[76]?.trim() || '',
                  InterestRate: values[77]?.trim() || '',
                  APR: values[78]?.trim() || '',
                  Rate_Lock_Date: values[79]?.trim() || '',
                  PPPTerm: values[80]?.trim() || '',
                  DTIRatio: values[81]?.trim() || '',
                  CLTV: values[82]?.trim() || '',
                  Loan_Term: values[83]?.trim() || '',
                  IntroRatePeriod: values[84]?.trim() || '',
                  BalloonPMT: values[85]?.trim() || '',
                  IOPMT: values[86]?.trim() || '',
                  NegAM: values[87]?.trim() || '',
                  NonAmortz: values[88]?.trim() || '',
                  PropertyValue: values[89]?.trim() || '',
                  MHSecPropType: values[90]?.trim() || '',
                  MHLandPropInt: values[91]?.trim() || '',
                  TotalUnits: values[92]?.trim() || '',
                  MFAHU: values[93]?.trim() || '',
                  APPMethod: values[94]?.trim() || '',
                  PayableInst: values[95]?.trim() || '',
                  NMLSRID: values[96]?.trim() || '',
                  AUSystem1: values[97]?.trim() || '',
                  AUSystem2: values[98]?.trim() || '',
                  AUSystem3: values[99]?.trim() || '',
                  AUSystem4: values[100]?.trim() || '',
                  AUSystem5: values[101]?.trim() || '',
                  AUSystemOther: values[102]?.trim() || '',
                  AUSResult1: values[103]?.trim() || '',
                  AUSResult2: values[104]?.trim() || '',
                  AUSResult3: values[105]?.trim() || '',
                  AUSResult4: values[106]?.trim() || '',
                  AUSResult5: values[107]?.trim() || '',
                  AUSResultOther: values[108]?.trim() || '',
                  REVMTG: values[109]?.trim() || '',
                  OpenLOC: values[110]?.trim() || '',
                  BUSCML: values[111]?.trim() || '',
                  // Extended fields from later positions
                  Source: values[112]?.trim() || 'LaserPro',
                  ApplNumb: values[113]?.trim() || values[2]?.trim() || '',
                  Branch: values[114]?.trim() || '',
                  BranchName: values[115]?.trim() || '',
                  LastName: values[116]?.trim() || '',
                  FirstName: values[117]?.trim() || '',
                  Lender: values[118]?.trim() || '',
                  _rawValues: values
                };
              });
              
              console.log(`Parsed ${data.length} LaserPro rows with positional mapping`);
              resolve(data);
              return;
            }
            
            // Standard delimited file with headers
            const headers = firstLine.split(delimiter).map(h => h.trim());
            
            const data = lines.slice(1).map(line => {
              const values = line.split(delimiter);
              const obj: any = {};
              headers.forEach((header, i) => {
                obj[header] = values[i]?.trim() || '';
              });
              return obj;
            });
            
            if (data.length > 0) {
              console.log(`Parsed ${data.length} rows with ${headers.length} columns from text file`);
              resolve(data);
              return;
            }
          }
          // Fallback if parsing fails
          console.log("Text file parsing failed, using sample data");
          resolve(MOCK_SBSL_DATA);
        } catch (error) {
          console.error("Error parsing text file:", error);
          resolve(MOCK_SBSL_DATA);
        }
      };
      reader.readAsText(file);
      return;
    }
    
    // Handle PDF files - return mock data for demo
    if (file.name.endsWith('.pdf')) {
       console.log("PDF file detected - would require PDF parsing library");
       resolve(MOCK_SBSL_DATA);
       return;
    }

    // Handle Excel/CSV files
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        
        // Check if this looks like an Encompass file (has metadata rows)
        // Parse with range option to skip metadata rows if detected
        let jsonData = utils.sheet_to_json(sheet) as any[];
        
        // Detect Encompass format by checking first row for metadata patterns
        if (jsonData.length > 0) {
          const firstRow = jsonData[0];
          const firstRowKeys = Object.keys(firstRow);
          const firstValue = String(firstRow[firstRowKeys[0]] || '');
          
          // If first row looks like Encompass metadata, skip first 2 rows
          if (firstValue.includes('Encompass') || firstValue.includes('Report') || 
              firstRowKeys.some(k => k.includes('__EMPTY'))) {
            console.log('Detected Encompass format, skipping metadata rows');
            // Re-parse starting from row 3 (skip first 2 metadata rows)
            jsonData = utils.sheet_to_json(sheet, { range: 2 }) as any[];
          }
        }
        
        console.log(`Parsed ${jsonData.length} rows from Excel/CSV file`);
        resolve(jsonData);
      } catch (error) {
        console.error("Error parsing Excel/CSV file:", error);
        reject(error);
      }
    };
    reader.onerror = reject;
    reader.readAsArrayBuffer(file);
  });
};

// 128-column output format for CRA Wiz upload
export const CRA_WIZ_128_COLUMNS = [
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
  'Age', 'Coa_Age', 'Income', 'Purchaser', 'Rate_Spread',
  'HOEPA_Status', 'Lien_Status', 'CreditScore', 'Coa_CreditScore',
  'CreditModel', 'CreditModelOther', 'Coa_CreditModel', 'Coa_CreditModelOther',
  'Denial1', 'Denial2', 'Denial3', 'Denial4', 'DenialOther',
  'TotalLoanCosts', 'TotalPtsAndFees', 'OrigFees', 'DiscountPts', 'LenderCredts',
  'InterestRate', 'APR', 'Rate_Lock_Date', 'PPPTerm', 'DTIRatio', 'DSC', 'CLTV',
  'Loan_Term', 'Loan_Term_Months', 'IntroRatePeriod', 'BalloonPMT', 'IOPMT',
  'NegAM', 'NonAmortz', 'PropertyValue', 'MHSecPropType', 'MHLandPropInt',
  'TotalUnits', 'MFAHU', 'APPMethod', 'PayableInst', 'NMLSRID',
  'AUSystem1', 'AUSystem2', 'AUSystem3', 'AUSystem4', 'AUSystem5', 'AUSystemOther',
  'AUSResult1', 'AUSResult2', 'AUSResult3', 'AUSResult4', 'AUSResult5', 'AUSResultOther',
  'REVMTG', 'OpenLOC', 'BUSCML', 'RateType', 'Var_Term', 'LoanProgram', 'ProductType'
];

// Transform data to 128-column CRA Wiz format
export const transformToCRAWizFormat = (data: SbslRow[]): any[] => {
  return data.map(row => {
    const output: any = {};
    
    // Map each column, looking for matching field names (case-insensitive)
    CRA_WIZ_128_COLUMNS.forEach(col => {
      // Try exact match first
      if (row[col] !== undefined) {
        output[col] = row[col];
        return;
      }
      
      // Try case-insensitive match
      const lowerCol = col.toLowerCase();
      const matchingKey = Object.keys(row).find(k => k.toLowerCase() === lowerCol);
      if (matchingKey) {
        output[col] = row[matchingKey];
        return;
      }
      
      // Try common field name variations
      const fieldMappings: Record<string, string[]> = {
        'BranchName': ['BranchName', 'Branch Name', 'Branch_Name'],
        'Branch': ['Branch', 'BranchNumb', 'BRANCHNUMB'],
        'ApplNumb': ['ApplNumb', 'ULI', 'Loan_Number', 'LoanNumber'],
        'LastName': ['LastName', 'Last Name', 'Borrower_Last_Name'],
        'FirstName': ['FirstName', 'First Name', 'Borrower_First_Name'],
        'LoanAmount': ['LoanAmount', 'Loan Amount', 'Loan_Amount'],
        'Address': ['Address', 'Property_Street', 'PropertyStreet'],
        'City': ['City', 'Property_City', 'PropertyCity'],
        'State_abrv': ['State_abrv', 'State', 'Property_State', 'PropertyState'],
        'Zip': ['Zip', 'Property_Zip', 'PropertyZip', 'ZipCode'],
        'InterestRate': ['InterestRate', 'Interest_Rate', 'Interest Rate'],
        'Income': ['Income', 'Income_Thousands'],
        'CreditScore': ['CreditScore', 'Credit_Score'],
        'Loan_Term_Months': ['Loan_Term_Months', 'LoanTermMonths', 'Term'],
      };
      
      const mappings = fieldMappings[col];
      if (mappings) {
        for (const alt of mappings) {
          if (row[alt] !== undefined) {
            output[col] = row[alt];
            return;
          }
        }
      }
      
      // Default to empty string
      output[col] = '';
    });
    
    return output;
  });
};

// Export to CRA Wiz 128-column format
export const exportCRAWizFormat = (data: SbslRow[], filename?: string): void => {
  const transformedData = transformToCRAWizFormat(data);
  const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
  const defaultFilename = `CRA_Wiz_Upload_${monthYear.replace(' ', '_')}.xlsx`;
  
  const ws = utils.json_to_sheet(transformedData, { header: CRA_WIZ_128_COLUMNS });
  const wb = utils.book_new();
  utils.book_append_sheet(wb, ws, "CRA Data");
  
  writeFile(wb, filename || defaultFilename);
};

export const filterByCurrentMonth = (data: SbslRow[]): { filtered: SbslRow[], count: number } => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const filtered = data.filter(row => {
    // Check multiple possible date fields
    const dateVal = row['Note Date'] || row.Application_Date || row['Application_Date'];
    
    // For demo: if no date field exists, keep the record
    if (!dateVal) return true;
    
    const date = new Date(dateVal);
    // For demo: if date is invalid, keep the record
    if (isNaN(date.getTime())) return true;

    // Accept loans from the last 12 months for demo purposes
    const monthsAgo = (currentYear - date.getFullYear()) * 12 + (currentMonth - date.getMonth());
    return monthsAgo >= 0 && monthsAgo <= 12;
  });
  
  return { filtered, count: filtered.length };
};

// Phase 2 Step 1: Transformation Logic
export const transformEncompassData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const newRow = { ...row };
    
    // Calculate Branch (First 3 of Loan Number/ApplNumb)
    if (newRow.ApplNumb) {
      newRow['Branch'] = newRow.ApplNumb.substring(0, 3);
    }
    
    // Calculate Loan Term Years
    if (newRow['Loan Term in Months']) {
      newRow['Loan Term Years'] = Number(newRow['Loan Term in Months']) / 12;
    }
    
    return newRow;
  });
};

// Phase 2 Step 2: VLOOKUP Simulation
export const mergeSupplementalData = (mainData: SbslRow[], suppData: SbslRow[]): SbslRow[] => {
  // Create lookup map using either Loan_Number (HMDA) or ApplNumb (legacy)
  const suppMap = new Map(
    suppData.map(row => [row.Loan_Number || row.ApplNumb, row])
  );
  
  return mainData.map(row => {
    const joinKey = row.Loan_Number || row.ApplNumb;
    const supp = suppMap.get(joinKey);
    if (!supp) return row;
    
    return {
      ...row,
      // Merge HMDA fields
      Applicant_Ethnicity: supp.Applicant_Ethnicity,
      Applicant_Race_1: supp.Applicant_Race_1,
      Applicant_Sex: supp.Applicant_Sex,
      Income_Thousands: supp.Income_Thousands,
      Credit_Score: supp.Credit_Score,
      Borrower_Last_Name: supp.Borrower_Last_Name,
      Borrower_First_Name: supp.Borrower_First_Name,
      Property_Street: supp.Property_Street,
      Property_City: supp.Property_City,
      Property_State: supp.Property_State,
      Property_Zip: supp.Property_Zip,
      // Legacy fields
      'Customer Name': supp['Customer Name'],
      'Borrower Name': supp['Borrower Name'],
      'Lender': supp['Lender'],
      'APR': supp['APR'] || supp.Interest_Rate,
      'Rate Type': supp['Rate Type'] === 'ARM' ? '2' : '1',
    };
  });
};

// Phase 2 Step 3: Cleaning
export const cleanAndFormatData = (data: SbslRow[]): SbslRow[] => {
  const branchMap: Record<string, string> = {
    '001': 'Main Branch',
    '002': 'North Branch',
    '003': 'West Branch'
  };

  return data.map(row => {
    const newRow = { ...row };
    
    // Branch Name Mapping
    if (newRow.Branch && branchMap[newRow.Branch]) {
      newRow['Branch Name'] = branchMap[newRow.Branch];
    }
    
    // APR Formatting (Remove trailing zeros)
    if (newRow.APR) {
      newRow.APR = String(newRow.APR).replace(/0+$/, '').replace(/\.$/, '');
    }
    
    // County Zero Padding (5 digits)
    if (newRow['County Code']) {
      newRow['County Code'] = String(newRow['County Code']).padStart(5, '0');
    }
    
    // Tract Zero Padding (11 digits)
    if (newRow['Tract']) {
      newRow['Tract'] = String(newRow['Tract']).padStart(11, '0');
    }
    
    return newRow;
  });
};

export const validateData = (data: SbslRow[]): ValidationResult[] => {
  const results: ValidationResult[] = [];
  
  data.forEach((row, idx) => {
    const errors: string[] = [];
    const loanId = row.Loan_Number || row.ApplNumb || 'N/A';
    
    // HMDA Required Fields
    if (row.Loan_Number) {
      // HMDA data validation
      if (!row.Loan_Number) errors.push("Missing Loan_Number");
      if (!row.Application_Date && !row['Note Date']) errors.push("Missing Application_Date");
      if (!row.Loan_Amount && !row['Loan Amount']) errors.push("Missing Loan_Amount");
      
      // Loan Amount validation
      const loanAmount = Number(row.Loan_Amount || row['Loan Amount']);
      if (isNaN(loanAmount) || loanAmount <= 0) errors.push("Loan Amount must be positive");
      
      // Interest Rate validation (0-20%, max 3 decimals)
      if (row.Interest_Rate || row['Interest Rate']) {
        const rate = Number(row.Interest_Rate || row['Interest Rate']);
        if (rate < 0 || rate > 20) errors.push("Interest Rate out of bounds (0-20%)");
        const rateStr = String(rate);
        if (rateStr.includes('.') && rateStr.split('.')[1].length > 3) {
          errors.push("Interest Rate max 3 decimal places");
        }
      }
      
      // Census Tract Format validation (##.## or ####.##)
      if (row.Census_Tract) {
        const tract = String(row.Census_Tract);
        if (!/^\d{2,4}\.\d{2}$/.test(tract)) {
          errors.push("Census Tract must be ##.## or ####.##");
        }
      }
      
      // Income validation (1-9999 thousands)
      if (row.Income_Thousands) {
        const income = Number(row.Income_Thousands);
        if (income < 1 || income > 9999) {
          errors.push("Income must be 1-9999 (thousands)");
        }
      }
      
      // Action Taken Code validation
      if (row.Action_Taken_Code) {
        const action = Number(row.Action_Taken_Code);
        if (![1, 2, 3, 4, 5, 6, 7, 8].includes(action)) {
          errors.push("Invalid Action Taken Code");
        }
      }
      
      // Property State validation
      if (row.Property_State) {
        if (String(row.Property_State).trim().length !== 2) {
          errors.push("State must be 2-letter code");
        }
      }
    } else {
      // Legacy validation
      const required = ['ApplNumb', 'Last Name', 'Loan Amount', 'Note Date'];
      required.forEach(field => {
        if (!row[field]) errors.push(`Missing ${field}`);
      });
      
      const loanAmount = Number(row['Loan Amount']);
      if (isNaN(loanAmount) || loanAmount <= 0) errors.push("Loan Amount must be positive");
      
      if (row['State'] && String(row['State']).trim().length !== 2) errors.push("State must be 2-letter code");
      
      if (row['Zip']) {
        const zipStr = String(row['Zip']).trim();
        if (zipStr.length < 5) errors.push("Invalid ZIP code");
        if (/[a-zA-Z]/.test(zipStr)) errors.push("ZIP contains letters");
      }
    }

    if (errors.length > 0) {
      results.push({
        rowIdx: idx + 2,
        applNumb: loanId,
        errors
      });
    }
  });
  
  return results;
};

// Auto-correct fixable validation errors
export const autoCorrectData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const corrected = { ...row };
    
    // Fix Census Tract formatting (convert to ##.## or ####.##)
    if (corrected.Census_Tract) {
      let tract = String(corrected.Census_Tract).replace(/[^\d.]/g, '');
      // If it doesn't have decimal, try to format it
      if (!tract.includes('.')) {
        if (tract.length >= 4) {
          tract = tract.slice(0, -2) + '.' + tract.slice(-2);
        }
      }
      // Ensure proper format
      const parts = tract.split('.');
      if (parts.length === 2) {
        const whole = parts[0].padStart(2, '0');
        const decimal = parts[1].padEnd(2, '0').slice(0, 2);
        corrected.Census_Tract = `${whole}.${decimal}`;
      }
    }
    
    // Fix Interest Rate (max 3 decimals, ensure in range)
    if (corrected.Interest_Rate || corrected['Interest Rate']) {
      let rate = Number(corrected.Interest_Rate || corrected['Interest Rate']);
      // Round to 3 decimals
      rate = Math.round(rate * 1000) / 1000;
      // Clamp to valid range if slightly out of bounds
      if (rate > 20 && rate < 21) rate = 20.0;
      if (rate < 0) rate = 0;
      corrected.Interest_Rate = rate;
      corrected['Interest Rate'] = rate;
    }
    
    // Fix APR formatting
    if (corrected.APR || corrected['APR']) {
      let apr = String(corrected.APR || corrected['APR']);
      // Remove trailing zeros and % sign
      apr = apr.replace('%', '').trim();
      const aprNum = parseFloat(apr);
      if (!isNaN(aprNum)) {
        corrected.APR = Math.round(aprNum * 1000) / 1000;
        corrected['APR'] = corrected.APR;
      }
    }
    
    // Trim whitespace from text fields
    if (corrected.Property_State) {
      corrected.Property_State = String(corrected.Property_State).trim().toUpperCase().slice(0, 2);
    }
    if (corrected.State) {
      corrected.State = String(corrected.State).trim().toUpperCase().slice(0, 2);
    }
    
    // Fix Income (clamp to valid range if close)
    if (corrected.Income_Thousands) {
      let income = Number(corrected.Income_Thousands);
      if (income > 9999 && income < 10100) income = 9999;
      if (income < 1 && income > 0) income = 1;
      corrected.Income_Thousands = income;
    }
    
    return corrected;
  });
};

export const generateSummaryStats = (data: SbslRow[]) => {
  const totalLoanAmount = data.reduce((sum, row) => {
    // Check both HMDA and legacy field names
    const amount = Number(row.Loan_Amount || row['Loan Amount']) || 0;
    return sum + amount;
  }, 0);
  
  const totalTerm = data.reduce((sum, row) => {
    const termYears = Number(row['Loan Term Years']) || (row.Loan_Term_Months ? Number(row.Loan_Term_Months) / 12 : 0) || 0;
    return sum + termYears;
  }, 0);
  
  return {
    totalRecords: data.length,
    totalLoanAmount,
    avgLoanAmount: data.length ? totalLoanAmount / data.length : 0,
    avgTerm: data.length ? totalTerm / data.length : 0
  };
};
