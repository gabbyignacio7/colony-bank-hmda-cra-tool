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
    
    // Handle text files - try to parse as tab or comma delimited
    if (file.name.endsWith('.txt')) {
      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          // Try to parse as TSV/CSV
          const lines = text.split('\n').filter(line => line.trim());
          if (lines.length > 0) {
            const headers = lines[0].split('\t').length > 1 
              ? lines[0].split('\t') 
              : lines[0].split(',');
            
            const data = lines.slice(1).map(line => {
              const values = line.split('\t').length > 1 
                ? line.split('\t') 
                : line.split(',');
              const obj: any = {};
              headers.forEach((header, i) => {
                obj[header.trim()] = values[i]?.trim() || '';
              });
              return obj;
            });
            
            if (data.length > 0) {
              console.log(`Parsed ${data.length} rows from text file`);
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
        const jsonData = utils.sheet_to_json(sheet);
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

export const filterByCurrentMonth = (data: SbslRow[]): { filtered: SbslRow[], count: number } => {
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  
  const filtered = data.filter(row => {
    // Check multiple possible date fields
    const dateVal = row['Note Date'] || row.Application_Date || row['Application_Date'];
    if (!dateVal) return false;
    
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return false;

    // For demo/testing: accept current month from current year OR previous year
    const isCurrentMonth = date.getMonth() === currentMonth;
    const isRecentYear = date.getFullYear() === currentYear || date.getFullYear() === (currentYear - 1);
    
    return isCurrentMonth && isRecentYear;
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
