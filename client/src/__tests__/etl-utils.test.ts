import { describe, it, expect } from 'vitest';
import {
  excelDateToString,
  parseBorrowerName,
  mapAUSystem,
  mapAUSResult,
  formatCensusTract,
  deriveRateType,
  deriveVarTerm,
  convertLoanTermToYears,
  getLoanTermMonths,
  detectDelimiter,
} from '../lib/etl/utils';

describe('ETL Utilities', () => {
  describe('excelDateToString', () => {
    it('returns empty string for falsy values', () => {
      expect(excelDateToString(null)).toBe('');
      expect(excelDateToString(undefined)).toBe('');
      expect(excelDateToString('')).toBe('');
    });

    it('preserves date strings', () => {
      expect(excelDateToString('1/15/24')).toBe('1/15/24');
      expect(excelDateToString('2024-01-15')).toBe('2024-01-15');
    });

    it('converts YYYYMMDD format', () => {
      expect(excelDateToString('20241015')).toBe('10/15/24');
      expect(excelDateToString('20250101')).toBe('1/1/25');
    });

    it('converts Excel serial numbers', () => {
      // Excel serial 45000 is around 2023
      const result = excelDateToString(45000);
      expect(result).toMatch(/\d{1,2}\/\d{1,2}\/\d{2}/);
    });
  });

  describe('parseBorrowerName', () => {
    it('returns empty for empty input', () => {
      expect(parseBorrowerName('')).toEqual({ firstName: '', lastName: '' });
    });

    it('parses "LastName, FirstName" format', () => {
      expect(parseBorrowerName('Smith, John')).toEqual({
        firstName: 'John',
        lastName: 'Smith',
      });
    });

    it('parses "LastName, FirstName MiddleName" format', () => {
      expect(parseBorrowerName('Smith, John William')).toEqual({
        firstName: 'John',
        lastName: 'Smith',
      });
    });

    it('parses space-separated names', () => {
      expect(parseBorrowerName('John Smith')).toEqual({
        firstName: 'John',
        lastName: 'Smith',
      });
    });
  });

  describe('mapAUSystem', () => {
    it('returns empty for null/undefined', () => {
      expect(mapAUSystem(null)).toBe('');
      expect(mapAUSystem(undefined)).toBe('');
      expect(mapAUSystem('')).toBe('');
    });

    it('returns valid codes as-is', () => {
      expect(mapAUSystem('1')).toBe('1');
      expect(mapAUSystem('6')).toBe('6');
    });

    it('maps text values to codes', () => {
      expect(mapAUSystem('DU')).toBe('1');
      expect(mapAUSystem('Desktop Underwriter')).toBe('1');
      expect(mapAUSystem('LP')).toBe('2');
      expect(mapAUSystem('Loan Prospector')).toBe('2');
      expect(mapAUSystem('GUS')).toBe('4');
    });
  });

  describe('mapAUSResult', () => {
    it('returns empty for null/undefined', () => {
      expect(mapAUSResult(null)).toBe('');
      expect(mapAUSResult(undefined)).toBe('');
    });

    it('returns valid codes as-is', () => {
      expect(mapAUSResult('1')).toBe('1');
      expect(mapAUSResult('17')).toBe('17');
    });

    it('maps text values to codes', () => {
      expect(mapAUSResult('Approve/Eligible')).toBe('1');
      expect(mapAUSResult('Accept')).toBe('8');
      expect(mapAUSResult('Exempt')).toBe('17');
    });
  });

  describe('formatCensusTract', () => {
    it('returns empty for empty input', () => {
      expect(formatCensusTract('')).toBe('');
      expect(formatCensusTract(null)).toBe('');
    });

    it('preserves NA and Exempt', () => {
      expect(formatCensusTract('NA')).toBe('NA');
      expect(formatCensusTract('Exempt')).toBe('EXEMPT');
    });

    it('pads numeric tracts to 11 digits', () => {
      expect(formatCensusTract('13081010202')).toBe('13081010202');
      expect(formatCensusTract('1234567')).toBe('00001234567');
    });
  });

  describe('deriveRateType', () => {
    it('returns Fixed (1) for N/A values', () => {
      expect(deriveRateType(null)).toBe('1');
      expect(deriveRateType('')).toBe('1');
      expect(deriveRateType('N/A')).toBe('1');
      expect(deriveRateType('NA')).toBe('1');
    });

    it('returns Variable (2) for numeric values', () => {
      expect(deriveRateType('60')).toBe('2');
      expect(deriveRateType(84)).toBe('2');
    });
  });

  describe('deriveVarTerm', () => {
    it('returns empty for fixed rate loans', () => {
      expect(deriveVarTerm(null)).toBe('');
      expect(deriveVarTerm('N/A')).toBe('');
    });

    it('converts months to years with ceiling', () => {
      expect(deriveVarTerm('12')).toBe('1');
      expect(deriveVarTerm('13')).toBe('2');
      expect(deriveVarTerm('60')).toBe('5');
      expect(deriveVarTerm('84')).toBe('7');
    });
  });

  describe('convertLoanTermToYears', () => {
    it('returns empty for invalid input', () => {
      expect(convertLoanTermToYears('')).toBe('');
      expect(convertLoanTermToYears(null)).toBe('');
    });

    it('converts months to years with floor', () => {
      expect(convertLoanTermToYears(360)).toBe('30');
      expect(convertLoanTermToYears(180)).toBe('15');
      expect(convertLoanTermToYears(18)).toBe('1'); // floor, not round
    });
  });

  describe('getLoanTermMonths', () => {
    it('returns empty for invalid input', () => {
      expect(getLoanTermMonths('')).toBe('');
      expect(getLoanTermMonths(null)).toBe('');
    });

    it('preserves month values', () => {
      expect(getLoanTermMonths(360)).toBe('360');
      expect(getLoanTermMonths(180)).toBe('180');
    });

    it('converts small values (years) to months', () => {
      expect(getLoanTermMonths(30)).toBe('360');
      expect(getLoanTermMonths(15)).toBe('180');
    });
  });

  describe('detectDelimiter', () => {
    it('detects pipe delimiter', () => {
      const content = 'field1|field2|field3\nvalue1|value2|value3';
      expect(detectDelimiter(content)).toBe('|');
    });

    it('detects tilde delimiter', () => {
      const content = 'field1~field2~field3~field4~field5~field6~field7~field8~field9~field10\n';
      expect(detectDelimiter(content)).toBe('~');
    });

    it('returns pipe as default for empty content', () => {
      expect(detectDelimiter('')).toBe('|');
    });
  });
});
