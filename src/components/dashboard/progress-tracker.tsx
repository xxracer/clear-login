
"use client";

import { CheckCircle, FileText, FileUp, ClipboardList, UserCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";

type Status = 'candidate' | 'interview' | 'new-hire' | 'employee' | 'inactive';

type ProgressTrackerProps = {
    candidateId: string;
    status: Status;
};


export function ProgressTracker({ candidateId, status }: ProgressTrackerProps) {

  const phases = [
    {
      id: "candidate",
      name: "Phase 1: Application Received",
      description: "Initial candidate data has been submitted.",
      icon: FileText,
    },
    {
      id: "interview",
      name: "Phase 2: Interview",
      description: "Schedule and conduct the candidate interview.",
      icon: ClipboardList,
    },
    {
      id: "documentation",
      name: "Phase 3: Detailed Documentation",
      description: "Upload and verify all required documents.",
      icon: FileUp,
    },
     {
      id: "new-hire",
      name: "Phase 4: Hired",
      description: "The candidate has been marked as a new hire.",
      icon: UserCheck,
    },
  ];

  const statusToPhaseId: Record<Status, string> = {
    'candidate': 'candidate',
    'interview': 'interview',
    'new-hire': 'new-hire',
    'employee': 'new-hire',
    'inactive': 'new-hire',
  }

  const currentPhaseId = statusToPhaseId[status];
  const currentPhaseIndex = phases.findIndex(p => p.id === currentPhaseId);

  return (
    <Card>
        <CardContent className="p-6">
            <h2 className="text-xl font-headline font-semibold mb-4">Onboarding Progress</h2>
            <div className="relative">
                <div className="absolute left-0 top-0 h-full w-[2px] bg-border translate-x-[1rem]" aria-hidden="true" />
                <ol className="space-y-8">
                {phases.map((phase, index) => {
                    const isCompleted = index < currentPhaseIndex;
                    const isCurrent = index === currentPhaseIndex;
                    
                    return (
                    <li key={phase.id} className="flex items-start gap-4">
                        <div className="flex-shrink-0">
                            <span className={cn(
                                "flex h-8 w-8 items-center justify-center rounded-full",
                                isCompleted ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground",
                                isCurrent && "ring-4 ring-primary/20 bg-primary text-primary-foreground"
                            )}>
                                {isCompleted ? <CheckCircle className="h-5 w-5" /> : <phase.icon className="h-5 w-5" />}
                            </span>
                        </div>
                        <div>
                            <p className="font-semibold text-foreground">{phase.name}</p>
                            <p className="text-sm text-muted-foreground">{phase.description}</p>
                        </div>
                    </li>
                    )
                })}
                </ol>
            </div>
        </CardContent>
    </Card>

  );
}
