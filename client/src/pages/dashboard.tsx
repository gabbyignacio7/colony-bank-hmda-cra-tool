import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/file-upload';
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
  BookOpen
} from 'lucide-react';
import { 
  processFile, 
  fetchCsvFile,
  MOCK_SBSL_DATA, 
  filterByCurrentMonth, 
  validateData, 
  generateSummaryStats,
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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";

export default function Dashboard() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State
  const [files, setFiles] = useState<{sbsl: File | null, hmda: File | null, expected: File | null, stress: File[]}>({ 
    sbsl: null, 
    hmda: null,
    expected: null,
    stress: [] 
  });
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

  const handleFileUpload = async (type: 'sbsl' | 'hmda' | 'expected', file: File) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    addLog(`Loaded ${type.toUpperCase()} file: ${file.name}`);
    
    if (type === 'sbsl') {
      try {
        const data = await processFile(file);
        setRawData(data as SbslRow[]);
        addLog(`Parsed ${data.length} rows from SBSL file.`);
        toast({ title: "File Parsed", description: `Successfully loaded ${data.length} records.` });
        setCurrentScenario("Custom Upload");
      } catch (e) {
        addLog(`Error parsing file: ${e}`);
        toast({ title: "Error", description: "Failed to parse Excel file.", variant: "destructive" });
      }
    } else if (type === 'expected') {
       toast({ title: "Expected Output Loaded", description: "Ready for comparison." });
    }
  };

  const handleStressFiles = (files: File[]) => {
    setFiles(prev => ({ ...prev, stress: files }));
    toast({ title: "Stress Test Files", description: `Selected ${files.length} files for testing.` });
  };

  const loadTestScenario = async (filename: string, label: string) => {
    try {
      addLog(`Loading scenario: ${label}...`);
      const data = await fetchCsvFile(filename);
      setRawData(data);
      setFiles(prev => ({ ...prev, sbsl: new File([], filename) }));
      setCurrentScenario(label);
      addLog(`Loaded ${data.length} records from ${filename}`);
      toast({ title: "Scenario Loaded", description: `Loaded ${label} dataset.` });
    } catch (e) {
      addLog(`Error loading scenario: ${e}`);
      toast({ title: "Error", description: "Failed to load scenario data.", variant: "destructive" });
    }
  };

  const runEtlProcess = async () => {
    setIsProcessing(true);
    setActiveTab('process');
    setLogs([]); // Clear logs
    addLog("Starting ETL Process...");
    
    // Simulate processing delay
    await new Promise(r => setTimeout(r, 800));
    
    // Step 1: Filter
    addLog("Step 1: Filtering by current month...");
    const { filtered, count } = filterByCurrentMonth(rawData);
    addLog(`Filtered: Kept ${count} records (Current Month match).`);
    
    if (count === 0) {
      addLog("WARNING: No records matched current month/year filter.");
    }

    await new Promise(r => setTimeout(r, 600));
    
    // Step 2: Scrub & Validate
    let dataToValidate = filtered;
    if (filtered.length === 0 && rawData.length > 0) {
        addLog("NOTICE: Filter removed all records. For DEMO purposes, bypassing date filter to show validation logic on raw data.");
        dataToValidate = rawData;
    }

    addLog("Step 2: Validating data quality...");
    const errors = validateData(dataToValidate);
    setValidationErrors(errors);
    addLog(`Validation complete: Found ${errors.length} issues.`);
    
    // Step 3: Stats
    const summary = generateSummaryStats(dataToValidate);
    setStats(summary);
    
    setProcessedData(dataToValidate);
    setIsProcessing(false);
    addLog("ETL Process Complete.");
    
    if (errors.length > 0) {
      toast({ title: "Validation Issues Found", description: `Found ${errors.length} records requiring attention.`, variant: "destructive" });
    } else {
      toast({ title: "Success", description: "Data processed successfully with no errors." });
    }
    
    // Move to review tab automatically after short delay
    setTimeout(() => setActiveTab('review'), 500);
  };

  const runDiffComparison = async () => {
    if (!files.expected || processedData.length === 0) return;
    
    try {
      const expectedData = await processFile(files.expected);
      const result = compareDataframes(processedData, expectedData as SbslRow[]);
      setDiffResult(result);
      toast({ 
        title: result.identical ? "Test Passed" : "Differences Found", 
        variant: result.identical ? "default" : "destructive",
        description: result.identical ? "Outputs are identical." : `Found ${result.diffCount} discrepancies.`
      });
    } catch (e) {
      toast({ title: "Comparison Error", description: "Failed to process expected output file.", variant: "destructive" });
    }
  };

  const runStressTest = async () => {
    if (files.stress.length === 0) return;
    
    const results = [];
    let successCount = 0;
    let totalTime = 0;
    let totalRows = 0;

    for (const file of files.stress) {
      const start = performance.now();
      try {
        const data = await processFile(file);
        // Simulate processing
        const { filtered } = filterByCurrentMonth(data as SbslRow[]);
        const errors = validateData(filtered);
        
        const end = performance.now();
        const time = (end - start) / 1000;
        
        totalTime += time;
        totalRows += data.length;
        successCount++;

        results.push({
          file: file.name,
          rows: data.length,
          time: time.toFixed(2),
          status: 'Success',
          errors: errors.length
        });
      } catch (e) {
        results.push({
          file: file.name,
          rows: 0,
          time: 0,
          status: 'Failed',
          errors: 0
        });
      }
    }

    setStressResults(results);
    setStressStats({
      filesProcessed: files.stress.length,
      successRate: `${successCount}/${files.stress.length}`,
      avgTime: totalTime / files.stress.length,
      totalRows
    });
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
              onClick={() => setActiveTab('stress')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors", activeTab === 'stress' ? "bg-white/10 text-white" : "text-blue-200 hover:bg-white/5")}
            >
              <Activity className="w-4 h-4" />
              <span className="font-medium text-sm">Stress Test</span>
            </button>
             <button 
              onClick={() => window.open('/USER_MANUAL.md', '_blank')}
              className={cn("w-full flex items-center gap-3 px-4 py-3 rounded-md transition-colors text-blue-200 hover:bg-white/5")}
            >
              <BookOpen className="w-4 h-4" />
              <span className="font-medium text-sm">User Manual</span>
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
            {activeTab === 'upload' && 'Import Data Sources'}
            {activeTab === 'process' && 'Processing Pipeline'}
            {activeTab === 'review' && 'Data Review & Correction'}
            {activeTab === 'testing' && 'Output Comparison (Diff)'}
            {activeTab === 'stress' && 'System Stress Testing'}
          </h2>
          <div className="flex items-center gap-4">
             {currentScenario && activeTab !== 'stress' && (
                <span className="px-3 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100">
                  Scenario: {currentScenario}
                </span>
             )}
            <div className="text-sm text-slate-500">
              Period: <span className="font-medium text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </div>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
            
            {/* UPLOAD TAB */}
            <TabsContent value="upload" className="space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle>Source File 1: SBSL CRA Export</CardTitle>
                    <CardDescription>Upload the raw export from the SBSL system.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="SBSL Export (.xlsx)" 
                      onFileSelect={(f) => handleFileUpload('sbsl', f)} 
                      file={files.sbsl}
                    />
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle>Source File 2: HMDA Template</CardTitle>
                    <CardDescription>Upload the current monthly HMDA template file.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <FileUpload 
                      label="HMDA Template (.xls/x)" 
                      onFileSelect={(f) => handleFileUpload('hmda', f)}
                      file={files.hmda}
                    />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-end gap-3">
                 <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <FlaskConical className="w-4 h-4" /> Load Test Scenario
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel>Select Scenario</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={() => loadTestScenario('sample_sbsl_cra_export.csv', 'Primary Test File')}>
                      Primary Test File (Sample SBSL)
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadTestScenario('validation_test_cases.csv', 'Validation Errors')}>
                      Validation Test Cases
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadTestScenario('current_month_test.csv', 'Month Filter Test')}>
                      Current Month Filter Test
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadTestScenario('duplicate_test.csv', 'Duplicate Detection')}>
                      Duplicate Test Data
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => loadTestScenario('edge_cases.csv', 'Edge Cases')}>
                      Edge Cases & Boundaries
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button 
                  onClick={() => setActiveTab('process')} 
                  disabled={!files.sbsl}
                  className="bg-[#003366] hover:bg-[#002244]"
                >
                  Continue to Process <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

            {/* PROCESS TAB */}
            <TabsContent value="process" className="space-y-6 mt-0">
              <div className="grid grid-cols-3 gap-6">
                <Card className="col-span-2">
                  <CardHeader>
                    <CardTitle>ETL Execution Log</CardTitle>
                    <CardDescription>Real-time processing status</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="bg-slate-950 text-slate-50 font-mono text-sm p-4 rounded-md h-[300px] overflow-y-auto shadow-inner">
                      {logs.length === 0 && <span className="text-slate-500">Waiting to start...</span>}
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
                      <p className="font-medium mb-1">This will automatically:</p>
                      <ul className="list-disc pl-3 space-y-1">
                        <li>Filter by current month</li>
                        <li>Remove duplicates</li>
                        <li>Validate data types</li>
                        <li>Check required fields</li>
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
                      <Button variant="outline" size="sm" className="w-full">
                        <Download className="mr-2 h-3 w-3" /> Export CSV
                      </Button>
                    </CardContent>
                  </Card>
                </div>
              )}

              <Card>
                <CardHeader>
                  <CardTitle>Data Review</CardTitle>
                  <CardDescription>Review processed records. Rows with errors are highlighted.</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="rounded-md border overflow-hidden">
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="bg-slate-100 text-slate-600 font-medium border-b">
                          <tr>
                            <th className="px-4 py-3">Appl Numb</th>
                            <th className="px-4 py-3">Last Name</th>
                            <th className="px-4 py-3">Loan Amount</th>
                            <th className="px-4 py-3">Note Date</th>
                            <th className="px-4 py-3">Status</th>
                            <th className="px-4 py-3">Issues</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y">
                          {processedData.map((row, i) => {
                            const error = validationErrors.find(e => e.applNumb === row.ApplNumb);
                            return (
                              <tr key={i} className={cn("hover:bg-slate-50 transition-colors", error ? "bg-red-50/50 hover:bg-red-50" : "")}>
                                <td className="px-4 py-3 font-medium">{row.ApplNumb}</td>
                                <td className="px-4 py-3">{row['Last Name']}</td>
                                <td className="px-4 py-3">${Number(row['Loan Amount']).toLocaleString()}</td>
                                <td className="px-4 py-3">{String(row['Note Date'])}</td>
                                <td className="px-4 py-3">
                                  {error ? (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                      Action Required
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                      Valid
                                    </span>
                                  )}
                                </td>
                                <td className="px-4 py-3 text-red-600 text-xs max-w-[200px] truncate">
                                  {error?.errors.join(", ")}
                                </td>
                              </tr>
                            );
                          })}
                          {processedData.length === 0 && (
                            <tr>
                              <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                                No data available. Run the ETL process first.
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* TESTING TAB (DIFF) */}
            <TabsContent value="testing" className="space-y-6 mt-0">
              <div className="grid grid-cols-2 gap-6">
                 <Card>
                  <CardHeader>
                    <CardTitle>Upload Expected Output</CardTitle>
                    <CardDescription>Upload the "Gold Standard" file to compare against current results.</CardDescription>
                  </CardHeader>
                  <CardContent>
                     <FileUpload 
                      label="Expected Output File" 
                      onFileSelect={(f) => handleFileUpload('expected', f)}
                      file={files.expected}
                    />
                  </CardContent>
                </Card>

                 <Card>
                  <CardHeader>
                    <CardTitle>Comparison Controls</CardTitle>
                    <CardDescription>Run the diff engine to check for discrepancies.</CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col justify-center h-[180px] gap-4">
                     <Button 
                       onClick={runDiffComparison} 
                       disabled={!files.expected || processedData.length === 0}
                       className="w-full bg-[#003366] hover:bg-[#002244]"
                     >
                       <FileDiff className="mr-2 h-4 w-4" /> Run Comparison
                     </Button>
                     {!processedData.length && (
                       <p className="text-xs text-amber-600 flex items-center justify-center">
                         <AlertTriangle className="w-3 h-3 mr-1" /> Process data first before comparing
                       </p>
                     )}
                  </CardContent>
                </Card>
              </div>

              {diffResult && (
                <Card className={cn("border-l-4", diffResult.identical ? "border-l-green-500" : "border-l-red-500")}>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {diffResult.identical ? <CheckCircle2 className="text-green-500" /> : <AlertTriangle className="text-red-500" />}
                      Comparison Results
                    </CardTitle>
                    <CardDescription>
                      {diffResult.identical 
                        ? "The output matches the expected file exactly." 
                        : `Found ${diffResult.diffCount} differences between Actual and Expected.`}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {!diffResult.identical && (
                       <Accordion type="single" collapsible className="w-full">
                         <AccordionItem value="diffs">
                           <AccordionTrigger>View Detailed Differences</AccordionTrigger>
                           <AccordionContent>
                             <div className="rounded-md border">
                               <table className="w-full text-sm">
                                 <thead className="bg-slate-100">
                                   <tr>
                                     <th className="p-2 text-left">Type</th>
                                     <th className="p-2 text-left">Column</th>
                                     <th className="p-2 text-left">Rows Affected</th>
                                     <th className="p-2 text-left">Sample Actual</th>
                                     <th className="p-2 text-left">Sample Expected</th>
                                   </tr>
                                 </thead>
                                 <tbody>
                                   {diffResult.differences.map((diff, i) => (
                                     <tr key={i} className="border-t">
                                       <td className="p-2 font-medium text-red-600">{diff.type}</td>
                                       <td className="p-2">{diff.column || '-'}</td>
                                       <td className="p-2">{diff.rowsAffected || '-'}</td>
                                       <td className="p-2 font-mono text-xs bg-red-50">{diff.sampleActual || '-'}</td>
                                       <td className="p-2 font-mono text-xs bg-green-50">{diff.sampleExpected || '-'}</td>
                                     </tr>
                                   ))}
                                 </tbody>
                               </table>
                             </div>
                           </AccordionContent>
                         </AccordionItem>
                       </Accordion>
                    )}
                    <div className="grid grid-cols-3 gap-4 mt-4">
                      <div className="bg-slate-50 p-3 rounded text-center">
                        <div className="text-xs text-muted-foreground">Actual Rows</div>
                        <div className="font-bold text-lg">{diffResult.actualRows}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded text-center">
                        <div className="text-xs text-muted-foreground">Expected Rows</div>
                        <div className="font-bold text-lg">{diffResult.expectedRows}</div>
                      </div>
                      <div className="bg-slate-50 p-3 rounded text-center">
                        <div className="text-xs text-muted-foreground">Difference</div>
                        <div className="font-bold text-lg text-blue-600">{diffResult.rowDiff}</div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* STRESS TEST TAB */}
             <TabsContent value="stress" className="space-y-6 mt-0">
               <Card>
                 <CardHeader>
                   <CardTitle>System Stress Testing</CardTitle>
                   <CardDescription>Upload multiple large files to test system performance and stability.</CardDescription>
                 </CardHeader>
                 <CardContent className="space-y-6">
                   <div className="border-2 border-dashed rounded-lg p-8 text-center hover:bg-slate-50 transition-colors cursor-pointer relative">
                      <input 
                        type="file" 
                        multiple 
                        className="absolute inset-0 opacity-0 cursor-pointer"
                        onChange={(e) => e.target.files && handleStressFiles(Array.from(e.target.files))}
                      />
                      <Activity className="w-10 h-10 text-slate-300 mx-auto mb-2" />
                      <p className="font-medium">Drag & Drop Multiple Files Here</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {files.stress.length > 0 ? `${files.stress.length} files selected` : "Supports .xlsx, .xls, .csv"}
                      </p>
                   </div>

                   <Button 
                     onClick={runStressTest} 
                     disabled={files.stress.length === 0}
                     className="w-full bg-amber-600 hover:bg-amber-700"
                   >
                     <Activity className="mr-2 h-4 w-4" /> Run Stress Test
                   </Button>
                   
                   {stressResults.length > 0 && (
                     <div className="space-y-4">
                        <div className="grid grid-cols-4 gap-4">
                           <div className="bg-white border p-4 rounded-lg">
                             <div className="text-xs text-muted-foreground uppercase">Files</div>
                             <div className="text-2xl font-bold">{stressStats.filesProcessed}</div>
                           </div>
                            <div className="bg-white border p-4 rounded-lg">
                             <div className="text-xs text-muted-foreground uppercase">Success Rate</div>
                             <div className="text-2xl font-bold text-green-600">{stressStats.successRate}</div>
                           </div>
                            <div className="bg-white border p-4 rounded-lg">
                             <div className="text-xs text-muted-foreground uppercase">Avg Time</div>
                             <div className="text-2xl font-bold">{stressStats.avgTime.toFixed(2)}s</div>
                           </div>
                            <div className="bg-white border p-4 rounded-lg">
                             <div className="text-xs text-muted-foreground uppercase">Total Rows</div>
                             <div className="text-2xl font-bold">{stressStats.totalRows}</div>
                           </div>
                        </div>

                        <div className="rounded-md border overflow-hidden">
                          <table className="w-full text-sm">
                            <thead className="bg-slate-100 text-left">
                              <tr>
                                <th className="p-3">File Name</th>
                                <th className="p-3">Rows</th>
                                <th className="p-3">Time (s)</th>
                                <th className="p-3">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y">
                              {stressResults.map((res, i) => (
                                <tr key={i}>
                                  <td className="p-3 font-medium">{res.file}</td>
                                  <td className="p-3">{res.rows}</td>
                                  <td className="p-3">{res.time}</td>
                                  <td className="p-3">
                                    <span className={cn("px-2 py-1 rounded-full text-xs font-medium", res.status === 'Success' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700")}>
                                      {res.status}
                                    </span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                     </div>
                   )}
                 </CardContent>
               </Card>
             </TabsContent>

          </Tabs>
        </main>
      </div>
    </div>
  );
}
