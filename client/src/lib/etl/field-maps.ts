/**
 * Field Mappings - Maps source file column names to standardized HMDA field names
 */

/**
 * HMDA Template - Exactly 126 columns as specified by CFPB
 * Column numbering: 1-126 (1-indexed in template, 0-indexed in array)
 * This is the single source of truth for column order - matches HMDA_Template_Updated.xls
 */
export const HMDA_COLUMN_ORDER: string[] = [
  'Branch_Name',           // Col 1 (index 0)
  'Branch',                // Col 2
  'LEI',                   // Col 3
  'ULI',                   // Col 4
  'LastName',              // Col 5
  'FirstName',             // Col 6
  'Coa_LastName',          // Col 7
  'Coa_FirstName',         // Col 8
  'Lender',                // Col 9
  'AA_Processor',          // Col 10
  'LDP_PostCloser',        // Col 11
  'ErrorMadeBy',           // Col 12
  'ApplDate',              // Col 13
  'LoanType',              // Col 14
  'Purpose',               // Col 15
  'ConstructionMethod',    // Col 16
  'OccupancyType',         // Col 17
  'LoanAmountInDollars',   // Col 18 (Column R in Excel)
  'Preapproval',           // Col 19
  'Action',                // Col 20
  'ActionDate',            // Col 21
  'Address',               // Col 22
  'City',                  // Col 23
  'State_abrv',            // Col 24
  'Zip',                   // Col 25
  'County_5',              // Col 26
  'Tract_11',              // Col 27
  'Ethnicity_1',           // Col 28
  'Ethnicity_2',           // Col 29
  'Ethnicity_3',           // Col 30
  'Ethnicity_4',           // Col 31
  'Ethnicity_5',           // Col 32
  'EthnicityOther',        // Col 33
  'Coa_Ethnicity_1',       // Col 34
  'Coa_Ethnicity_2',       // Col 35
  'Coa_Ethnicity_3',       // Col 36
  'Coa_Ethnicity_4',       // Col 37
  'Coa_Ethnicity_5',       // Col 38
  'Coa_EthnicityOther',    // Col 39
  'Ethnicity_Determinant', // Col 40
  'Coa_Ethnicity_Determinant', // Col 41
  'Race_1',                // Col 42
  'Race_2',                // Col 43
  'Race_3',                // Col 44
  'Race_4',                // Col 45
  'Race_5',                // Col 46
  'Race1_Other',           // Col 47
  'Race27_Other',          // Col 48
  'Race44_Other',          // Col 49
  'CoaRace_1',             // Col 50
  'CoaRace_2',             // Col 51
  'CoaRace_3',             // Col 52
  'CoaRace_4',             // Col 53
  'CoaRace_5',             // Col 54
  'CoaRace1_Other',        // Col 55
  'CoaRace27_Other',       // Col 56
  'CoaRace44_Other',       // Col 57
  'Race_Determinant',      // Col 58
  'CoaRace_Determinant',   // Col 59
  'Sex',                   // Col 60
  'CoaSex',                // Col 61
  'Sex_Determinant',       // Col 62
  'CoaSex_Determinant',    // Col 63
  'Age',                   // Col 64
  'Coa_Age',               // Col 65
  'Income',                // Col 66
  'Purchaser',             // Col 67
  'Rate_Spread',           // Col 68
  'HOEPA_Status',          // Col 69
  'Lien_Status',           // Col 70
  'CreditScore',           // Col 71
  'Coa_CreditScore',       // Col 72
  'CreditModel',           // Col 73
  'CreditModelOther',      // Col 74
  'Coa_CreditModel',       // Col 75
  'Coa_CreditModelOther',  // Col 76
  'Denial1',               // Col 77
  'Denial2',               // Col 78
  'Denial3',               // Col 79
  'Denial4',               // Col 80
  'DenialOther',           // Col 81
  'TotalLoanCosts',        // Col 82
  'TotalPtsAndFees',       // Col 83
  'OrigFees',              // Col 84
  'DiscountPts',           // Col 85
  'LenderCredts',          // Col 86
  'InterestRate',          // Col 87
  'APR',                   // Col 88
  'Rate_Lock_Date',        // Col 89
  'PPPTerm',               // Col 90
  'DTIRatio',              // Col 91
  'DSC',                   // Col 92
  'CLTV',                  // Col 93
  'Loan_Term',             // Col 94 - Years (e.g., 30)
  'Loan_Term_Months',      // Col 95 - Months (e.g., 360)
  'IntroRatePeriod',       // Col 96
  'BalloonPMT',            // Col 97
  'IOPMT',                 // Col 98
  'NegAM',                 // Col 99
  'NonAmortz',             // Col 100
  'PropertyValue',         // Col 101
  'MHSecPropType',         // Col 102
  'MHLandPropInt',         // Col 103
  'TotalUnits',            // Col 104
  'MFAHU',                 // Col 105
  'APPMethod',             // Col 106
  'PayableInst',           // Col 107
  'NMLSRID',               // Col 108
  'AUSystem1',             // Col 109
  'AUSystem2',             // Col 110
  'AUSystem3',             // Col 111
  'AUSystem4',             // Col 112
  'AUSystem5',             // Col 113
  'AUSystemOther',         // Col 114
  'AUSResult1',            // Col 115
  'AUSResult2',            // Col 116
  'AUSResult3',            // Col 117
  'AUSResult4',            // Col 118
  'AUSResult5',            // Col 119
  'AUSResultOther',        // Col 120
  'REVMTG',                // Col 121
  'OpenLOC',               // Col 122
  'BUSCML',                // Col 123
  'EditStatus',            // Col 124
  'EditCkComments',        // Col 125
  'Comments',              // Col 126
];

