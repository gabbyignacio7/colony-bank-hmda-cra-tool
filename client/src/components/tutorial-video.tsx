import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileText, CheckCircle, Download, ExternalLink, MonitorPlay, MousePointerClick } from "lucide-react";
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
    <div className="space-y-8 max-w-5xl mx-auto pb-12">
      
      {/* Header Section */}
      <div className="text-center space-y-2 mb-8">
        <h2 className="text-2xl font-bold text-slate-900">User Guide & Tutorials</h2>
        <p className="text-slate-500 max-w-2xl mx-auto">
          Learn how to use the Colony Bank HMDA/CRA Automation Tool efficiently. Watch the video or follow the interactive guide.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Video Column (2/3 width) */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="overflow-hidden border-slate-200 shadow-md">
            <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MonitorPlay className="w-5 h-5 text-[#003366]" />
                <CardTitle className="text-lg text-[#003366]">Video Walkthrough</CardTitle>
              </div>
              <CardDescription>A quick 90-second overview of the entire process.</CardDescription>
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
            </CardContent>
          </Card>

          {/* Quick Reference (Moved here for better flow) */}
          <Card className="border-slate-200 shadow-sm">
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Quick Reference Steps</CardTitle>
            </CardHeader>
            <CardContent>
               <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                 {[
                   { step: 1, label: "Upload SBSL File" },
                   { step: 2, label: "Select Options" },
                   { step: 3, label: "Run Process" },
                   { step: 4, label: "Download Files" }
                 ].map((item) => (
                   <div key={item.step} className="p-3 bg-slate-50 rounded-md border border-slate-100 flex flex-col items-center text-center gap-2 hover:border-blue-200 hover:bg-blue-50/50 transition-colors">
                      <div className="w-6 h-6 rounded-full bg-[#003366] text-white text-xs font-bold flex items-center justify-center">
                        {item.step}
                      </div>
                      <span className="text-xs font-medium text-slate-600">{item.label}</span>
                   </div>
                 ))}
               </div>
            </CardContent>
          </Card>
        </div>

        {/* Interactive Guide Column (1/3 width) */}
        <div className="space-y-6">
          <Card className="h-full border-slate-200 shadow-md flex flex-col">
             <CardHeader className="bg-slate-50 border-b border-slate-100 pb-4">
              <div className="flex items-center gap-2">
                <MousePointerClick className="w-5 h-5 text-[#003366]" />
                <CardTitle className="text-lg text-[#003366]">Interactive Guide</CardTitle>
              </div>
              <CardDescription>Follow along step-by-step.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col">
               <div className="space-y-6 flex-1">
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
                    {activeStep !== null ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 
                        Playing Step {activeStep + 1}...
                      </>
                    ) : (
                      <>
                        <Play className="w-4 h-4 mr-2" /> 
                        Start Interactive Demo
                      </>
                    )}
                  </Button>
               </div>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}
