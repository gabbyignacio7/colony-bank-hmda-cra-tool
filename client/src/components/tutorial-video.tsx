import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileText, CheckCircle, Download, ExternalLink, MonitorPlay, MousePointerClick, Clock, TrendingUp, Shield, FileBarChart } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import videoUrl from "@assets/generated_videos/colony_bank_hmda_cra_tool_tutorial_video_(max_duration).mp4";

export function TutorialVideo() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      title: "1. Upload File",
      desc: "Upload your SBSL CRA Export Excel file.",
      icon: <FileText className="w-5 h-5 text-blue-600" />,
      duration: 3000
    },
    {
      title: "2. Choose Options",
      desc: "Keep all validation boxes checked.",
      icon: <CheckCircle className="w-5 h-5 text-green-600" />,
      duration: 3000
    },
    {
      title: "3. Process Data",
      desc: "Click 'Process' and wait for validation.",
      icon: <Play className="w-5 h-5 text-amber-600" />,
      duration: 2000
    },
    {
      title: "4. Download Results",
      desc: "Get your Clean Data, CRAWiz TXT, and Report.",
      icon: <Download className="w-5 h-5 text-purple-600" />,
      duration: 3000
    }
  ];

  const chapters = [
    { time: "0:00", title: "The Problem: Manual Compliance" },
    { time: "1:45", title: "Hidden Costs & Risks" },
    { time: "2:15", title: "Solution: DeepSee AI Automation" },
    { time: "3:00", title: "Demo: How It Works" },
    { time: "4:15", title: "Results & Transformation" }
  ];

  const resources = [
    { title: "Process Flow Diagram", type: "PNG", size: "1.9 MB", icon: <FileBarChart className="w-4 h-4" /> },
    { title: "ROI Calculation Breakdown", type: "PNG", size: "1.7 MB", icon: <TrendingUp className="w-4 h-4" /> },
    { title: "Validation Rules Checklist", type: "PNG", size: "1.9 MB", icon: <CheckCircle className="w-4 h-4" /> },
  ];

  const startTutorial = () => {
    setActiveStep(0);
    let current = 0;
    
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setActiveStep(current);
      } else {
        clearInterval(interval);
        setTimeout(() => setActiveStep(null), 2000);
      }
    }, 3000);
  };

  return (
    <div className="space-y-8 max-w-6xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-3xl font-bold text-slate-900">Learning Center</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Master the Colony Bank HMDA/CRA Automation Tool. Watch the comprehensive guide, access resources, and follow the interactive demo.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Main Content Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Video Player Card */}
          <Card className="overflow-hidden border-slate-200 shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <MonitorPlay className="w-5 h-5 text-[#003366]" />
                  <div>
                    <CardTitle className="text-lg text-[#003366]">Complete Walkthrough</CardTitle>
                    <CardDescription>From manual pain to automated success (4:00)</CardDescription>
                  </div>
                </div>
                <div className="hidden sm:flex gap-2">
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                     HD
                   </span>
                   <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-slate-100 text-slate-800">
                     CC
                   </span>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-0 bg-slate-900">
              <div className="aspect-video w-full relative group">
                 <video 
                   src={videoUrl} 
                   controls 
                   className="w-full h-full object-contain"
                   poster="https://images.unsplash.com/photo-1460925895917-afdab827c52f?q=80&w=2426&auto=format&fit=crop"
                 />
              </div>
              <div className="p-4 bg-white border-t border-slate-100">
                <p className="text-xs font-semibold text-slate-500 mb-3 uppercase tracking-wider">Video Chapters</p>
                <div className="flex flex-wrap gap-2">
                  {chapters.map((chapter, i) => (
                    <button key={i} className="text-xs flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-50 hover:bg-blue-50 text-slate-700 hover:text-blue-700 transition-colors border border-slate-200 hover:border-blue-200">
                      <Play className="w-3 h-3 fill-current" />
                      <span className="font-mono font-medium">{chapter.time}</span>
                      <span>{chapter.title}</span>
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Impact Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Card className="bg-gradient-to-br from-[#003366] to-[#004080] text-white border-none shadow-md">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Clock className="w-8 h-8 mb-3 opacity-80" />
                <div className="text-2xl font-bold mb-1">95%</div>
                <div className="text-xs text-blue-100 font-medium uppercase tracking-wide">Time Reduction</div>
                <div className="text-xs text-blue-200 mt-2">10 Hours → 30 Mins</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <TrendingUp className="w-8 h-8 mb-3 text-green-600" />
                <div className="text-2xl font-bold text-slate-900 mb-1">$25k+</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Annual Value</div>
                <div className="text-xs text-slate-400 mt-2">115 Hours Saved</div>
              </CardContent>
            </Card>
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardContent className="p-6 flex flex-col items-center text-center">
                <Shield className="w-8 h-8 mb-3 text-blue-600" />
                <div className="text-2xl font-bold text-slate-900 mb-1">14</div>
                <div className="text-xs text-slate-500 font-medium uppercase tracking-wide">Validation Rules</div>
                <div className="text-xs text-slate-400 mt-2">Automated & Instant</div>
              </CardContent>
            </Card>
          </div>

        </div>

        {/* Sidebar Column (1/3 width) */}
        <div className="space-y-6">
          
          {/* Interactive Guide */}
          <Card className="border-slate-200 shadow-md flex flex-col">
             <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-[#003366]" />
                <CardTitle className="text-lg text-[#003366]">Interactive Demo</CardTitle>
              </div>
              <CardDescription>Follow the live step-by-step flow.</CardDescription>
            </CardHeader>
            <CardContent className="p-6">
               <div className="space-y-6">
                 {steps.map((step, idx) => (
                   <div 
                     key={idx}
                     className={cn(
                       "relative pl-8 transition-all duration-500",
                       activeStep === idx ? "opacity-100" : "opacity-60"
                     )}
                   >
                     {/* Timeline Line */}
                     {idx !== steps.length - 1 && (
                       <div className="absolute left-3 top-8 bottom-[-24px] w-0.5 bg-slate-200" />
                     )}
                     
                     {/* Icon/Number */}
                     <div className={cn(
                       "absolute left-0 top-0 w-6 h-6 rounded-full flex items-center justify-center border-2 z-10 transition-colors",
                       activeStep === idx 
                         ? "bg-white border-blue-500 text-blue-600 shadow-sm scale-110" 
                         : activeStep !== null && idx < activeStep
                           ? "bg-green-500 border-green-500 text-white"
                           : "bg-slate-50 border-slate-300 text-slate-400"
                     )}>
                       {activeStep !== null && idx < activeStep ? (
                         <CheckCircle className="w-3 h-3" />
                       ) : (
                         <span className="text-[10px] font-bold">{idx + 1}</span>
                       )}
                     </div>

                     {/* Content */}
                     <div className={cn(
                       "p-3 rounded-lg border transition-all",
                       activeStep === idx 
                         ? "bg-blue-50 border-blue-200 shadow-sm" 
                         : "bg-white border-transparent"
                     )}>
                       <h4 className={cn("text-sm font-semibold", activeStep === idx ? "text-blue-900" : "text-slate-700")}>
                         {step.title}
                       </h4>
                       <p className="text-xs text-slate-500 mt-1 leading-relaxed">{step.desc}</p>
                     </div>
                   </div>
                 ))}
               </div>

               <div className="pt-6 mt-6 border-t border-slate-100">
                  <Button 
                    onClick={startTutorial} 
                    disabled={activeStep !== null} 
                    className="w-full bg-[#003366] hover:bg-[#002244] shadow-sm"
                  >
                    {activeStep !== null ? "Playing Demo..." : "Start Interactive Demo"}
                  </Button>
               </div>
            </CardContent>
          </Card>

          {/* Resources Download */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3 bg-slate-50 border-b border-slate-100">
              <CardTitle className="text-base flex items-center gap-2">
                <Download className="w-4 h-4" /> Helpful Resources
              </CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y divide-slate-100">
                {resources.map((resource, i) => (
                  <div key={i} className="p-3 flex items-center justify-between hover:bg-slate-50 transition-colors cursor-pointer group">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded bg-blue-50 text-blue-600 flex items-center justify-center">
                        {resource.icon}
                      </div>
                      <div>
                        <div className="text-sm font-medium text-slate-700 group-hover:text-blue-700 transition-colors">{resource.title}</div>
                        <div className="text-xs text-slate-400">{resource.type} • {resource.size}</div>
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 group-hover:text-blue-600">
                      <Download className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

        </div>

      </div>
    </div>
  );
}
