# Colony Bank HMDA/CRA Tool - Testing Instructions

## Quick Test Process (5 minutes)

Follow these exact steps to test the system with realistic HMDA data:

---

## Step 1: Access the Application

1. Open the application in your browser
2. You'll see the Colony Bank login screen

---

## Step 2: Login

1. Enter password: `ColonyBank2024!`
2. Click **"Authenticate"**
3. You should see the main dashboard with tabs at the top

---

## Step 3: Upload Test Files

Navigate to the **"Data Sources"** tab (should be active by default)

### Upload File A - LaserPro Export

1. Find the section labeled **"Input A: LaserPro Export"**
2. Click **"Browse files"** or drag-and-drop
3. Select file: `01_LaserPro_Export.xlsx`
   - **Location**: `client/public/test_data/01_LaserPro_Export.xlsx`
4. Wait for confirmation message: "Successfully loaded 15 records from 01_LaserPro_Export.xlsx"

### Upload File B - Encompass Export

1. Find the section labeled **"Input B: Encompass Export"**
2. Click **"Browse files"** or drag-and-drop
3. Select file: `02_Encompass_Export.xlsx`
   - **Location**: `client/public/test_data/02_Encompass_Export.xlsx`
4. Wait for confirmation message: "02_Encompass_Export.xlsx ready for processing"

### Upload File C - Supplemental Data

1. Find the section labeled **"Input C: Supplemental Data"**
2. Click **"Browse files"** or drag-and-drop
3. Select file: `03_Supplemental_Export.xlsx`
   - **Location**: `client/public/test_data/03_Supplemental_Export.xlsx`
4. Wait for confirmation message: "03_Supplemental_Export.xlsx ready for processing"

---

## Step 4: Run the ETL Automation

1. Click the green **"Continue to Phase 2"** button at the bottom
2. You'll be taken to the **"ETL Process"** tab
3. Click the **"Run Automation"** button
4. Watch the processing logs appear in real-time:

**Expected log output:**
```
Starting Comprehensive ETL Process...
Phase 1: Filtering by current month (November 2025)...
Filtered: Kept X records out of 15 total
Phase 2: Transforming Encompass Data...
Phase 2 (Step 2): Merging Supplemental Data...
Phase 2 (Step 3): Cleaning & Formatting...
Phase 3: Simulating CRA Wiz Validation...
Validation complete: Found 4 issues
ETL Process Complete.
```

5. Processing should complete in 2-3 seconds
6. System automatically advances to **"Review & Scrub"** tab

---

## Step 5: Review Results

You should now see the **"Review & Scrub"** tab with results:

### Summary Statistics (top section)
- **Total Records**: Number of loans processed (filtered by current month)
- **Total Volume**: Combined loan amounts
- **Validation Errors**: **4 errors** (intentional test errors)

### Data Table (scrollable)

**What to look for:**

✅ **Column Headers:**
- Loan #
- Branch/Location
- Term (Years)
- Rate (%)
- Status
- Issues

✅ **Green rows** = Valid loans (passed all checks)
- Should show "Valid" badge with checkmark
- No errors in "Issues" column

❌ **Red/pink rows** = Loans with validation errors
- Should show "Review" badge with warning icon
- Specific errors listed in "Issues" column

**Expected validation errors (4 total):**
1. Census Tract format error (must be ##.## or ####.##)
2. Interest Rate out of bounds (must be 0-20%)
3. Income out of range (must be 1-9999 thousands)
4. Invalid Action Taken Code (must be 1-8)

### Test the Export

1. Scroll down to the **"Export Options"** section
2. Click **"Export Mail Merge"** button
3. An Excel file will download: `Mail_Merge_Export.xlsx`
4. Open the file and verify:
   - Contains "Merge Data" tab
   - Shows all processed loan records
   - Includes calculated fields (Branch, Term Years, APR)

---

## Step 6: Test Document Intelligence (Optional)

1. Navigate to **"Doc Intelligence"** tab
2. Click **"Choose Files"** or drag-and-drop multiple files
3. Upload: `08_Sample_Loan_Text.txt`
   - **Location**: `client/public/test_data/08_Sample_Loan_Text.txt`
4. File should appear in the list showing:
   - File name: `08_Sample_Loan_Text.txt`
   - File size: `1.29 KB`
5. Click the **X** button to test file removal
6. Upload it again to verify multi-file upload works

---

## What Success Looks Like

✅ **Login works** - Password authenticates successfully
✅ **Files upload** - All 3 Excel files load without errors
✅ **Processing completes** - ETL runs in 2-3 seconds
✅ **Data displays** - Table shows 15 loans with realistic data
✅ **Validation works** - Exactly 4 errors flagged
✅ **Export works** - Mail merge Excel file downloads
✅ **Docs upload** - Text file uploads to Document Intelligence

---

## Troubleshooting

### Problem: "Using Sample Data" message appears
**Solution**: Make sure you uploaded the LaserPro or Encompass file first before clicking "Run Automation"

### Problem: No validation errors shown
**Solution**: Check that you're looking at the filtered data (current month). Some test loans may be filtered out if their dates don't match the current month.

### Problem: Files won't upload
**Solution**: 
- Check file is in `client/public/test_data/` folder
- Make sure it's an `.xlsx` file (not `.xls`)
- Try refreshing the page and logging in again

### Problem: Export button doesn't work
**Solution**: Make sure you ran the automation first - export only works after processing completes

---

## Test Data Details

**Test files contain:**
- 15 sample HMDA-reportable loans
- Loan numbers: LP2024110001 through LP2024110015
- Realistic field values (interest rates, census tracts, income, etc.)
- 4 intentional validation errors for testing error detection
- All files join on `Loan_Number` field

**Field mappings:**
- LaserPro: Core loan data (amount, rate, term, property type, action taken)
- Encompass: Borrower details (name, income, credit score, property address)
- Supplemental: Demographics (ethnicity, race, sex)

---

## Next Steps After Testing

1. ✅ Verify all 15 loans processed correctly
2. ✅ Confirm 4 validation errors match expected errors
3. ✅ Check exported Excel file opens properly
4. ✅ Test Document Intelligence file upload/removal
5. 📋 Document any issues or questions
6. 🎯 Ready for tomorrow's 9am demo!

---

## Quick Reference: File Locations

```
client/public/test_data/
├── 01_LaserPro_Export.xlsx       ← Upload to Input A
├── 02_Encompass_Export.xlsx      ← Upload to Input B  
├── 03_Supplemental_Export.xlsx   ← Upload to Input C
└── 08_Sample_Loan_Text.txt       ← Upload to Doc Intelligence
```

---

**Total testing time: ~5 minutes**
**Demo ready: ✅ YES**
