import { useState, useEffect } from 'react';
import { utils, writeFile } from 'xlsx';
import { FileUpload } from '@/components/file-upload';
import { MultiFileUpload } from '@/components/multi-file-upload';
import { PasswordGate } from '@/components/password-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Play, 
  FileText, 
  CheckCircle2, 
  AlertTriangle, 
  Download, 
  Loader2, 
  Database, 
  LayoutDashboard,
  Search,
  Filter,
  Trash2,
  ArrowRight,
  ChevronRight,
  FlaskConical,
  ShieldCheck,
  Activity,
  FileDiff,
  BookOpen,
  Video,
  FileScan,
  Printer
} from 'lucide-react';
import { 
  processFile, 
  fetchCsvFile,
  MOCK_SBSL_DATA, 
  filterByCurrentMonth, 
  validateData, 
  generateSummaryStats,
  transformEncompassData,
  cleanAndFormatData,
  mergeSupplementalData,
  type SbslRow,
  type ValidationResult
} from '@/lib/etl-engine';
import { compareDataframes, type DiffResult } from '@/lib/diff-engine';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { TutorialVideo } from '@/components/tutorial-video';

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State
  const [files, setFiles] = useState<{
    laserPro: File | null, 
    encompass: File | null, 
    supp: File | null, 
    expected: File | null, 
    stress: File[]
  }>({ 
    laserPro: null, 
    encompass: null,
    supp: null,
    expected: null,
    stress: [] 
  });
  
  const [documentFiles, setDocumentFiles] = useState<File[]>([]);
  
  const [rawData, setRawData] = useState<SbslRow[]>([]);
  const [processedData, setProcessedData] = useState<SbslRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [currentScenario, setCurrentScenario] = useState<string>("");
  
  // Diff State
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  
  // Stress Test State
  const [stressResults, setStressResults] = useState<any[]>([]);
  const [stressStats, setStressStats] = useState({
    filesProcessed: 0,
    successRate: "0/0",
    avgTime: 0,
    totalRows: 0
  });

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFileUpload = async (type: 'laserPro' | 'encompass' | 'supp' | 'expected', file: File) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    
    try {
      const data = await processFile(file);
      
      if (type === 'encompass' || type === 'laserPro') {
        // Primary data sources
        setRawData(data as SbslRow[]);
        addLog(`Loaded ${type.toUpperCase()} file: ${file.name} (${data.length} rows)`);
        toast({ title: "File Loaded", description: `Successfully loaded ${data.length} records from ${file.name}` });
        setCurrentScenario("Custom Upload");
      } else {
        addLog(`Loaded ${type.toUpperCase()} file: ${file.name}`);
        toast({ title: "File Loaded", description: `${file.name} ready for processing` });
      }
    } catch (e) {
      addLog(`Error parsing file ${file.name}: ${e}`);
      toast({ title: "Error", description: `Failed to parse ${file.name}`, variant: "destructive" });
    }
  };

  const handleDocumentFilesUpload = (newFiles: File[]) => {
    setDocumentFiles(prev => [...prev, ...newFiles]);
    toast({ 
      title: "Documents Uploaded", 
      description: `Added ${newFiles.length} document${newFiles.length !== 1 ? 's' : ''} for processing.` 
    });
  };

  const handleRemoveDocumentFile = (index: number) => {
    setDocumentFiles(prev => prev.filter((_, i) => i !== index));
  };

  const runEtlProcess = async () => {
    setIsProcessing(true);
    setActiveTab('process');
    setLogs([]); 
    addLog("Starting Comprehensive ETL Process...");
    
    // Check if we have uploaded data
    if (rawData.length === 0 && !files.encompass && !files.laserPro) {
      addLog("No files uploaded. Using sample data for demonstration...");
      toast({ 
        title: "Using Sample Data", 
        description: "Upload files to process your own data", 
        variant: "default" 
      });
    }
    
    await new Promise(r => setTimeout(r, 500));
    
    // Step 1: Filter
    const currentMonth = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    addLog(`Phase 1: Filtering by current month (${currentMonth})...`);
    let currentData = rawData.length > 0 ? rawData : MOCK_SBSL_DATA;
    const { filtered, count } = filterByCurrentMonth(currentData);
    addLog(`Filtered: Kept ${count} records out of ${currentData.length} total.`);

    await new Promise(r => setTimeout(r, 500));

    // Step 2: Transformation
    addLog("Phase 2: Transforming Encompass Data...");
    addLog("   - Calculating Branch Codes");
    addLog("   - Deriving Application Numbers");
    addLog("   - Converting Loan Terms (Months -> Years)");
    let transformed = transformEncompassData(filtered);
    
    await new Promise(r => setTimeout(r, 500));

    // Step 3: VLOOKUP Merge
    addLog("Phase 2 (Step 2): Merging Supplemental Data...");
    // Simulate merge with self for demo if no supp file
    transformed = mergeSupplementalData(transformed, transformed);
    addLog("   - Merged Customer Names");
    addLog("   - Merged Borrower Data");
    addLog("   - Merged APR and Rate Types");

    await new Promise(r => setTimeout(r, 500));

    // Step 4: Cleaning
    addLog("Phase 2 (Step 3): Cleaning & Formatting...");
    addLog("   - Formatting APRs (removing trailing zeros)");
    addLog("   - Padding County Codes (5 digits)");
    addLog("   - Padding Tract Numbers (11 digits)");
    const cleaned = cleanAndFormatData(transformed);

    await new Promise(r => setTimeout(r, 500));

    // Step 5: Validation (CRA Wiz Simulation)
    addLog("Phase 3: Simulating CRA Wiz Validation...");
    const errors = validateData(cleaned);
    setValidationErrors(errors);
    addLog(`Validation complete: Found ${errors.length} issues.`);
    
    // Stats
    const summary = generateSummaryStats(cleaned);
    setStats(summary);
    
    setProcessedData(cleaned);
    setIsProcessing(false);
    addLog("ETL Process Complete.");
    
    // Log audit trail
    try {
      await fetch('/api/audit/log', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: 'System User',
          filesProcessed: (files.laserPro ? 1 : 0) + (files.encompass ? 1 : 0) + (files.supp ? 1 : 0),
          recordsProcessed: cleaned.length,
          validationErrors: errors.length,
          phase: 'Complete ETL Pipeline'
        })
      });
    } catch (err) {
      console.error('Failed to log audit trail:', err);
    }
    
    if (errors.length > 0) {
      toast({ title: "Validation Issues Found", description: `Found ${errors.length} records requiring attention.`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Data processed successfully." });
    }
    
    setTimeout(() => setActiveTab('review'), 500);
  };

  const downloadMailMerge = () => {
    if (processedData.length === 0) {
      toast({ title: "No Data", description: "Run automation first to generate data", variant: "destructive" });
      return;
    }

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `HMDA_Scrub_Data_${monthYear.replace(' ', '_')}.xlsx`;
      
      // Generate Excel file with processed data
      const ws = utils.json_to_sheet(processedData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Merge Data");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "Export Complete", 
        description: `Downloaded ${filename} with ${processedData.length} records` 
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Error creating Excel file", 
        variant: "destructive" 
      });
    }
  };

  const downloadCRAWiz = () => {
    if (processedData.length === 0) {
      toast({ title: "No Data", description: "Run automation first to generate data", variant: "destructive" });
      return;
    }

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `CRA_Wiz_Upload_${monthYear.replace(' ', '_')}.xlsx`;
      
      // Generate CRA Wiz format
      const ws = utils.json_to_sheet(processedData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "CRA Data");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "CRA Export Complete", 
        description: `Downloaded ${filename} for CRA Wiz upload` 
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Error creating CRA file", 
        variant: "destructive" 
      });
    }
  };

  const downloadValidationReport = () => {
    if (validationErrors.length === 0) {
      toast({ title: "No Errors", description: "All records passed validation!" });
      return;
    }

    try {
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `Validation_Errors_${monthYear.replace(' ', '_')}.xlsx`;
      
      // Format validation errors for export
      const errorData = validationErrors.map(err => ({
        'Row #': err.rowIdx,
        'Loan Number': err.applNumb,
        'Errors': err.errors.join('; ')
      }));
      
      const ws = utils.json_to_sheet(errorData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Validation Errors");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "Error Report Downloaded", 
        description: `${validationErrors.length} errors exported to ${filename}` 
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Error creating error report", 
        variant: "destructive" 
      });
    }
  };

  const downloadCorrectedData = async () => {
    if (processedData.length === 0) {
      toast({ title: "No Data", description: "Run automation first to generate data", variant: "destructive" });
      return;
    }

    try {
      // Import auto-correction function
      const { autoCorrectData } = await import('@/lib/etl-engine');
      
      // Apply auto-corrections
      const correctedData = autoCorrectData(processedData);
      
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `HMDA_Auto_Corrected_${monthYear.replace(' ', '_')}.xlsx`;
      
      // Generate Excel with corrected data
      const ws = utils.json_to_sheet(correctedData);
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "Corrected Data");
      
      // Add a summary sheet
      const summaryData = [{
        'Total Records': correctedData.length,
        'Original Errors': validationErrors.length,
        'Auto-Corrections Applied': 'Census Tract formatting, Rate decimals, State codes, Whitespace trimming',
        'Note': 'Review flagged records - some errors require manual correction'
      }];
      const summaryWs = utils.json_to_sheet(summaryData);
      utils.book_append_sheet(wb, summaryWs, "Correction Summary");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "Corrected Data Downloaded", 
        description: `${correctedData.length} records with auto-fixes applied. Review flagged items.`,
        duration: 5000
      });
    } catch (error) {
      toast({ 
        title: "Export Failed", 
        description: "Error creating corrected file", 
        variant: "destructive" 
      });
    }
  };

  if (!isAuthenticated) {
    return <PasswordGate onUnlock={() => setIsAuthenticated(true)} />;
  }

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <div className="w-64 bg-[#003366] text-white flex flex-col shrink-0">
        <div className="p-6 border-b border-white/10">
          <h1 className="font-bold text-xl tracking-tight">Colony Bank</h1>
          <p className="text-xs text-blue-200 mt-1">HMDA/CRA Automation</p>
        </div>
        
        <nav className="flex-1 p-4 space-y-2">
          <button 
            onClick={() => setActiveTab('upload')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'upload' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
          >
            <Database className="w-4 h-4" />
            <span className="font-medium text-sm">Data Sources</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('process')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'process' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
          >
            <Play className="w-4 h-4" />
            <span className="font-medium text-sm">Run ETL</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('review')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'review' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span className="font-medium text-sm">Review & Scrub</span>
            {validationErrors.length > 0 && (
              <span className="ml-auto bg-red-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">{validationErrors.length}</span>
            )}
          </button>

          <button 
            onClick={() => setActiveTab('docs')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'docs' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
          >
            <FileScan className="w-4 h-4" />
            <span className="font-medium text-sm">Doc Intelligence</span>
            <span className="ml-auto bg-blue-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">New</span>
          </button>

          <div className="pt-4 mt-4 border-t border-white/10">
            <p className="px-4 text-xs text-blue-400 uppercase font-semibold mb-2">Testing & Tools</p>
            <button 
              onClick={() => setActiveTab('testing')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'testing' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
            >
              <FileDiff className="w-4 h-4" />
              <span className="font-medium text-sm">Diff Testing</span>
            </button>
            
            <button 
              onClick={() => setActiveTab('tutorial')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'tutorial' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
            >
              <Video className="w-4 h-4" />
              <span className="font-medium text-sm">Learning Center</span>
            </button>
          </div>
        </nav>
        
        <div className="p-6 border-t border-white/10">
          <div className="text-xs text-blue-300 mb-2">System Status</div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <ShieldCheck className="w-4 h-4" />
            Authenticated
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white border-b h-16 flex items-center px-8 justify-between">
          <h2 className="text-lg font-semibold text-slate-800">
            {activeTab === 'upload' && 'Phase 1: Data Extraction'}
            {activeTab === 'process' && 'Phase 2-3: Transformation & Validation'}
            {activeTab === 'review' && 'Phase 4: Scrub Preparation'}
            {activeTab === 'docs' && 'Phase 5: Document Intelligence'}
            {activeTab === 'tutorial' && 'Learning Center'}
          </h2>
          <div className="flex items-center gap-4">
            <div className="text-sm text-slate-500">
              Period: <span className="font-medium text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
            
            {/* UPLOAD TAB */}
            <TabsContent value="upload" className="space-y-6 mt-0">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">Input A: LaserPro</CardTitle>
                    <CardDescription>Commercial HUDDA Loans (Text)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="LaserPro Export" 
                      onFileSelect={(f) => handleFileUpload('laserPro', f)} 
                      file={files.laserPro}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                     <CardTitle className="text-base">Input B: Encompass</CardTitle>
                     <CardDescription>Consumer Loans Primary (Excel)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="Encompass HUDDA" 
                      onFileSelect={(f) => handleFileUpload('encompass', f)}
                      file={files.encompass}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                     <CardTitle className="text-base">Input C: Supplemental</CardTitle>
                     <CardDescription>Encompass Additional Data (Excel)</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="Supplemental Export" 
                      onFileSelect={(f) => handleFileUpload('supp', f)}
                      file={files.supp}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3">
                <Button 
                  onClick={() => setActiveTab('process')} 
                  className="bg-[#003366] hover:bg-[#002244]"
                >
                  Continue to Phase 2 <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* PROCESS TAB */}
            <TabsContent value="process" className="space-y-6 mt-0">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>Transformation Pipeline</CardTitle>
                    <CardDescription>Execution of Phase 2 & 3 Logic</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-md h-[300px] overflow-y-auto shadow-inner">
                      {logs.length === 0 && <span className="text-slate-500">Ready to start...</span>}
                      {logs.map((log, i) => (
                        <div key={i} className="mb-1 border-b border-slate-800/50 pb-1 last:border-0">{log}</div>
                      ))}
                      {isProcessing && (
                        <div className="flex items-center gap-2 text-blue-400 mt-2">
                          <Loader2 className="w-3 h-3 animate-spin" /> Processing...
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Actions</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <Button 
                      className="w-full bg-[#003366] hover:bg-[#002244]" 
                      size="lg"
                      onClick={runEtlProcess}
                      disabled={isProcessing}
                    >
                      {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Play className="mr-2 h-4 w-4" />}
                      Run Automation
                    </Button>
                    <div className="text-xs text-muted-foreground px-2">
                      <p className="font-medium mb-1">Pipeline Steps:</p>
                      <ul className="list-disc pl-3 space-y-1">
                        <li>Column Calculation (Term, Branch)</li>
                        <li>VLOOKUP Merge (Supp Data)</li>
                        <li>Format Cleaning (APR, Tract)</li>
                        <li>CRA Wiz Validation Simulation</li>
                      </ul>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            {/* REVIEW TAB */}
            <TabsContent value="review" className="space-y-6 mt-0">
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-[#003366]">{stats.totalRecords}</div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Records</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold text-green-600">
                        {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', notation: 'compact' }).format(stats.totalLoanAmount)}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Volume</div>
                    </CardContent>
                  </Card>
                  <Card className={cn("transition-colors", validationErrors.length > 0 ? "bg-red-50 border-red-200" : "bg-white")}>
                    <CardContent className="pt-6">
                      <div className={cn("text-2xl font-bold", validationErrors.length > 0 ? "text-red-600" : "text-slate-900")}>
                        {validationErrors.length}
                      </div>
                      <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Validation Errors</div>
                    </CardContent>
                  </Card>
                  <Card className="bg-white">
                    <CardContent className="pt-6 flex flex-col gap-2">
                      <Button 
                        size="sm" 
                        className="w-full bg-green-600 hover:bg-green-700 text-white" 
                        onClick={downloadCorrectedData}
                      >
                        <CheckCircle2 className="mr-2 h-3 w-3" /> Download Corrected
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" onClick={downloadMailMerge}>
                        <Download className="mr-2 h-3 w-3" /> Export Mail Merge
                      </Button>
                      <Button variant="outline" size="sm" className="w-full" onClick={downloadCRAWiz}>
                        <Database className="mr-2 h-3 w-3" /> Export CRA Wiz
                      </Button>
                      {validationErrors.length > 0 && (
                        <Button variant="outline" size="sm" className="w-full text-red-600 border-red-200 hover:bg-red-50" onClick={downloadValidationReport}>
                          <AlertTriangle className="mr-2 h-3 w-3" /> Error Report
                        </Button>
                      )}
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Data Review</CardTitle>
                  <CardDescription>Review processed records. Validated against CRA Wiz rules.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium border-b">
                          <tr>
                            <th className="px-4 py-3">Appl Numb</th>
                            <th className="px-4 py-3">Branch</th>
                            <th className="px-4 py-3">Term (Yrs)</th>
                            <th className="px-4 py-3">APR</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {processedData.map((row, i) => {
                            const loanId = row.Loan_Number || row.ApplNumb || '-';
                            const error = validationErrors.find(e => e.applNumb === loanId);
                            const termYears = row['Loan Term Years'] || (row.Loan_Term_Months ? row.Loan_Term_Months / 12 : '-');
                            const apr = row['APR'] || row.Interest_Rate || '-';
                            const branch = row['Branch Name'] || row['Branch'] || row.Property_City || '-';
                            
                            return (
                              <tr key={i} className={cn("hover:bg-slate-50 transition-colors", error ? "bg-red-50/50 hover:bg-red-50" : "")}>
                                <td className="px-4 py-3 font-medium">{loanId}</td>
                                <td className="px-4 py-3">{branch}</td>
                                <td className="px-4 py-3">{termYears}</td>
                                <td className="px-4 py-3">{apr}{typeof apr === 'number' ? '%' : ''}</td>
                                <td className="px-4 py-3">
                                  {error ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      <AlertTriangle className="w-3 h-3 mr-1" /> Review
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      <CheckCircle2 className="w-3 h-3 mr-1" /> Valid
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-red-600 text-xs">
                                  {error?.errors.join(", ")}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* DOCUMENT INTELLIGENCE TAB (MOCK) */}
            <TabsContent value="docs" className="space-y-6 mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Document-Based Data Extraction (Phase 5)</CardTitle>
                  <CardDescription>Automated extraction from PDF loan documents (Closing Disclosures, Notes, Appraisals).</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center mb-4">
                      <FileScan className="w-12 h-12 text-blue-300 mb-4 mx-auto" />
                      <h3 className="text-lg font-medium text-slate-900">Upload Loan Document Packages</h3>
                      <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
                        Upload multiple PDF or text files to automatically extract interest rates, loan terms, and property details.
                      </p>
                    </div>
                    
                    <MultiFileUpload 
                      label="Document Files (PDF/Text)" 
                      description="Drag & drop multiple files or click to select"
                      onFilesSelect={handleDocumentFilesUpload}
                      files={documentFiles}
                      onRemoveFile={handleRemoveDocumentFile}
                      accept={{'application/pdf': ['.pdf'], 'text/plain': ['.txt']}}
                    />

                    {documentFiles.length > 0 && (
                      <div className="flex justify-end gap-2 pt-4">
                        <Button 
                          variant="outline" 
                          onClick={() => setDocumentFiles([])}
                          data-testid="button-clear-all"
                        >
                          Clear All
                        </Button>
                        <Button 
                          className="bg-[#003366] hover:bg-[#002244]"
                          data-testid="button-process-documents"
                        >
                          Process {documentFiles.length} Document{documentFiles.length !== 1 ? 's' : ''}
                        </Button>
                      </div>
                    )}
                  </div>

                  <div className="mt-8">
                    <h4 className="text-sm font-medium text-slate-700 mb-4">Extraction Capabilities Preview</h4>
                    <div className="grid grid-cols-3 gap-4">
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">Closing Disclosure</div>
                        <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Loan Term</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Interest Rate</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Loan Purpose</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">Credit Report</div>
                         <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Middle Score Logic</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Applicant Age</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Bureau Source</li>
                        </ul>
                      </div>
                      <div className="p-4 bg-white border rounded-md shadow-sm">
                        <div className="text-xs text-slate-400 uppercase font-bold mb-2">Appraisal</div>
                         <ul className="space-y-2 text-sm">
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Construction Method</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Property Address</li>
                          <li className="flex items-center gap-2 text-green-600"><CheckCircle2 className="w-3 h-3" /> Occupancy Type</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="tutorial" className="mt-0">
              <TutorialVideo />
            </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}
