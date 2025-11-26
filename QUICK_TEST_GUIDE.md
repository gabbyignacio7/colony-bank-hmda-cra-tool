# Quick Test Guide - 2 Minutes

## The Fastest Way to Test Your HMDA Tool

---

### 1. LOGIN (15 seconds)
```
Password: ColonyBank2024!
Click: Authenticate
```

---

### 2. UPLOAD FILES (60 seconds)

**Data Sources Tab:**

**Input A:** `01_LaserPro_Export.xlsx`
- Look for: "Successfully loaded 15 records"

**Input B:** `02_Encompass_Export.xlsx`  
- Look for: "ready for processing"

**Input C:** `03_Supplemental_Export.xlsx`
- Look for: "ready for processing"

---

### 3. RUN AUTOMATION (30 seconds)

```
Click: "Continue to Phase 2"
Click: "Run Automation"
Wait: 2-3 seconds
```

**Watch for:**
- ✅ Logs scrolling
- ✅ "Found 4 issues"
- ✅ "ETL Process Complete"
- ✅ Auto-advance to Review tab

---

### 4. VERIFY RESULTS (15 seconds)

**Look for:**
- **Summary:** Total Records, Total Volume, Validation Errors: 4
- **Table:** Green rows (valid) + Red rows (4 errors)
- **Errors:** Census Tract, Interest Rate, Income, Action Code issues

```
Click: "Export Mail Merge"
Verify: Excel file downloads
```

---

### 5. TEST DOCS (Optional - 15 seconds)

```
Tab: "Doc Intelligence"
Upload: 08_Sample_Loan_Text.txt
Verify: File appears in list (1.29 KB)
```

---

## Success Checklist

- [ ] Login works
- [ ] 3 files upload successfully  
- [ ] Processing completes in ~3 seconds
- [ ] Exactly 4 validation errors shown
- [ ] Table displays 15 loans (or filtered count)
- [ ] Export downloads Excel file
- [ ] Document upload works

---

## File Locations

All test files are in: `client/public/test_data/`

---

**READY FOR DEMO? ✅**
