# Code delivery file (Umowa o Dzieło)

## File to send

- **`docs/CODE_DELIVERY.txt`** — Single file containing all project source code (85 files), with clear section headers per file.

## How to get DOCX or PDF

1. Open **`CODE_DELIVERY.txt`** in **Microsoft Word** (or LibreOffice).
2. Set font to a fixed-width font (e.g. **Consolas** or **Courier New**, 10–11 pt) so the code is readable and page count is consistent.
3. **Save As** → choose **Word Document (.docx)** or **PDF**.

Page count in Word = number of pages of code for the valuation rule (1 page = 2,000 PLN gross).

## Page count and withdrawal

- **Valuation:** 1 page of code = 2,000 PLN gross.
- **Required pages** = Withdrawal (PLN gross) ÷ 2,000 (round up if needed).

If the full file is more pages than you need for a given withdrawal, trim the document in Word to the required number of pages before saving as DOCX/PDF, or regenerate with fewer files (edit `scripts/generate-code-delivery.js` and change the `INCLUDE` list or add exclusions).

## Regenerating the file

```bash
node scripts/generate-code-delivery.js
```

Output is written to `docs/CODE_DELIVERY.txt`.

## Documentation to attach

Per Umowa o Dzieło rules, each code delivery must be accompanied by a **short description** stating:
- the **programming language(s)** (e.g. TypeScript, TSX),
- the **functionality / purpose** of the code.

Use **`docs/CODE_DELIVERY_DESCRIPTION_TEMPLATE.md`** (or the filled version) and attach it together with the code DOCX/PDF.
