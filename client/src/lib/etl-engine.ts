import { read, utils, writeFile } from 'xlsx';

export interface SbslRow {
  ApplNumb: string;
  'Last Name': string;
  'Loan Type': string;
  'Action Taken': string;
  'Loan Amount': number;
  'Note Date': string | number | Date;
  Revenue: number;
  Affiliate: string;
  Address: string;
  City: string;
  State: string;
  Zip: string;
  Comment: string;
  [key: string]: any;
}

export interface ValidationResult {
  rowIdx: number;
  applNumb: string;
  errors: string[];
}

export interface EtlState {
  sbslData: SbslRow[] | null;
  hmdaData: any[] | null;
  processedData: SbslRow[] | null;
  validationErrors: ValidationResult[];
  logs: string[];
  currentStep: number;
  isProcessing: boolean;
}

// Mock Data for Demo
export const MOCK_SBSL_DATA: SbslRow[] = [
  {
    ApplNumb: "2024-001",
    "Last Name": "Smith",
    "Loan Type": "Small Business",
    "Action Taken": "Originated",
    "Loan Amount": 75000,
    "Note Date": new Date().toISOString().split('T')[0], // Current date to pass filter
    Revenue: 500000,
    Affiliate: "Main Branch",
    Address: "123 Main St",
    City: "Atlanta",
    State: "GA",
    Zip: "30301",
    Comment: ""
  },
  {
    ApplNumb: "2024-002",
    "Last Name": "Johnson",
    "Loan Type": "Commercial",
    "Action Taken": "Originated",
    "Loan Amount": 150000,
    "Note Date": "2023-12-15", // Old date
    Revenue: 1200000,
    Affiliate: "North Branch",
    Address: "456 Oak Rd",
    City: "Savannah",
    State: "GA",
    Zip: "31401",
    Comment: "Review required"
  },
  {
    ApplNumb: "2024-003",
    "Last Name": "Williams",
    "Loan Type": "Small Business",
    "Action Taken": "Denied",
    "Loan Amount": 0, // Invalid amount
    "Note Date": new Date().toISOString().split('T')[0],
    Revenue: 250000,
    Affiliate: "West Branch",
    Address: "789 Pine Ln",
    City: "Macon",
    State: "G", // Invalid State
    Zip: "3120", // Invalid Zip
    Comment: ""
  }
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
    // Handle Excel serial dates if necessary (though sheet_to_json usually handles common formats)
    // If invalid date, it might return NaN for getMonth
    if (isNaN(date.getTime())) return false;

    return date.getMonth() === currentMonth && date.getFullYear() === currentYear;
  });
  
  return { filtered, count: filtered.length };
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
    // Ensure Loan Amount is treated as number
    const loanAmount = Number(row['Loan Amount']);
    if (isNaN(loanAmount) || loanAmount <= 0) errors.push("Loan Amount must be positive");
    
    if (row['State'] && String(row['State']).trim().length !== 2) errors.push("State must be 2-letter code");
    
    if (row['Zip']) {
      const zipStr = String(row['Zip']).trim();
      // Simple check: must be at least 5 chars
      if (zipStr.length < 5) errors.push("Invalid ZIP code");
      // Check if contains letters (rudimentary check for US zip)
      if (/[a-zA-Z]/.test(zipStr)) errors.push("ZIP contains letters");
    } else {
       // Zip is missing
       // errors.push("Missing Zip"); // Already covered by required check if added to required list, but it's not there currently.
    }
    
    if (errors.length > 0) {
      results.push({
        rowIdx: idx + 2, // Excel row
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
    avgLoanAmount: data.length ? totalLoanAmount / data.length : 0
  };
};