// Alias for backwards compatibility
export const CRA_WIZ_128_COLUMNS = HMDA_COLUMN_ORDER;

/**
 * COMPREHENSIVE Encompass field name mapping
 * Maps Encompass long names to our standard short names
 */
export const ENCOMPASS_FIELD_MAP: Record<string, string> = {
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
  'CensusTract': 'Tract_11',
  'Census_Tract': 'Tract_11',
  'FFIEC Census Tract': 'Tract_11',
  'Tract Number': 'Tract_11',
  'Census Tract Number': 'Tract_11',
  'TRACT': 'Tract_11',

  // Borrower Demographics - Primary Applicant
  'Applicant Ethnicity 1': 'Ethnicity_1',
  'Applicant Ethnicity-1': 'Ethnicity_1',
  'Ethnicity of Applicant or Borrower: 1': 'Ethnicity_1',
  'Applicant Ethnicity 2': 'Ethnicity_2',
  'Ethnicity of Applicant or Borrower: 2': 'Ethnicity_2',
  'Applicant Ethnicity 3': 'Ethnicity_3',
  'Ethnicity of Applicant or Borrower: 3': 'Ethnicity_3',
  'Applicant Ethnicity 4': 'Ethnicity_4',
  'Ethnicity of Applicant or Borrower: 4': 'Ethnicity_4',
  'Applicant Ethnicity 5': 'Ethnicity_5',
  'Ethnicity of Applicant or Borrower: 5': 'Ethnicity_5',
  'Applicant Ethnicity: Free Form Text Field': 'EthnicityOther',
  'Ethnicity of Applicant or Borrower: Conditional Free Form Text Field for Code 14': 'EthnicityOther',
  'Ethnicity of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Ethnicity_Determinant',
  'Applicant Ethnicity Basis': 'Ethnicity_Determinant',

  // Borrower Demographics - Co-Applicant Ethnicity
  'Co-Applicant Ethnicity 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity-1': 'Coa_Ethnicity_1',
  'Ethnicity of Co-Applicant or Co-Borrower: 1': 'Coa_Ethnicity_1',
  'Ethnicity of Co-Applicant or CoBorrower: 1': 'Coa_Ethnicity_1',
  'Co-Applicant Ethnicity 2': 'Coa_Ethnicity_2',
  'Ethnicity of Co-Applicant or Co-Borrower: 2': 'Coa_Ethnicity_2',
  'Ethnicity of Co-Applicant or CoBorrower: 2': 'Coa_Ethnicity_2',
  'Co-Applicant Ethnicity 3': 'Coa_Ethnicity_3',
  'Ethnicity of Co-Applicant or Co-Borrower: 3': 'Coa_Ethnicity_3',
  'Ethnicity of Co-Applicant or CoBorrower: 3': 'Coa_Ethnicity_3',
  'Co-Applicant Ethnicity 4': 'Coa_Ethnicity_4',
  'Ethnicity of Co-Applicant or Co-Borrower: 4': 'Coa_Ethnicity_4',
  'Ethnicity of Co-Applicant or CoBorrower: 4': 'Coa_Ethnicity_4',
  'Co-Applicant Ethnicity 5': 'Coa_Ethnicity_5',
  'Ethnicity of Co-Applicant or Co-Borrower: 5': 'Coa_Ethnicity_5',
  'Ethnicity of Co-Applicant or CoBorrower: 5': 'Coa_Ethnicity_5',
  'Co-Applicant Ethnicity: Free Form Text Field': 'Coa_EthnicityOther',
  'Ethnicity of Co-Applicant or CoBorrower: Conditional Free Form Text Field for Code 14': 'Coa_EthnicityOther',
  'Ethnicity of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'Coa_Ethnicity_Determinant',
  'Ethnicity of Co-Applicant or CoBorrower Collected on the Basis of Visual Observation or Surname': 'Coa_Ethnicity_Determinant',
  'Co-Applicant Ethnicity Basis': 'Coa_Ethnicity_Determinant',

  // Borrower Demographics - Race Primary
  'Applicant Race 1': 'Race_1',
  'Applicant Race-1': 'Race_1',
  'Race of Applicant or Borrower: 1': 'Race_1',
  'Applicant Race 2': 'Race_2',
  'Race of Applicant or Borrower: 2': 'Race_2',
  'Applicant Race 3': 'Race_3',
  'Race of Applicant or Borrower: 3': 'Race_3',
  'Applicant Race 4': 'Race_4',
  'Race of Applicant or Borrower: 4': 'Race_4',
  'Applicant Race 5': 'Race_5',
  'Race of Applicant or Borrower: 5': 'Race_5',
  'Applicant Race: Free Form Text Field for American Indian or Alaska Native Enrolled or Principal Tribe': 'Race1_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 1': 'Race1_Other',
  'Applicant Race: Free Form Text Field for Other Asian': 'Race27_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 27': 'Race27_Other',
  'Applicant Race: Free Form Text Field for Other Pacific Islander': 'Race44_Other',
  'Race of Applicant or Borrower: Conditional Free Form Text Field for Code 44': 'Race44_Other',
  'Race of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Race_Determinant',
  'Applicant Race Basis': 'Race_Determinant',

  // Borrower Demographics - Race Co-Applicant
  'Co-Applicant Race 1': 'CoaRace_1',
  'Co-Applicant Race-1': 'CoaRace_1',
  'Race of Co-Applicant or Co-Borrower: 1': 'CoaRace_1',
  'Race of CoApplicant or Co-Borrower: 1': 'CoaRace_1',
  'Co-Applicant Race 2': 'CoaRace_2',
  'Race of Co-Applicant or Co-Borrower: 2': 'CoaRace_2',
  'Race of CoApplicant or Co-Borrower: 2': 'CoaRace_2',
  'Co-Applicant Race 3': 'CoaRace_3',
  'Race of Co-Applicant or Co-Borrower: 3': 'CoaRace_3',
  'Race of CoApplicant or Co-Borrower: 3': 'CoaRace_3',
  'Co-Applicant Race 4': 'CoaRace_4',
  'Race of Co-Applicant or Co-Borrower: 4': 'CoaRace_4',
  'Race of CoApplicant or Co-Borrower: 4': 'CoaRace_4',
  'Co-Applicant Race 5': 'CoaRace_5',
  'Race of Co-Applicant or Co-Borrower: 5': 'CoaRace_5',
  'Race of CoApplicant or Co-Borrower: 5': 'CoaRace_5',
  'Co-Applicant Race: Free Form Text Field for American Indian or Alaska Native': 'CoaRace1_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 1': 'CoaRace1_Other',
  'Co-Applicant Race: Free Form Text Field for Other Asian': 'CoaRace27_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 27': 'CoaRace27_Other',
  'Co-Applicant Race: Free Form Text Field for Other Pacific Islander': 'CoaRace44_Other',
  'Race of CoApplicant or Co-Borrower: Conditional Free Form Text Field for Code 44': 'CoaRace44_Other',
  'Race of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaRace_Determinant',
  'Race of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaRace_Determinant',
  'Co-Applicant Race Basis': 'CoaRace_Determinant',

  // Sex/Gender
  'Sex of Applicant or Borrower': 'Sex',
  'Applicant Sex': 'Sex',
  'Sex of Co-Applicant or Co-Borrower': 'CoaSex',
  'Sex of CoApplicant or Co-Borrower': 'CoaSex',
  'Co-Applicant Sex': 'CoaSex',
  'Sex of Applicant or Borrower Collected on the Basis of Visual Observation or Surname': 'Sex_Determinant',
  'Applicant Sex Basis': 'Sex_Determinant',
  'Sex of Co-Applicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaSex_Determinant',
  'Sex of CoApplicant or Co-Borrower Collected on the Basis of Visual Observation or Surname': 'CoaSex_Determinant',
  'Co-Applicant Sex Basis': 'CoaSex_Determinant',

  // Age
  'Age of Applicant or Borrower': 'Age',
  'Applicant Age': 'Age',
  'Age of Co-Applicant or Co-Borrower': 'Coa_Age',
  'Age of CoApplicant or Co-Borrower': 'Coa_Age',
  'Co-Applicant Age': 'Coa_Age',

  // Income and Financial
  'Income': 'Income',
  'Gross Annual Income': 'Income',
  'Applicant Income': 'Income',
  'Debt-toIncome Ratio': 'DTIRatio',
  'Debt-to-Income Ratio': 'DTIRatio',
  'Debt to Income Ratio': 'DTIRatio',
  'DTI Ratio': 'DTIRatio',
  'DTI': 'DTIRatio',
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
  'Credit Score of Co-Applicant or CoBorrower': 'Coa_CreditScore',
  'Co-Applicant Credit Score': 'Coa_CreditScore',
  
  // Credit Model
  'Name and Version of Credit Scoring Model': 'CreditModel',
  'Credit Scoring Model': 'CreditModel',
  'Credit Score Type Used': 'CreditModel',
  'Credit Model': 'CreditModel',
  'Applicant or Borrower, Name and Version of Credit Scoring Model': 'CreditModel',
  'Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8': 'CreditModelOther',
  'Applicant or Borrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8': 'CreditModelOther',

  // Co-Applicant Credit Model
  'Co-Applicant Credit Scoring Model': 'Coa_CreditModel',
  'Credit Score Type of Co-Applicant or Co-Borrower': 'Coa_CreditModel',
  'Credit Score Type Used for Co-Applicant': 'Coa_CreditModel',
  'Name and Version of Credit Scoring Model of Co-Applicant or Co-Borrower': 'Coa_CreditModel',
  'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model': 'Coa_CreditModel',
  'Co-Applicant Name and Version of Credit Scoring Model: Conditional Free Form Text Field': 'Coa_CreditModelOther',
  'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model: Conditional Free Form Text Field for Code 8': 'Coa_CreditModelOther',

  // Denial Reasons
  'Denial Reason 1': 'Denial1',
  'Reason for Denial: 1': 'Denial1',
  'Denial Reason 2': 'Denial2',
  'Reason for Denial: 2': 'Denial2',
  'Denial Reason 3': 'Denial3',
  'Reason for Denial: 3': 'Denial3',
  'Denial Reason 4': 'Denial4',
  'Reason for Denial: 4': 'Denial4',
  'Denial Reason: Free Form Text Field': 'DenialOther',
  'Reason for Denial: Conditional Free Form Text Field for Code 9': 'DenialOther',

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
  'Intro Rate Period': 'IntroRatePeriod',
  'IntroRatePeriod': 'IntroRatePeriod',
  'Initial Rate Period': 'IntroRatePeriod',
  'ARM Initial Rate Period': 'IntroRatePeriod',
  'Balloon Payment': 'BalloonPMT',
  'Interest-Only Payments': 'IOPMT',
  'Negative Amortization': 'NegAM',
  'Non-Amortizing Features': 'NonAmortz',
  'Other Nonamortizing Features': 'NonAmortz',

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
  
  // NMLSRID
  'NMLS ID': 'NMLSRID',
  'Mortgage Loan Originator NMLSR Identifier': 'NMLSRID',
  'NMLSR Identifier': 'NMLSRID',
  'Mortgage Loan Originator NMLS ID': 'NMLSRID',
  'MLO NMLS ID': 'NMLSRID',
  'Originator NMLS': 'NMLSRID',
  'MLO NMLSR ID': 'NMLSRID',
  'Originator NMLSR ID': 'NMLSRID',
  'Loan Originator NMLSR ID': 'NMLSRID',

  // AUS
  'Automated Underwriting System 1': 'AUSystem1',
  'Automated Underwriting System: 1': 'AUSystem1',
  'AUS 1': 'AUSystem1',
  'AUS: 1': 'AUSystem1',
  'AUS System 1': 'AUSystem1',
  'AUSystem1': 'AUSystem1',
  'AUS Name': 'AUSystem1',
  'AUS Type': 'AUSystem1',
  'AUS': 'AUSystem1',
  'Automated Underwriting System 2': 'AUSystem2',
  'Automated Underwriting System: 2': 'AUSystem2',
  'Automated Underwriting System 3': 'AUSystem3',
  'Automated Underwriting System: 3': 'AUSystem3',
  'Automated Underwriting System 4': 'AUSystem4',
  'Automated Underwriting System: 4': 'AUSystem4',
  'Automated Underwriting System 5': 'AUSystem5',
  'Automated Underwriting System: 5': 'AUSystem5',
  'Automated Underwriting System: Free Form Text Field': 'AUSystemOther',
  'Automated Underwriting System: Conditional Free Form Text Field for Code 5': 'AUSystemOther',
  
  // AUS Results
  'AUS Result 1': 'AUSResult1',
  'AUSResult1': 'AUSResult1',
  'Automated Underwriting System Result: 1': 'AUSResult1',
  'AUS Recommendation': 'AUSResult1',
  'AUS Result': 'AUSResult1',
  'AUS Decision': 'AUSResult1',
  'AUS Result 2': 'AUSResult2',
  'Automated Underwriting System Result: 2': 'AUSResult2',
  'AUS Result 3': 'AUSResult3',
  'Automated Underwriting System Result: 3': 'AUSResult3',
  'AUS Result 4': 'AUSResult4',
  'Automated Underwriting System Result: 4': 'AUSResult4',
  'AUS Result 5': 'AUSResult5',
  'Automated Underwriting System Result: 5': 'AUSResult5',
  'AUS Result: Free Form Text Field': 'AUSResultOther',
  'Automated Underwriting System Result: Conditional Free Form Text Field for Code 16': 'AUSResultOther',

  // Special Loan Types
  'Reverse Mortgage': 'REVMTG',
  'Open-End Line of Credit': 'OpenLOC',
  'Business or Commercial Purpose': 'BUSCML',

  // Additional Fields from Supplemental File
  'Borrower First Name': 'FirstName',
  'Borrower Last Name': 'LastName',
  'Co-Borrower First Name': 'Coa_FirstName',
  'CoBorrower First Name': 'Coa_FirstName',
  'Co-Applicant First Name': 'Coa_FirstName',
  'Co-Borrower Last Name': 'Coa_LastName',
  'CoBorrower Last Name': 'Coa_LastName',
  'Co-Applicant Last Name': 'Coa_LastName',
  'Loan Officer': 'Lender',
  'Loan Processor': 'AA_Processor',
  'Post Closer': 'LDP_PostCloser',
  'Loan Program': 'LoanProgram',
  'Rate Type': 'RateType',
  'Product Type': 'ProductType',
  'Variable Rate Term': 'Var_Term',
  
  // Additional Fields file specific column names
  'Subject Property Address': 'Address',
  'Subject Property City': 'City',
  'Subject Property State': 'State_abrv',
  'Loan Team Member Name - Post Closer': 'LDP_PostCloser',
  'Borrower Name': 'BorrowerFullName',
};

