import { useState, useEffect } from 'react';
import { FileUpload } from '@/components/file-upload';
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
  ChevronRight
} from 'lucide-react';
import { 
  processFile, 
  MOCK_SBSL_DATA, 
  filterByCurrentMonth, 
  validateData, 
  generateSummaryStats,
  type SbslRow,
  type ValidationResult
} from '@/lib/etl-engine';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

export default function Dashboard() {
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('upload');
  const [logs, setLogs] = useState<string[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  
  // State
  const [files, setFiles] = useState<{sbsl: File | null, hmda: File | null}>({ sbsl: null, hmda: null });
  const [rawData, setRawData] = useState<SbslRow[]>([]);
  const [processedData, setProcessedData] = useState<SbslRow[]>([]);
  const [validationErrors, setValidationErrors] = useState<ValidationResult[]>([]);
  const [stats, setStats] = useState<any>(null);

  const addLog = (msg: string) => {
    setLogs(prev => [...prev, `[${new Date().toLocaleTimeString()}] ${msg}`]);
  };

  const handleFileUpload = async (type: 'sbsl' | 'hmda', file: File) => {
    setFiles(prev => ({ ...prev, [type]: file }));
    addLog(`Loaded ${type.toUpperCase()} file: ${file.name}`);
    
    if (type === 'sbsl') {
      try {
        const data = await processFile(file);
        setRawData(data as SbslRow[]);
        addLog(`Parsed ${data.length} rows from SBSL file.`);
        toast({ title: "File Parsed", description: `Successfully loaded ${data.length} records.` });
      } catch (e) {
        addLog(`Error parsing file: ${e}`);
        toast({ title: "Error", description: "Failed to parse Excel file.", variant: "destructive" });
      }
    }
  };

  const loadDemoData = () => {
    setRawData(MOCK_SBSL_DATA);
    addLog("Loaded Mock SBSL Data for demonstration.");
    setFiles(prev => ({ ...prev, sbsl: new File([], "mock_sbsl_export.xlsx") }));
    toast({ title: "Demo Data Loaded", description: "Using sample dataset for testing." });
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
    addLog(`Filtered: Kept ${count} records for current month.`);
    
    await new Promise(r => setTimeout(r, 600));
    
    // Step 2: Scrub & Validate
    addLog("Step 2: Validating data quality...");
    const errors = validateData(filtered);
    setValidationErrors(errors);
    addLog(`Validation complete: Found ${errors.length} issues.`);
    
    // Step 3: Stats
    const summary = generateSummaryStats(filtered);
    setStats(summary);
    
    setProcessedData(filtered);
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
        </nav>
        
        <div className="p-6 border-t border-white/10">
          <div className="text-xs text-blue-300 mb-2">System Status</div>
          <div className="flex items-center gap-2 text-sm text-green-400">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
            Online
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
          </h2>
          <div className="text-sm text-slate-500">
            Current Period: <span className="font-medium text-slate-900">{new Date().toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          </div>
        </header>

        <main className="flex-1 overflow-auto p-8">
          
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full max-w-5xl mx-auto">
            
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
                <Button variant="outline" onClick={loadDemoData}>Use Demo Data</Button>
                <Button 
                  onClick={() => setActiveTab('process')} 
                  disabled={!files.sbsl}
                  className="bg-[#003366] hover:bg-[#002244]"
                >
                  Continue to Process <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </TabsContent>

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
            
          </Tabs>
        </main>
      </div>
    </div>
  );
}
