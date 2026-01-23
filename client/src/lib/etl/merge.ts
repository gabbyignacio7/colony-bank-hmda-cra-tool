/**
 * ETL Merge Functions - Data merging and deduplication
 */

import type { SbslRow, DeduplicationResult } from './types';
import { logInfo, logWarning, trackETLStep } from '../error-tracker';

/**
 * Detect and remove duplicate records between multiple data sources
 * Uses ULI as primary key, falls back to Address+City
 * Returns deduplicated data with source preference (Encompass > LaserPro)
 */
export const deduplicateData = (data: SbslRow[]): DeduplicationResult => {
  const seenByULI = new Map<string, { row: SbslRow; index: number }>();
  const seenByAddress = new Map<string, { row: SbslRow; index: number }>();
  const duplicateKeys: string[] = [];
  let duplicatesRemoved = 0;

  const deduplicated: SbslRow[] = [];

  data.forEach((row, index) => {
    const uli = String(row.ULI || row['Universal Loan Identifier'] || '')
      .trim()
      .toUpperCase();
    const address = String(row.Address || row['Street Address'] || '')
      .trim()
      .toLowerCase();
    const city = String(row.City || row['Property City'] || '')
      .trim()
      .toLowerCase();
    const addressKey = address && city ? `${address}|${city}` : '';
    const source = row._source || 'Encompass';

    // Check for duplicate by ULI
    if (uli && seenByULI.has(uli)) {
      const existing = seenByULI.get(uli)!;
      const existingSource = existing.row._source || 'Encompass';

      // Prefer Encompass over LaserPro
      if (source === 'Encompass' && existingSource === 'LaserPro') {
        const existingIndex = deduplicated.indexOf(existing.row);
        if (existingIndex !== -1) {
          deduplicated[existingIndex] = row;
          seenByULI.set(uli, { row, index });
        }
        duplicateKeys.push(`ULI:${uli} (LaserPro replaced by Encompass)`);
      } else {
        duplicateKeys.push(`ULI:${uli} (kept ${existingSource}, skipped ${source})`);
      }
      duplicatesRemoved++;
      return;
    }

    // Check for duplicate by Address+City
    if (addressKey && seenByAddress.has(addressKey)) {
      const existing = seenByAddress.get(addressKey)!;
      const existingSource = existing.row._source || 'Encompass';

      if (source === 'Encompass' && existingSource === 'LaserPro') {
        const existingIndex = deduplicated.indexOf(existing.row);
        if (existingIndex !== -1) {
          deduplicated[existingIndex] = row;
          seenByAddress.set(addressKey, { row, index });
          if (uli) seenByULI.set(uli, { row, index });
        }
        duplicateKeys.push(`Address:${addressKey} (LaserPro replaced by Encompass)`);
      } else {
        duplicateKeys.push(`Address:${addressKey} (kept ${existingSource}, skipped ${source})`);
      }
      duplicatesRemoved++;
      return;
    }

    // Not a duplicate, add to deduplicated list
    deduplicated.push(row);
    if (uli) seenByULI.set(uli, { row, index });
    if (addressKey) seenByAddress.set(addressKey, { row, index });
  });

  if (duplicatesRemoved > 0) {
    logInfo('ETL:Dedupe', `Removed ${duplicatesRemoved} duplicate records`, {
      originalCount: data.length,
      deduplicatedCount: deduplicated.length,
      sampleDuplicates: duplicateKeys.slice(0, 5),
    });
  }

  return { deduplicated, duplicatesRemoved, duplicateKeys };
};

/**
 * Merge supplemental data (Additional Fields file)
 */