/**
 * HMDA LAR (Compliance Reporter) field positions
 * Based on actual Compliance Reporter Export structure
 */
export const COMPLIANCE_REPORTER_FIELD_MAP: Record<number, string> = {
  // Record identifier
  0: 'RecordType',        // 1=header, 2=data
  1: 'LEI',               // Legal Entity Identifier
  2: 'ULI',               // Universal Loan Identifier
  3: 'ApplDate',          // Application Date (YYYYMMDD)
  4: 'LoanType',          // Loan Type
  5: 'Purpose',           // Loan Purpose
  6: 'Preapproval',       // Preapproval
  7: 'ConstructionMethod', // Construction Method
  8: 'OccupancyType',     // Occupancy Type
  9: 'LoanAmount',        // Loan Amount
  10: 'Action',           // Action Taken
  11: 'ActionDate',       // Action Taken Date (YYYYMMDD)
  12: 'Address',          // Street Address
  13: 'City',             // City
  14: 'State_abrv',       // State
  15: 'Zip',              // ZIP Code
  16: 'County_5',         // County Code
  17: 'Tract_11',         // Census Tract
  // Applicant Ethnicity (positions 18-23)
  18: 'Ethnicity_1',
  19: 'Ethnicity_2',
  20: 'Ethnicity_3',
  21: 'Ethnicity_4',
  22: 'Ethnicity_5',
  23: 'EthnicityOther',
  // Co-Applicant Ethnicity (positions 24-29)
  24: 'Coa_Ethnicity_1',
  25: 'Coa_Ethnicity_2',
  26: 'Coa_Ethnicity_3',
  27: 'Coa_Ethnicity_4',
  28: 'Coa_Ethnicity_5',
  29: 'Coa_EthnicityOther',
  // Ethnicity Determinants (positions 30-31)
  30: 'Ethnicity_Determinant',
  31: 'Coa_Ethnicity_Determinant',
  // Applicant Race (positions 32-39)
  32: 'Race_1',
  33: 'Race_2',
  34: 'Race_3',
  35: 'Race_4',
  36: 'Race_5',
  37: 'Race1_Other',
  38: 'Race27_Other',
  39: 'Race44_Other',
  // Co-Applicant Race (positions 40-47)
  40: 'CoaRace_1',
  41: 'CoaRace_2',
  42: 'CoaRace_3',
  43: 'CoaRace_4',
  44: 'CoaRace_5',
  45: 'CoaRace1_Other',
  46: 'CoaRace27_Other',
  47: 'CoaRace44_Other',
  // Race Determinants (positions 48-49)
  48: 'Race_Determinant',
  49: 'CoaRace_Determinant',
  // Sex (positions 50-53)
  50: 'Sex',
  51: 'CoaSex',
  52: 'Sex_Determinant',
  53: 'CoaSex_Determinant',
  // Age (positions 54-55)
  54: 'Age',
  55: 'Coa_Age',
  // Financial (positions 56-60)
  56: 'Income',
  57: 'Purchaser',
  58: 'Rate_Spread',
  59: 'HOEPA_Status',
  60: 'Lien_Status',
  // Credit Score (positions 61-66)
  61: 'CreditScore',
  62: 'Coa_CreditScore',
  63: 'CreditModel',
  64: 'CreditModelOther',
  65: 'Coa_CreditModel',
  66: 'Coa_CreditModelOther',
  // Denial Reasons (positions 67-71)
  67: 'Denial1',
  68: 'Denial2',
  69: 'Denial3',
  70: 'Denial4',
  71: 'DenialOther',
  // Loan Costs (positions 72-76)
  72: 'TotalLoanCosts',
  73: 'TotalPtsAndFees',
  74: 'OrigFees',
  75: 'DiscountPts',
  76: 'LenderCredts',
  // Rate Info (positions 77-79)
  77: 'InterestRate',
  78: 'PPPTerm',
  79: 'DTIRatio',
  // Loan Terms (positions 80-86)
  80: 'CLTV',
  81: 'Loan_Term',
  82: 'IntroRatePeriod',
  83: 'BalloonPMT',
  84: 'IOPMT',
  85: 'NegAM',
  86: 'NonAmortz',
  // Property (positions 87-91)
  87: 'PropertyValue',
  88: 'MHSecPropType',
  89: 'MHLandPropInt',
  90: 'TotalUnits',
  91: 'MFAHU',
  // Application (positions 92-94)
  92: 'APPMethod',
  93: 'PayableInst',
  94: 'NMLSRID',
  // AUS (positions 95-106)
  95: 'AUSystem1',
  96: 'AUSystem2',
  97: 'AUSystem3',
  98: 'AUSystem4',
  99: 'AUSystem5',
  100: 'AUSystemOther',
  101: 'AUSResult1',
  102: 'AUSResult2',
  103: 'AUSResult3',
  104: 'AUSResult4',
  105: 'AUSResult5',
  106: 'AUSResultOther',
  // Special Loan Types (positions 107-109)
  107: 'REVMTG',
  108: 'OpenLOC',
  109: 'BUSCML',
};

