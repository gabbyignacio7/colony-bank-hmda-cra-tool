import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, FileText, CheckCircle, Download, ExternalLink } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import videoUrl from "@assets/generated_videos/colony_bank_hmda_cra_tool_tutorial_video_(max_duration).mp4";

export function TutorialVideo() {
  const [activeStep, setActiveStep] = useState<number | null>(null);

  const steps = [
    {
      title: "Upload File",
      desc: "Upload your SBSL CRA Export Excel file.",
      icon: <FileText className="w-6 h-6 text-blue-600" />,
      duration: 3000
    },
    {
      title: "Choose Options",
      desc: "Keep all validation boxes checked.",
      icon: <CheckCircle className="w-6 h-6 text-green-600" />,
      duration: 3000
    },
    {
      title: "Process Data",
      desc: "Click 'Process' and wait for validation.",
      icon: <Play className="w-6 h-6 text-amber-600" />,
      duration: 2000
    },
    {
      title: "Download Results",
      desc: "Get your Clean Data, CRAWiz TXT, and Report.",
      icon: <Download className="w-6 h-6 text-purple-600" />,
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
        setTimeout(() => setActiveStep(null), 2000); // Reset after completion
      }
    }, 3000);
  };

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 gap-8">
        {/* Video Section (Approach 1) */}
        <Card>
          <CardHeader>
            <CardTitle>Video Walkthrough</CardTitle>
            <CardDescription>Watch a quick guide on how to use the tool.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="aspect-video bg-slate-900 rounded-lg flex items-center justify-center relative group cursor-pointer overflow-hidden">
               <video src={videoUrl} controls className="w-full h-full object-cover" />
            </div>
          </CardContent>
        </Card>

        {/* Interactive Tutorial (Approach 2) */}
        <Card>
           <CardHeader>
            <CardTitle>Interactive Guide</CardTitle>
            <CardDescription>Follow the step-by-step process flow.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
             <div className="flex justify-center py-4">
                <Button onClick={startTutorial} disabled={activeStep !== null} className="bg-[#003366]">
                  {activeStep !== null ? "Playing Tutorial..." : "Start Interactive Guide"}
                </Button>
             </div>

             <div className="space-y-4">
               {steps.map((step, idx) => (
                 <div 
                   key={idx}
                   className={cn(
                     "flex items-center gap-4 p-4 rounded-lg border transition-all duration-500",
                     activeStep === idx 
                       ? "border-blue-500 bg-blue-50 scale-105 shadow-md" 
                       : "border-slate-100 bg-slate-50 opacity-60"
                   )}
                 >
                   <div className={cn(
                     "w-10 h-10 rounded-full flex items-center justify-center bg-white shadow-sm transition-colors",
                     activeStep === idx ? "ring-2 ring-blue-200" : ""
                   )}>
                     {step.icon}
                   </div>
                   <div>
                     <h4 className={cn("font-semibold", activeStep === idx ? "text-blue-900" : "text-slate-700")}>
                       {step.title}
                     </h4>
                     <p className="text-xs text-slate-500">{step.desc}</p>
                   </div>
                   {activeStep === idx && (
                     <div className="ml-auto">
                       <div className="w-2 h-2 bg-blue-500 rounded-full animate-ping" />
                     </div>
                   )}
                 </div>
               ))}
             </div>
          </CardContent>
        </Card>
      </div>

      {/* Visual Guide (Approach 3 - Simplified) */}
      <Card>
        <CardHeader>
          <CardTitle>Quick Reference</CardTitle>
          <CardDescription>Key steps at a glance.</CardDescription>
        </CardHeader>
        <CardContent>
           <div className="grid grid-cols-4 gap-4">
             {[1, 2, 3, 4].map((num) => (
               <div key={num} className="aspect-square bg-slate-100 rounded border flex items-center justify-center text-slate-400 text-xs relative overflow-hidden hover:border-blue-300 transition-colors">
                  <span className="absolute top-2 left-2 font-bold text-slate-300 text-xl">{num}</span>
                  [Screen {num}]
               </div>
             ))}
           </div>
        </CardContent>
      </Card>
    </div>
  );
}
