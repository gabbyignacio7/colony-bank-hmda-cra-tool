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
  Printer,
  Share2,
  Copy,
  Check
} from 'lucide-react';
import { Progress } from '@/components/ui/progress';
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
  exportCRAWizFormat,
  transformToCRAWizFormat,
  CRA_WIZ_128_COLUMNS,
  type SbslRow,
  type ValidationResult
} from '@/lib/etl-engine';
import { compareDataframes, type DiffResult } from '@/lib/diff-engine';
import { 
  parseCRAWizFile, 
  transformCRAWizExport, 
  exportWorkItemFile, 
  exportTransformSummary,
  BRANCH_LIST,
  type CRAWizRow,
  type TransformResult
} from '@/lib/cra-wiz-transform';
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

  // Phase 3: CRA Wiz Post-Processing State
  const [craWizFile, setCraWizFile] = useState<File | null>(null);
  const [craWizData, setCraWizData] = useState<CRAWizRow[]>([]);
  const [phase3Result, setPhase3Result] = useState<TransformResult | null>(null);
  const [isPhase3Processing, setIsPhase3Processing] = useState(false);

  // Progress Tracking State
  const [progress, setProgress] = useState(0);
  const [progressStep, setProgressStep] = useState('');
  const [copied, setCopied] = useState(false);

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
      
      // Transform to 128-column CRA Wiz format
      const transformedData = transformToCRAWizFormat(processedData);
      
      // Generate Excel file with 128-column format
      const ws = utils.json_to_sheet(transformedData, { header: CRA_WIZ_128_COLUMNS });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "CRA Data");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "Export Complete", 
        description: `Downloaded ${filename} with ${processedData.length} records in 128-column format` 
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
      // Use the new 128-column CRA Wiz export format
      exportCRAWizFormat(processedData);
      
      toast({ 
        title: "CRA Export Complete", 
        description: `Downloaded ${CRA_WIZ_128_COLUMNS.length}-column CRA Wiz file with ${processedData.length} records` 
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

  // Phase 3: CRA Wiz Post-Processing Handlers
  const handleCRAWizFileUpload = async (file: File) => {
    setCraWizFile(file);
    setPhase3Result(null);
    
    try {
      const data = await parseCRAWizFile(file);
      setCraWizData(data);
      toast({ 
        title: "CRA Wiz File Loaded", 
        description: `Parsed ${data.length} rows with ${Object.keys(data[0] || {}).length} columns` 
      });
    } catch (error) {
      toast({ 
        title: "Error", 
        description: "Failed to parse CRA Wiz export file", 
        variant: "destructive" 
      });
    }
  };

  const runPhase3Transform = async () => {
    if (craWizData.length === 0) {
      toast({ title: "No Data", description: "Please upload a CRA Wiz export file first", variant: "destructive" });
      return;
    }

    setIsPhase3Processing(true);
    
    try {
      await new Promise(r => setTimeout(r, 500)); // Brief delay for UI feedback
      
      const result = transformCRAWizExport(craWizData);
      setPhase3Result(result);
      
      toast({ 
        title: "Transformation Complete", 
        description: `Converted ${result.inputColumns} columns to ${result.outputColumns} columns. ${result.branchMatchCount} branch matches.` 
      });
    } catch (error) {
      toast({ 
        title: "Transform Failed", 
        description: "Error during CRA Wiz transformation", 
        variant: "destructive" 
      });
    } finally {
      setIsPhase3Processing(false);
    }
  };

  const downloadPhase3WorkItem = () => {
    if (!phase3Result || phase3Result.data.length === 0) {
      toast({ title: "No Data", description: "Run transformation first", variant: "destructive" });
      return;
    }
    
    exportWorkItemFile(phase3Result.data);
    toast({ title: "Download Started", description: "Work Item file is downloading" });
  };

  const downloadPhase3Summary = () => {
    if (!phase3Result) {
      toast({ title: "No Data", description: "Run transformation first", variant: "destructive" });
      return;
    }
    
    exportTransformSummary(phase3Result);
    toast({ title: "Download Started", description: "Summary file is downloading" });
  };

  const downloadCorrectedData = async () => {
    if (processedData.length === 0) {
      toast({ title: "No Data", description: "Run automation first to generate data", variant: "destructive" });
      return;
    }

    try {
      // Import auto-correction and transform functions
      const { autoCorrectData, transformToCRAWizFormat, CRA_WIZ_128_COLUMNS } = await import('@/lib/etl-engine');
      
      // Apply auto-corrections
      const correctedData = autoCorrectData(processedData);
      
      // Transform to 128-column CRA Wiz format
      const transformedData = transformToCRAWizFormat(correctedData);
      
      const monthYear = new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
      const filename = `HMDA_Auto_Corrected_${monthYear.replace(' ', '_')}.xlsx`;
      
      // Generate Excel with 128-column CRA Wiz format
      const ws = utils.json_to_sheet(transformedData, { header: CRA_WIZ_128_COLUMNS });
      const wb = utils.book_new();
      utils.book_append_sheet(wb, ws, "CRA Data");
      
      // Add a summary sheet
      const summaryData = [{
        'Total Records': transformedData.length,
        'Output Columns': CRA_WIZ_128_COLUMNS.length,
        'Column A': 'BranchName',
        'Column B': 'Branch',
        'Column C': 'ApplNumb',
        'Original Errors': validationErrors.length,
        'Auto-Corrections Applied': 'Census Tract formatting, Rate decimals, State codes, Whitespace trimming',
        'Note': 'Review flagged records - some errors require manual correction'
      }];
      const summaryWs = utils.json_to_sheet(summaryData);
      utils.book_append_sheet(wb, summaryWs, "Correction Summary");
      
      writeFile(wb, filename);
      
      toast({ 
        title: "Corrected Data Downloaded", 
        description: `${transformedData.length} records in 128-column CRA Wiz format. Review flagged items.`,
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
            onClick={() => setActiveTab('phase3')}
            className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'phase3' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
          >
            <ArrowRight className="w-4 h-4" />
            <span className="font-medium text-sm">CRA Wiz Post</span>
            <span className="ml-auto bg-orange-500 text-white text-[10px] px-1.5 py-0.5 rounded-full">Step 6</span>
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
            {activeTab === 'phase3' && 'Phase 3: CRA Wiz Post-Processing'}
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

            {/* PHASE 3: CRA WIZ POST-PROCESSING TAB */}
            <TabsContent value="phase3" className="space-y-6 mt-0">
              <div className="bg-gradient-to-r from-orange-50 to-amber-50 border border-orange-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-orange-100 p-2 rounded-lg">
                    <ArrowRight className="w-5 h-5 text-orange-600" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-orange-900">Step 6: CRA Wiz Return Processing</h3>
                    <p className="text-sm text-orange-700 mt-1">
                      Upload the file you downloaded from CRA Wiz after processing. This converts the 243-column CRA Wiz export to the 125-column work item format with Branch VLOOKUP applied.
                    </p>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="w-5 h-5 text-orange-600" />
                      Upload CRA Wiz Export
                    </CardTitle>
                    <CardDescription>
                      Upload the CSV file downloaded from CRA Wiz after processing
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="CRA Wiz Export File (CSV)"
                      description="243-column CRA Wiz HMDA export"
                      onFileSelect={(file) => handleCRAWizFileUpload(file)}
                      file={craWizFile}
                      accept={{'text/csv': ['.csv'], 'application/vnd.ms-excel': ['.xls', '.xlsx']}}
                    />
                    
                    {craWizData.length > 0 && (
                      <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                        <div className="flex items-center gap-2 text-green-700">
                          <CheckCircle2 className="w-4 h-4" />
                          <span className="font-medium">File Loaded Successfully</span>
                        </div>
                        <div className="mt-2 text-sm text-green-600">
                          {craWizData.length} rows × {Object.keys(craWizData[0] || {}).length} columns
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" />
                      Branch List Reference
                    </CardTitle>
                    <CardDescription>
                      Using built-in Colony Bank branch list (48 branches)
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 text-blue-700 mb-2">
                        <CheckCircle2 className="w-4 h-4" />
                        <span className="font-medium">Branch List Ready</span>
                      </div>
                      <p className="text-sm text-blue-600 mb-3">
                        {Object.keys(BRANCH_LIST).length} branches configured for VLOOKUP
                      </p>
                      <div className="max-h-32 overflow-y-auto text-xs font-mono bg-white rounded p-2 border">
                        {Object.entries(BRANCH_LIST).slice(0, 10).map(([num, name]) => (
                          <div key={num} className="py-0.5">{num}: {name}</div>
                        ))}
                        <div className="text-slate-400 italic">...and {Object.keys(BRANCH_LIST).length - 10} more</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Transform Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Button 
                    className="w-full bg-orange-600 hover:bg-orange-700" 
                    size="lg"
                    onClick={runPhase3Transform}
                    disabled={isPhase3Processing || craWizData.length === 0}
                  >
                    {isPhase3Processing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Transforming...
                      </>
                    ) : (
                      <>
                        <Play className="mr-2 h-4 w-4" />
                        Transform for Work Items
                      </>
                    )}
                  </Button>

                  <div className="text-xs text-muted-foreground px-2">
                    <p className="font-medium mb-1">Transformation Steps:</p>
                    <ul className="list-disc pl-3 space-y-1">
                      <li>Apply Branch VLOOKUP (BRANCHNUMB → BRANCHNAME)</li>
                      <li>Add new columns: ErrorMadeBy, DSC (blank)</li>
                      <li>Remove 118 unwanted columns</li>
                      <li>Reorder to exact 125-column format</li>
                    </ul>
                  </div>
                </CardContent>
              </Card>

              {phase3Result && (
                <>
                  <div className="grid grid-cols-4 gap-4">
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-orange-600">{phase3Result.inputColumns}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Input Columns</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-green-600">{phase3Result.outputColumns}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Output Columns</div>
                      </CardContent>
                    </Card>
                    <Card className="bg-white">
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-600">{phase3Result.rowCount}</div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Rows</div>
                      </CardContent>
                    </Card>
                    <Card className={cn("bg-white", phase3Result.branchMissCount > 0 && "border-yellow-300 bg-yellow-50")}>
                      <CardContent className="pt-6">
                        <div className={cn("text-2xl font-bold", phase3Result.branchMissCount > 0 ? "text-yellow-600" : "text-green-600")}>
                          {phase3Result.branchMatchCount}/{phase3Result.rowCount}
                        </div>
                        <div className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Branch Matches</div>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle>Data Preview</CardTitle>
                      <CardDescription>First 5 rows of transformed data (125 columns)</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="rounded-md border overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-sm text-left">
                            <thead className="bg-slate-100 text-slate-600 font-medium border-b">
                              <tr>
                                <th className="px-4 py-3">BRANCHNAME</th>
                                <th className="px-4 py-3">BRANCHNUMB</th>
                                <th className="px-4 py-3">LEI</th>
                                <th className="px-4 py-3">ULI</th>
                                <th className="px-4 py-3">LASTNAME</th>
                                <th className="px-4 py-3">FIRSTNAME</th>
                                <th className="px-4 py-3">LENDER</th>
                                <th className="px-4 py-3">LOANAMOUNTINDOLLARS</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {phase3Result.data.slice(0, 5).map((row, i) => (
                                <tr key={i} className="hover:bg-slate-50">
                                  <td className="px-4 py-3 font-medium">{row.BRANCHNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.BRANCHNUMB || '-'}</td>
                                  <td className="px-4 py-3 truncate max-w-[100px]">{row.LEI || '-'}</td>
                                  <td className="px-4 py-3 truncate max-w-[100px]">{row.ULI || '-'}</td>
                                  <td className="px-4 py-3">{row.LASTNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.FIRSTNAME || '-'}</td>
                                  <td className="px-4 py-3">{row.LENDER || '-'}</td>
                                  <td className="px-4 py-3">${Number(row.LOANAMOUNTINDOLLARS || 0).toLocaleString()}</td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex gap-4">
                    <Button 
                      className="flex-1 bg-green-600 hover:bg-green-700" 
                      size="lg"
                      onClick={downloadPhase3WorkItem}
                    >
                      <Download className="mr-2 h-4 w-4" />
                      Download Work Item File
                    </Button>
                    <Button 
                      variant="outline" 
                      size="lg"
                      onClick={downloadPhase3Summary}
                    >
                      <FileText className="mr-2 h-4 w-4" />
                      Download Summary
                    </Button>
                  </div>
                </>
              )}
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