export const mergeSupplementalData = (
  primaryData: SbslRow[],
  supplementalData: SbslRow[]
): SbslRow[] => {
  const startTime = Date.now();

  if (!supplementalData || supplementalData.length === 0) {
    console.log('No supplemental data to merge');
    logWarning('ETL:Merge', 'No supplemental data provided for merge');
    return primaryData;
  }

  logInfo('ETL:Merge', 'Starting supplemental data merge', {
    primaryRows: primaryData.length,
    supplementalRows: supplementalData.length,
  });

  console.log('=== MERGING SUPPLEMENTAL DATA ===');
  console.log('Primary data rows:', primaryData.length);
  console.log('Supplemental data rows:', supplementalData.length);

  if (supplementalData.length > 0) {
    console.log('Supplemental first row keys:', Object.keys(supplementalData[0]).slice(0, 15));
  }

  // Create lookup maps for supplemental data
  const suppByULI = new Map<string, SbslRow>();
  const suppByLoanNum = new Map<string, SbslRow>();
  const suppByAddress = new Map<string, SbslRow>();

  supplementalData.forEach((row, idx) => {
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    const loanNum = String(
      row['ApplNumb'] ||
        row['Loan Number'] ||
        row['LoanNumber'] ||
        row['Loan ID'] ||
        row['Application Number'] ||
        ''
    ).trim();

    const address = String(
      row['Address'] ||
        row['Property Address'] ||
        row['Street Address'] ||
        row['Property Street'] ||
        row['Subject Property Address'] ||
        ''
    )
      .toLowerCase()
      .trim();

    const city = String(row['City'] || row['Property City'] || row['Subject Property City'] || '')
      .toLowerCase()
      .trim();

    if (uli) suppByULI.set(uli, row);
    if (loanNum) suppByLoanNum.set(loanNum, row);
    if (address && city) suppByAddress.set(`${address}|${city}`, row);

    if (idx === 0) {
      console.log(
        'First supplemental row - ULI:',
        uli,
        'LoanNum:',
        loanNum,
        'Address:',
        address,
        'City:',
        city
      );
    }
  });

  console.log(
    'Lookup maps - ULI:',
    suppByULI.size,
    'LoanNum:',
    suppByLoanNum.size,
    'Address:',
    suppByAddress.size
  );

  let matchCount = 0;
  const result = primaryData.map((row, idx) => {
    const uli = String(
      row['ULI'] || row['Universal Loan Identifier'] || row['Universal Loan Identifier (ULI)'] || ''
    ).trim();

    const loanNum = String(
      row['ApplNumb'] || row['Loan Number'] || row['LoanNumber'] || row['Loan ID'] || ''
    ).trim();

    const address = String(
      row['Address'] ||
        row['Property Address'] ||
        row['Street Address'] ||
        row['Subject Property Address'] ||
        ''
    )
      .toLowerCase()
      .trim();

    const city = String(row['City'] || row['Property City'] || row['Subject Property City'] || '')
      .toLowerCase()
      .trim();

    // Try to find matching supplemental data
    const supp =
      suppByULI.get(uli) || suppByLoanNum.get(loanNum) || suppByAddress.get(`${address}|${city}`);

    if (idx === 0) {
      console.log('First primary row - ULI:', uli, 'LoanNum:', loanNum, 'Address:', address);
      console.log('Match found:', !!supp);
    }

    if (supp) {
      matchCount++;
      // Helper to get trimmed value (handles space-only strings as empty)
      const getTrimmed = (val: any): string => {
        return String(val ?? '').trim();
      };

      // Get values from supplemental with all possible field name variations
      const firstName = getTrimmed(
        supp['FirstName'] || supp['First Name'] || supp['Borrower First Name']
      );
      const lastName = getTrimmed(
        supp['LastName'] || supp['Last Name'] || supp['Borrower Last Name']
      );
      const coaFirstName = getTrimmed(
        supp['Coa_FirstName'] || supp['Co-Borrower First Name'] || supp['Co-Applicant First Name']
      );
      const coaLastName = getTrimmed(
        supp['Coa_LastName'] || supp['Co-Borrower Last Name'] || supp['Co-Applicant Last Name']
      );
      const lender = getTrimmed(supp['Lender'] || supp['Loan Officer'] || supp['Originator']);
      const processor = getTrimmed(
        supp['AA_Processor'] || supp['Processor'] || supp['Loan Processor']
      );
      const postCloser = getTrimmed(
        supp['LDP_PostCloser'] || supp['Post Closer'] || supp['Loan Team Member Name - Post Closer']
      );
      const apr = getTrimmed(supp['APR'] || supp['Annual Percentage Rate']);
      const rateLockDate = getTrimmed(
        supp['Rate_Lock_Date'] || supp['Rate Lock Date'] || supp['Lock Date']
      );
      const loanProgram = getTrimmed(supp['LoanProgram'] || supp['Loan Program']);
      const rateType = getTrimmed(supp['RateType'] || supp['Rate Type']);
      const branchName = getTrimmed(supp['BranchName'] || supp['Branch Name'] || supp['Branch']);

      // Co-applicant demographics
      const coaAge = getTrimmed(
        supp['Coa_Age'] ||
          supp['Co-Applicant Age'] ||
          supp['Age of Co-Applicant or Co-Borrower'] ||
          supp['Co-Borrower Age']
      );
      const coaCreditScore = getTrimmed(
        supp['Coa_CreditScore'] ||
          supp['Co-Applicant Credit Score'] ||
          supp['Credit Score of Co-Applicant or Co-Borrower'] ||
          supp['Co-Borrower Credit Score']
      );
      const coaSex = getTrimmed(
        supp['CoaSex'] || supp['Co-Applicant Sex'] || supp['Sex of Co-Applicant or Co-Borrower']
      );
      const coaCreditModel = getTrimmed(
        supp['Coa_CreditModel'] ||
          supp['Co-Applicant Credit Scoring Model'] ||
          supp['Credit Score Type of Co-Applicant or Co-Borrower']
      );

      // Co-applicant ethnicity
      const coaEthnicity1 = getTrimmed(
        supp['Coa_Ethnicity_1'] ||
          supp['Co-Applicant Ethnicity 1'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 1']
      );
      const coaEthnicity2 = getTrimmed(
        supp['Coa_Ethnicity_2'] ||
          supp['Co-Applicant Ethnicity 2'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 2']
      );
      const coaEthnicity3 = getTrimmed(
        supp['Coa_Ethnicity_3'] ||
          supp['Co-Applicant Ethnicity 3'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 3']
      );
      const coaEthnicity4 = getTrimmed(
        supp['Coa_Ethnicity_4'] ||
          supp['Co-Applicant Ethnicity 4'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 4']
      );
      const coaEthnicity5 = getTrimmed(
        supp['Coa_Ethnicity_5'] ||
          supp['Co-Applicant Ethnicity 5'] ||
          supp['Ethnicity of Co-Applicant or Co-Borrower: 5']
      );

      // Co-applicant race
      const coaRace1 = getTrimmed(
        supp['CoaRace_1'] ||
          supp['Co-Applicant Race 1'] ||
          supp['Race of Co-Applicant or Co-Borrower: 1']
      );
      const coaRace2 = getTrimmed(
        supp['CoaRace_2'] ||
          supp['Co-Applicant Race 2'] ||
          supp['Race of Co-Applicant or Co-Borrower: 2']
      );
      const coaRace3 = getTrimmed(
        supp['CoaRace_3'] ||
          supp['Co-Applicant Race 3'] ||
          supp['Race of Co-Applicant or Co-Borrower: 3']
      );
      const coaRace4 = getTrimmed(
        supp['CoaRace_4'] ||
          supp['Co-Applicant Race 4'] ||
          supp['Race of Co-Applicant or Co-Borrower: 4']
      );
      const coaRace5 = getTrimmed(
        supp['CoaRace_5'] ||
          supp['Co-Applicant Race 5'] ||
          supp['Race of Co-Applicant or Co-Borrower: 5']
      );

      // Address fields from supplemental
      const suppAddress = getTrimmed(
        supp['Address'] || supp['Subject Property Address'] || supp['Street Address']
      );
      const suppCity = getTrimmed(supp['City'] || supp['Subject Property City']);
      const suppState = getTrimmed(supp['State_abrv'] || supp['Subject Property State']);

      return {
        ...row,
        FirstName: firstName || row.FirstName,
        LastName: lastName || row.LastName,
        Coa_FirstName: coaFirstName || row.Coa_FirstName,
        Coa_LastName: coaLastName || row.Coa_LastName,
        Coa_Age: coaAge || row.Coa_Age,
        Coa_CreditScore: coaCreditScore || row.Coa_CreditScore,
        CoaSex: coaSex || row.CoaSex,
        Coa_CreditModel: coaCreditModel || row.Coa_CreditModel,
        Coa_Ethnicity_1: coaEthnicity1 || row.Coa_Ethnicity_1,
        Coa_Ethnicity_2: coaEthnicity2 || row.Coa_Ethnicity_2,
        Coa_Ethnicity_3: coaEthnicity3 || row.Coa_Ethnicity_3,
        Coa_Ethnicity_4: coaEthnicity4 || row.Coa_Ethnicity_4,
        Coa_Ethnicity_5: coaEthnicity5 || row.Coa_Ethnicity_5,
        CoaRace_1: coaRace1 || row.CoaRace_1,
        CoaRace_2: coaRace2 || row.CoaRace_2,
        CoaRace_3: coaRace3 || row.CoaRace_3,
        CoaRace_4: coaRace4 || row.CoaRace_4,
        CoaRace_5: coaRace5 || row.CoaRace_5,
        Lender: lender || row.Lender,
        AA_Processor: processor || row.AA_Processor,
        LDP_PostCloser: postCloser || row.LDP_PostCloser,
        APR: apr || row.APR,
        Rate_Lock_Date: rateLockDate || row.Rate_Lock_Date,
        LoanProgram: loanProgram || row.LoanProgram,
        RateType: rateType || row.RateType,
        BranchName: branchName || row.BranchName,
        Address: row.Address || suppAddress,
        City: row.City || suppCity,
        State_abrv: row.State_abrv || suppState,
        _merged: true,
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

  trackETLStep(
    'MergeSupplemental',
    primaryData.length,
    result.length,
    duration,
    [],
    mergeWarnings,
    {
      matchCount,
      matchRate: `${((matchCount / primaryData.length) * 100).toFixed(1)}%`,
      lookupMaps: {
        byULI: suppByULI.size,
        byLoanNum: suppByLoanNum.size,
        byAddress: suppByAddress.size,
      },
    }
  );

  return result;
};