/**
 * Convert Encompass field names to standard names
 */
export const normalizeFieldName = (fieldName: string): string => {
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
 * Comprehensive variations map for field name lookups
 */
export const FIELD_VARIATIONS: Record<string, string[]> = {
  'LEI': ['LEI', 'Legal Entity Identifier (LEI)', 'Legal Entity Identifier'],
  'ULI': ['ULI', 'Universal Loan Identifier (ULI)', 'Universal Loan Identifier'],
  'ApplNumb': ['ApplNumb', 'Loan Number', 'Loan ID', 'Application Number', 'LoanNumber'],
  'LastName': ['LastName', 'Last Name', 'Borrower Last Name', 'Applicant Last Name', 'LASTNAME'],
  'FirstName': ['FirstName', 'First Name', 'Borrower First Name', 'Applicant First Name', 'FIRSTNAME'],
  'Coa_LastName': ['Coa_LastName', 'Co-Borrower Last Name', 'Co-Applicant Last Name', 'CoBorrower Last Name', 'CLASTNAME', 'CoLastName'],
  'Coa_FirstName': ['Coa_FirstName', 'Co-Borrower First Name', 'Co-Applicant First Name', 'CoBorrower First Name', 'CFIRSTNAME', 'CoFirstName'],
  'LoanAmount': ['LoanAmount', 'Loan Amount', 'Loan Amount in Dollars', 'LOANAMOUNTINDOLLARS', 'LoanAmountInDollars'],
  'Address': ['Address', 'Street Address', 'Property Address', 'Property Street', 'Subject Property Address', 'ADDRESS'],
  'City': ['City', 'Property City', 'Subject Property City', 'CITY'],
  'State_abrv': ['State_abrv', 'State', 'Property State', 'STATE_ABRV', 'STATE'],
  'Zip': ['Zip', 'ZIP Code', 'Property ZIP Code', 'ZipCode', 'ZIP'],
  'County_5': ['County_5', 'County', 'County Code', 'COUNTY_5'],
  'Tract_11': ['Tract_11', 'Census Tract', 'Tract', 'TRACT_11', 'CensusTract', 'Census_Tract', 'FFIEC Census Tract', 'Tract Number', 'Census Tract Number', 'TRACT'],
  'ApplDate': ['ApplDate', 'Application Date', 'ApplicationDate', 'APPLDATE'],
  'ActionDate': ['ActionDate', 'Action Taken Date', 'Action Date', 'ACTIONDATE'],
  'Action': ['Action', 'Action Taken', 'ACTION'],
  'LoanType': ['LoanType', 'Loan Type', 'LOANTYPE'],
  'Purpose': ['Purpose', 'Loan Purpose', 'PURPOSE'],
  'Purchaser': ['Purchaser', 'Type of Purchaser', 'Purchaser Type', 'PURCHASER'],
  'Income': ['Income', 'Gross Annual Income', 'Applicant Income', 'INCOME'],
  'CreditScore': ['CreditScore', 'Credit Score', 'Applicant Credit Score', 'Credit Score of Applicant or Borrower', 'CREDITSCORE'],
  'Coa_CreditScore': ['Coa_CreditScore', 'Co-Applicant Credit Score', 'Credit Score of Co-Applicant or Co-Borrower', 'Credit Score of Co-Applicant or CoBorrower', 'COA_CREDITSCORE'],
  'Age': ['Age', 'Applicant Age', 'Age of Applicant or Borrower', 'AGE'],
  'Coa_Age': ['Coa_Age', 'Co-Applicant Age', 'Age of Co-Applicant or Co-Borrower', 'Age of CoApplicant or Co-Borrower', 'COA_AGE'],
  'Sex': ['Sex', 'Applicant Sex', 'Sex of Applicant or Borrower', 'SEX'],
  'CoaSex': ['CoaSex', 'Co-Applicant Sex', 'Sex of Co-Applicant or Co-Borrower', 'Sex of CoApplicant or Co-Borrower', 'COASEX'],
  'CreditModel': ['CreditModel', 'Credit Scoring Model', 'Name and Version of Credit Scoring Model', 'Credit Score Type Used', 'Credit Model', 'Applicant or Borrower, Name and Version of Credit Scoring Model', 'CREDITMODEL'],
  'Coa_CreditModel': ['Coa_CreditModel', 'Co-Applicant Credit Scoring Model', 'Co-Applicant or CoBorrower, Name and Version of Credit Scoring Model', 'Credit Score Type Used for Co-Applicant', 'Coa Credit Model', 'COA_CREDITMODEL'],
  'NMLSRID': ['NMLSRID', 'NMLS ID', 'Originator NMLSR ID', 'Loan Originator NMLSR ID', 'Mortgage Loan Originator NMLSR Identifier', 'NMLSR Identifier', 'MLO NMLS ID', 'Mortgage Loan Originator NMLS ID'],
  'AUSystem1': ['AUSystem1', 'AUS', 'AUS 1', 'Automated Underwriting System 1', 'Automated Underwriting System: 1', 'AUS System 1', 'AUS Name', 'AUS Type'],
  'AUSResult1': ['AUSResult1', 'AUS Result', 'AUS Result 1', 'Automated Underwriting System Result: 1', 'AUS Recommendation', 'AUS Decision'],
  'APR': ['APR', 'Annual Percentage Rate'],
  'Rate_Lock_Date': ['Rate_Lock_Date', 'Rate Lock Date', 'Lock Date', 'RATE_LOCK_DATE'],
};
