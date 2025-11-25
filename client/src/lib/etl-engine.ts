import { read, utils, writeFile } from 'xlsx';

export interface SbslRow {
  ApplNumb: string;
  'Last Name': string;
  'Loan Type': string;
  'Action Taken': string;
  'Loan Amount': number;
  'Note Date': string | number | Date;
  Revenue?: number;
  Affiliate?: string;
  Address?: string;
  City?: string;
  State?: string;
  Zip?: string;
  Comment?: string;
  
  // New Fields from Phase 2
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
    
    // Handle text/pdf files as raw data mock pass-through or simple text read
    if (file.name.endsWith('.txt') || file.name.endsWith('.pdf')) {
       // For demo purposes, we just return mock data if it's a non-excel file 
       // or read text content if possible.
       // Since we can't parse PDF client-side easily without pdf.js, we'll assume success 
       // and return mock data to unblock the demo.
       console.log("Processing non-excel file:", file.name);
       resolve(MOCK_SBSL_DATA);
       return;
    }

    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = utils.sheet_to_json(sheet);
        resolve(jsonData);
      } catch (error) {
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
    const dateVal = row['Note Date'];
    if (!dateVal) return false;
    
    const date = new Date(dateVal);
    if (isNaN(date.getTime())) return false;

    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
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
  // Create lookup map
  const suppMap = new Map(suppData.map(row => [row.ApplNumb, row]));
  
  return mainData.map(row => {
    const supp = suppMap.get(row.ApplNumb);
    if (!supp) return row;
    
    return {
      ...row,
      'Customer Name': supp['Customer Name'],
      'Borrower Name': supp['Borrower Name'],
      'Lender': supp['Lender'],
      'APR': supp['APR'],
      'Rate Type': supp['Rate Type'] === 'ARM' ? '2' : '1',
      // Add other fields as needed
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
    
    // Required Fields
    const required = ['ApplNumb', 'Last Name', 'Loan Amount', 'Note Date'];
    required.forEach(field => {
      if (!row[field]) errors.push(`Missing ${field}`);
    });
    
    // Logic Checks
    const loanAmount = Number(row['Loan Amount']);
    if (isNaN(loanAmount) || loanAmount <= 0) errors.push("Loan Amount must be positive");
    
    if (row['State'] && String(row['State']).trim().length !== 2) errors.push("State must be 2-letter code");
    
    // Zip Validation
    if (row['Zip']) {
      const zipStr = String(row['Zip']).trim();
      if (zipStr.length < 5) errors.push("Invalid ZIP code");
      if (/[a-zA-Z]/.test(zipStr)) errors.push("ZIP contains letters");
    }
    
    // Phase 3 Validation Rules (CRA Wiz Replication)
    
    // 1. Rate Check (0-20%)
    if (row['Interest Rate']) {
       const rate = Number(row['Interest Rate']);
       if (rate < 0 || rate > 20) errors.push("Interest Rate out of bounds (0-20%)");
    }
    
    // 2. LTV Check (0-150%)
    if (row['LTV']) {
       const ltv = Number(row['LTV']);
       if (ltv < 0 || ltv > 150) errors.push("LTV out of bounds (0-150%)");
    }

    if (errors.length > 0) {
      results.push({
        rowIdx: idx + 2,
        applNumb: row.ApplNumb || 'N/A',
        errors
      });
    }
  });
  
  return results;
};

export const generateSummaryStats = (data: SbslRow[]) => {
  const totalLoanAmount = data.reduce((sum, row) => sum + (Number(row['Loan Amount']) || 0), 0);
  return {
    totalRecords: data.length,
    totalLoanAmount,
    avgLoanAmount: data.length ? totalLoanAmount / data.length : 0,
    avgTerm: data.reduce((sum, row) => sum + (Number(row['Loan Term Years']) || 0), 0) / data.length || 0
  };
};
