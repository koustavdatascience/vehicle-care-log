import { isValidIsoDate } from "../domain/services";

export interface CsvDateRange {
  readonly startOn: string | null;
  readonly endOn: string | null;
}

export interface CsvDateRangeValidation {
  readonly ok: boolean;
  readonly range: CsvDateRange | null;
  readonly startError: string | undefined;
  readonly endError: string | undefined;
}

/**
 * Validates a user-selected inclusive calendar range before it reaches the
 * local export selector. ISO strings sort chronologically, so a lexical range
 * comparison is safe only after strict ISO calendar validation succeeds.
 */
export function validateCustomCsvDateRange(range: CsvDateRange): CsvDateRangeValidation {
  if (range.startOn !== null && !isValidIsoDate(range.startOn)) {
    return { ok: false, range: null, startError: "Choose a valid start date.", endError: undefined };
  }
  if (range.endOn !== null && !isValidIsoDate(range.endOn)) {
    return { ok: false, range: null, startError: undefined, endError: "Choose a valid end date." };
  }
  if (range.startOn !== null && range.endOn !== null && range.endOn < range.startOn) {
    return { ok: false, range: null, startError: undefined, endError: "The end date cannot be before the start date." };
  }
  return { ok: true, range, startError: undefined, endError: undefined };
}
