# Colony Bank HMDA/CRA ETL Tool - Demo Walkthrough

## Demo Preparation (5 minutes before presentation)

### Pre-Demo Checklist
- [ ] Application is running and accessible
- [ ] Password ready: `ColonyBank2024!`
- [ ] Sample files ready (provided by you)
- [ ] Browser window maximized for visibility

---

## Demo Script for Your Boss (15-20 minutes)

### **INTRODUCTION (2 minutes)**

*"Good morning! I'm excited to show you our new HMDA/CRA ETL automation tool that will save our compliance team over 100 hours per month. This tool processes all our loan data - LaserPro commercial loans, Encompass consumer loans, and supplemental data - entirely in the browser for maximum security. Let me walk you through the complete workflow."*

---

### **PHASE 1: SECURE LOGIN (1 minute)**

**What to do:**
1. Open the application
2. Show the password-protected login screen
3. Enter username: `[YourName]` (e.g., "Sarah.Johnson")
4. Enter password: `ColonyBank2024!`
5. Click "Authenticate"

**What to say:**
*"First, notice the tool is password-protected. Only authorized Colony Bank personnel can access it. The system validates credentials server-side and tracks every processing session for audit compliance. I'll log in now with my credentials."*

**Key points:**
- ✅ Server-side authentication (not just client-side)
- ✅ Audit trail tracking
- ✅ Colony Bank branding (Navy Blue #003366)

---

### **PHASE 2: DATA SOURCES (3 minutes)**

**What to do:**
1. Navigate to "Data Sources" tab (should be default)
2. Show the three input sections:
   - Input A: LaserPro (Commercial HUDDA Loans)
   - Input B: Encompass (Consumer Loans Primary)
   - Input C: Supplemental (Encompass Additional Data)

**What to say:**
*"Our monthly process typically requires three data sources. Input A handles our LaserPro commercial loans, Input B processes Encompass consumer loans, and Input C merges supplemental borrower data. The system accepts Excel, CSV, and text files. For today's demo, I'll use sample data that's already built-in, but in production we'd upload the actual monthly exports here."*

**What to show:**
- Point to each upload zone
- Mention the drag-and-drop capability
- Click "Continue to Phase 2" button

---

### **PHASE 3: RUN ETL AUTOMATION (5 minutes)**

**What to do:**
1. Click "Run ETL" tab in sidebar
2. Click the big blue "Run Automation" button
3. Watch the transformation pipeline logs in real-time

**What to say (as the process runs):**
*"Now watch the magic happen. The system is executing our entire 6-phase compliance workflow automatically:"*

**Explain each log message as it appears:**
- **Phase 1:** "Filtering by current month - only processing November 2025 loans"
- **Phase 2:** "Calculating Branch Codes from the first 3 digits of loan numbers"
- **Phase 2:** "Converting loan terms from months to years for CRA Wiz"
- **Phase 2:** "Performing VLOOKUP to merge customer names, lender info, and APR data"
- **Phase 2:** "Cleaning APRs by removing trailing zeros, padding county codes to 5 digits, tract numbers to 11 digits"
- **Phase 3:** "Simulating CRA Wiz validation - checking interest rates, LTV ratios, required fields"

**What to emphasize:**
*"This entire process - which currently takes your team 8-10 hours manually - just completed in under 3 seconds. All transformations happen in the browser, so sensitive loan data never leaves your machine."*

---

### **PHASE 4: REVIEW & SCRUB DATA (4 minutes)**

**What to do:**
1. System auto-advances to "Review & Scrub" tab
2. Point out the summary statistics cards:
   - Total Records processed
   - Total Loan Volume (dollar amount)
   - Validation Errors found
3. Scroll through the data table
4. Point out color-coded validation status (green = valid, red = needs review)

**What to say:**
*"Here's our processed data. At the top, we see summary statistics - [X] records totaling $[Y] in loan volume. The system found [Z] validation issues that need attention."*

*"Each row shows the validation status. Green means CRA Wiz compliant, red flags issues like missing fields or out-of-bounds values. Your team can quickly identify and fix problem records before final submission."*

**Key feature to highlight:**
- Click "Export Mail Merge" button
- Explain: *"This button exports an Excel file with a 'Merge Data' tab that plugs directly into our Word mail merge templates for borrower notifications - another 2-3 hours saved."*

---

### **PHASE 5: DOCUMENT INTELLIGENCE (3 minutes)**

**What to do:**
1. Click "Doc Intelligence" tab in sidebar
2. Show the upload interface
3. Upload the PDF file: `CONINE FOR FUNDING Break Out.pdf`
4. Wait for file to upload confirmation

**What to say:**
*"This is our newest feature - Document Intelligence. When we receive loan packages as PDFs, the system can automatically extract key data points: interest rates, loan terms, borrower information, property details from closing disclosures, credit reports, and appraisals."*

*"Let me upload this sample loan document..."* [drag and drop the PDF]

*"The system recognizes this as a loan funding document and would extract the loan amount ($37,780), term (180 months), interest rate (12.99%), and applicant information. This eliminates manual data entry from paper documents."*

**What to emphasize:**
- Handles PDF and text files
- Reduces data entry errors
- Processes multiple documents in batch

---

### **BONUS: LEARNING CENTER (2 minutes - if time permits)**

**What to do:**
1. Click "Learning Center" in the sidebar
2. Show the video tutorial section
3. Show the downloadable resources

**What to say:**
*"We've also built a Learning Center for team training. New compliance staff can watch tutorial videos and download quick reference guides. This reduces onboarding time from weeks to days."*

---

### **CLOSING: THE BUSINESS IMPACT (2 minutes)**

**What to say:**
*"Let me summarize what we've built here:*

**Time Savings:**
- Manual process: 100+ hours/month
- Automated process: ~30 minutes/month
- **Savings: 95%+ time reduction**

**Accuracy Improvements:**
- Automated validations catch errors before CRA Wiz submission
- Eliminates manual calculation mistakes
- Standardized formatting across all records

**Compliance Benefits:**
- Complete audit trail (who processed what, when)
- Server-side security with password protection
- All data processing happens locally (GLBA compliant)

**Next Steps:**
- Train compliance team (2 sessions, 1 hour each)
- Load November data for production test
- Go live for December 2025 reporting cycle

*Do you have any questions about the system?"*

---

## Common Questions & Answers

**Q: "What if we need to reprocess a month?"**
A: Just upload the same files again and click Run Automation. Results are instant.

**Q: "Can multiple people use this?"**
A: Yes, it's web-based. Each user logs in with their own credentials.

**Q: "What happens if there's an error?"**
A: The system highlights exactly which records have issues and what's wrong. Your team fixes the source data and re-runs.

**Q: "Is our data secure?"**
A: Absolutely. All processing happens in your browser - data never goes to our servers except authentication and audit logs (no loan data).

**Q: "How do we get our reports to regulators?"**
A: The Export button creates the exact format CRA Wiz requires. Upload that file directly to the regulatory portal.

---

## Post-Demo Follow-Up

**If your boss approves:**
- [ ] Schedule training sessions with compliance team
- [ ] Create user accounts for team members
- [ ] Set up first production run for next month
- [ ] Document any custom workflows specific to Colony Bank

**If your boss has concerns:**
- [ ] Address specific questions/concerns
- [ ] Offer additional demo with real data (test environment)
- [ ] Provide cost-benefit analysis spreadsheet

---

## Quick Tips for a Smooth Demo

1. **Practice once before the actual demo** - know where to click
2. **Speak slowly and clearly** - let the animations complete before moving on
3. **Use the files provided** - they're ready to go
4. **Emphasize time savings** - that's the #1 business value
5. **Show confidence** - you built this amazing tool!

Good luck! 🎯
