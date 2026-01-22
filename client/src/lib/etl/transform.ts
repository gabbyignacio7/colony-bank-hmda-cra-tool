/**
 * ETL Transform Functions - Data transformation to CRA Wiz format
 */

import type { SbslRow, ValidationResult } from './types';
import { CRA_WIZ_128_COLUMNS } from './field-maps';
import {
  findFieldValue,
  parseBorrowerName,
  mapAUSResult,
  mapAUSystem,
  mapNonAmortz,
  convertLoanTermToYears,
  getLoanTermMonths,
  formatCensusTract,
  deriveRateType,
  deriveVarTerm,
  excelDateToString,
} from './utils';
import { BRANCH_LIST, getBranchFromLoanOfficer, getBranchName } from '../cra-wiz-transform';
import { logInfo, logWarning, logDebug, trackETLStep } from '../error-tracker';

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

    // HMDA "No Co-Applicant" defaults for demographic fields
    // Per HMDA spec: Apply these codes ONLY if the source data is blank (no co-applicant present)
    // Ethnicity: 5 = No co-applicant, Determinant: 4 = Not applicable
    // Race: 8 = No co-applicant, Determinant: 4 = Not applicable
    // Sex: 5 = No co-applicant, Determinant: 4 = Not applicable
    if (!output['Coa_Ethnicity_1'] || String(output['Coa_Ethnicity_1']) === '') {
      output['Coa_Ethnicity_1'] = findFieldValue(row, 'Coa_Ethnicity_1') ?? '5';
    }
    if (!output['Coa_Ethnicity_Determinant'] || String(output['Coa_Ethnicity_Determinant']) === '') {
      output['Coa_Ethnicity_Determinant'] = findFieldValue(row, 'Coa_Ethnicity_Determinant') ?? '4';
    }
    if (!output['CoaRace_1'] || String(output['CoaRace_1']) === '') {
      output['CoaRace_1'] = findFieldValue(row, 'CoaRace_1') ?? '8';
    }
    if (!output['CoaRace_Determinant'] || String(output['CoaRace_Determinant']) === '') {
      output['CoaRace_Determinant'] = findFieldValue(row, 'CoaRace_Determinant') ?? '4';
    }
    if (!output['CoaSex'] || String(output['CoaSex']) === '') {
      output['CoaSex'] = findFieldValue(row, 'CoaSex') ?? '5';
    }
    if (!output['CoaSex_Determinant'] || String(output['CoaSex_Determinant']) === '') {
      output['CoaSex_Determinant'] = findFieldValue(row, 'CoaSex_Determinant') ?? '4';
    }

    // DTIRatio: should be numeric value or "NA" (HMDA code for Exempt)
    if (output['DTIRatio'] === '' || output['DTIRatio'] === null || output['DTIRatio'] === undefined) {
      output['DTIRatio'] = 'NA';
    }

    // CreditModel: Pull from source data first, default to '9' (Not applicable) only if truly missing
    // IMPORTANT: Per Jonathan's feedback - need to show actual values from source, not all '9'
    const rawCreditModel = output['CreditModel'] ?? findFieldValue(row, 'CreditModel');
    if (rawCreditModel && rawCreditModel !== '' && rawCreditModel !== null && rawCreditModel !== undefined) {
      output['CreditModel'] = String(rawCreditModel);
    } else {
      output['CreditModel'] = '9';  // 9 = Not applicable per HMDA spec
    }
    // Debug log for CreditModel
    if (idx === 0) {
      console.log('CreditModel source values:', {
        outputCreditModel: output['CreditModel'],
        rawCreditModel,
        'Credit Score Type Used': row['Credit Score Type Used'],
        'Credit Scoring Model': row['Credit Scoring Model']
      });
    }

    // Coa_CreditModel: Pull from source data first, default to '9' (Not applicable) only if truly missing
    const rawCoaCreditModel = output['Coa_CreditModel'] ?? findFieldValue(row, 'Coa_CreditModel');
    if (rawCoaCreditModel && rawCoaCreditModel !== '' && rawCoaCreditModel !== null && rawCoaCreditModel !== undefined) {
      output['Coa_CreditModel'] = String(rawCoaCreditModel);
    } else {
      output['Coa_CreditModel'] = '9';  // 9 = Not applicable per HMDA spec
    }
    // Debug log for Coa_CreditModel
    if (idx === 0) {
      console.log('Coa_CreditModel source values:', {
        outputCoaCreditModel: output['Coa_CreditModel'],
        rawCoaCreditModel,
        'Co-Applicant Credit Scoring Model': row['Co-Applicant Credit Scoring Model']
      });
    }

    // NonAmortz - Map to valid HMDA codes
    const rawNonAmortz = output['NonAmortz'] ?? findFieldValue(row, 'NonAmortz');
    const balloon = findFieldValue(row, 'BalloonPMT');
    const interestOnly = findFieldValue(row, 'IOPMT');
    const negAm = findFieldValue(row, 'NegAM');
    output['NonAmortz'] = mapNonAmortz(rawNonAmortz, balloon, interestOnly, negAm);

    // NMLSRID: should not be blank
    if (output['NMLSRID'] === '' || output['NMLSRID'] === null || output['NMLSRID'] === undefined) {
      const nmls = findFieldValue(row, 'NMLSRID');
      if (nmls) {
        output['NMLSRID'] = String(nmls).replace(/^NMLS?#?\s*/i, '').trim();
      }
    }

    // RateType and Var_Term derivation from IntroRatePeriod
    const introRatePeriod = findFieldValue(row, 'IntroRatePeriod') ||
                            row['Intro Rate Period'] ||
                            row['Introductory Rate Period'] ||
                            row['Initial Rate Period'] ||
                            row['ARM Initial Rate Period'] ||
                            output['IntroRatePeriod'];

    output['RateType'] = deriveRateType(introRatePeriod);
    output['Var_Term'] = deriveVarTerm(introRatePeriod);

    // ConstructionMethod: HMDA values 1=Site-built, 2=Manufactured home
    if (output['ConstructionMethod'] === '' || output['ConstructionMethod'] === null || output['ConstructionMethod'] === undefined) {
      const constructMethod = findFieldValue(row, 'ConstructionMethod');
      output['ConstructionMethod'] = constructMethod ?? '1';
    }

    // Loan Term handling
    const rawLoanTerm = findFieldValue(row, 'Loan_Term') || findFieldValue(row, 'Loan_Term_Months') ||
                        findFieldValue(row, 'LoanTerm') || findFieldValue(row, 'Term');
    const rawLoanTermMonths = findFieldValue(row, 'Loan_Term_Months') || findFieldValue(row, 'LoanTermMonths') ||
                              findFieldValue(row, 'Term in Months') || rawLoanTerm;

    if (rawLoanTerm) {
      output['Loan_Term'] = convertLoanTermToYears(rawLoanTerm);
    }

    if (rawLoanTermMonths) {
      output['Loan_Term_Months'] = getLoanTermMonths(rawLoanTermMonths);
    } else if (rawLoanTerm) {
      output['Loan_Term_Months'] = getLoanTermMonths(rawLoanTerm);
    }

    // Census Tract - Format with leading zeros (11 digits)
    const rawTract = output['Tract_11'] ?? findFieldValue(row, 'Tract_11');
    if (rawTract) {
      output['Tract_11'] = formatCensusTract(rawTract);
    }

    // AUSystem1 - Map to valid HMDA codes (1-6)
    const rawAUSystem1 = output['AUSystem1'] ?? findFieldValue(row, 'AUSystem1');
    output['AUSystem1'] = mapAUSystem(rawAUSystem1);

    // AUSResult1 - Map to valid HMDA codes (1-17)
    const rawAUSResult1 = output['AUSResult1'] ?? findFieldValue(row, 'AUSResult1');
    output['AUSResult1'] = mapAUSResult(rawAUSResult1);

    // Convert dates
    ['ApplDate', 'ActionDate', 'Rate_Lock_Date'].forEach(field => {
      if (output[field]) {
        output[field] = excelDateToString(output[field]);
      }
    });

    if (idx === 0) {
      console.log('First transformed row (first 10 keys):', Object.keys(output).slice(0, 10));
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
 * Validate data rows
 */
export const validateData = (data: SbslRow[]): ValidationResult[] => {
  return data.map((row, idx) => {
    const errors: string[] = [];
    const warnings: string[] = [];
    const autoCorrected: Record<string, { from: any; to: any }> = {};
    
    // Required field validations
    if (!row.ULI && !row.LEI) {
      errors.push('Missing both ULI and LEI');
    }
    if (!row.LoanType) {
      errors.push('Missing Loan Type');
    }
    if (!row.Action) {
      errors.push('Missing Action Taken');
    }
    
    // Warning-level validations
    if (!row.Address) {
      warnings.push('Missing Property Address');
    }
    if (!row.Income && row.Action === '1') {
      warnings.push('Missing Income for originated loan');
    }
    
    return {
      rowIdx: idx,
      applNumb: row.ApplNumb || row.ULI || `Row ${idx}`,
      isValid: errors.length === 0,
      errors,
      warnings,
      autoCorrected,
    };
  });
};

/**
 * Auto-correct common data issues
 */
export const autoCorrectData = (data: SbslRow[]): SbslRow[] => {
  return data.map(row => {
    const corrected = { ...row };
    
    // Standardize state abbreviations
    if (corrected.State_abrv && corrected.State_abrv.length > 2) {
      const stateMap: Record<string, string> = {
        'georgia': 'GA', 'florida': 'FL', 'alabama': 'AL',
        'tennessee': 'TN', 'south carolina': 'SC', 'north carolina': 'NC',
      };
      const lower = corrected.State_abrv.toLowerCase();
      if (stateMap[lower]) {
        corrected.State_abrv = stateMap[lower];
      }
    }
    
    // Clean up ZIP codes
    if (corrected.Zip) {
      corrected.Zip = String(corrected.Zip).replace(/[^\d-]/g, '').substring(0, 10);
    }
    
    return corrected;
  });
};

/**
 * Transform Encompass data (alias for backward compatibility)
 */
export const transformEncompassData = (data: SbslRow[]): SbslRow[] => data;

/**
 * Clean and format data (alias for autoCorrectData)
 */
export const cleanAndFormatData = (data: SbslRow[]): SbslRow[] => autoCorrectData(data);
