'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ArrowLeft, CheckCircle, Upload, Bot, FileText } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { Card } from '@/components/ui/card';
import { AiFormBuilderDialog } from './ai-form-builder-dialog';

type WorkflowBuilderDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function WorkflowBuilderDialog({ isOpen, onOpenChange }: WorkflowBuilderDialogProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [isAiFormBuilderOpen, setIsAiFormBuilderOpen] = useState(false);

    // State for Step 2
    const [applicationFormType, setApplicationFormType] = useState<'template' | 'upload' | 'ai' | null>('template');


    const resetWizard = () => {
        setStep(1);
        setIsLoading(false);
        setApplicationFormType('template');
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetWizard();
        }
        onOpenChange(open);
    };

    const handleApplicationTypeSelect = (type: 'template' | 'upload' | 'ai') => {
        setApplicationFormType(type);
        if (type === 'ai') {
            setIsAiFormBuilderOpen(true);
        }
    }
    
    const handleFormGenerated = (name: string, fields: any[]) => {
        // Here we would save the generated form config to the workflow state
        console.log("AI Form Generated:", name, fields);
        // For now, just close the dialog
        setIsAiFormBuilderOpen(false);
    }


    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                     <div className="space-y-6">
                        <h3 className="font-semibold text-lg">Step 1: Job Basics</h3>
                        <div className="space-y-2">
                            <Label htmlFor="jobTitle">Job Title</Label>
                            <Input id="jobTitle" placeholder="e.g., Certified Nursing Assistant (CNA)" />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="jobDescription">Job Description</Label>
                            <Textarea id="jobDescription" placeholder="Describe the role and responsibilities..." />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <Label htmlFor="department">Department (Optional)</Label>
                                <Input id="department" placeholder="e.g., Home Care" />
                            </div>
                            <div className="space-y-2">
                                <Label htmlFor="workerType">Worker Type</Label>
                                <Select>
                                    <SelectTrigger id="workerType">
                                        <SelectValue placeholder="Select a type" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="skilled">Skilled</SelectItem>
                                        <SelectItem value="unskilled">Unskilled</SelectItem>
                                        <SelectItem value="admin">Admin</SelectItem>
                                        <SelectItem value="other">Other</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </div>
                );
            case 2:
                return (
                    <div className="space-y-6">
                        <h3 className="font-semibold text-lg">Step 2: Application Form</h3>
                         <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <Card 
                                className={cn("p-4 text-center cursor-pointer hover:shadow-lg transition-shadow relative", applicationFormType === 'upload' && "ring-2 ring-primary")}
                                onClick={() => handleApplicationTypeSelect('upload')}
                            >
                                {applicationFormType === 'upload' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500" />}
                                <Upload className="h-10 w-10 mx-auto mb-2 text-primary" />
                                <h4 className="font-semibold">Upload Your Application</h4>
                                <p className="text-xs text-muted-foreground">Use your existing PDF or image files.</p>
                            </Card>
                             <Card 
                                className={cn("p-4 text-center cursor-pointer hover:shadow-lg transition-shadow relative", applicationFormType === 'ai' && "ring-2 ring-primary")}
                                onClick={() => handleApplicationTypeSelect('ai')}
                            >
                                {applicationFormType === 'ai' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500" />}
                                <Bot className="h-10 w-10 mx-auto mb-2 text-primary" />
                                <h4 className="font-semibold">AI-Generate Application</h4>
                                <p className="text-xs text-muted-foreground">Describe the form and let AI build it.</p>
                            </Card>
                             <Card 
                                className={cn("p-4 text-center cursor-pointer hover:shadow-lg transition-shadow relative", applicationFormType === 'template' && "ring-2 ring-primary")}
                                onClick={() => handleApplicationTypeSelect('template')}
                            >
                                {applicationFormType === 'template' && <CheckCircle className="absolute top-2 right-2 h-5 w-5 text-green-500" />}
                                <FileText className="h-10 w-10 mx-auto mb-2 text-primary" />
                                <h4 className="font-semibold">Use Default Template</h4>
                                <p className="text-xs text-muted-foreground">Start with the standard, comprehensive form.</p>
                            </Card>
                         </div>
                    </div>
                );
            default:
                return <div>Step {step}</div>;
        }
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={handleOpenChange}>
                <DialogContent className="sm:max-w-[700px]">
                    <DialogHeader>
                        <DialogTitle>Onboarding Workflow Builder</DialogTitle>
                        <DialogDescription>
                            Create a new onboarding process for a specific job role. (Step {step} of 4)
                        </DialogDescription>
                    </DialogHeader>

                    <div className="py-4">
                        {/* Progress Bar can go here */}
                        <div className="p-6 border rounded-lg bg-muted/50 min-h-[350px]">
                            {renderStep()}
                        </div>
                    </div>

                    <DialogFooter>
                        <div className="flex justify-between w-full">
                            <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1 || isLoading}>
                                <ArrowLeft className="mr-2 h-4 w-4" /> Back
                            </Button>
                            <Button onClick={() => setStep(s => s + 1)} disabled={isLoading}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        </div>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            <AiFormBuilderDialog 
                isOpen={isAiFormBuilderOpen}
                onOpenChange={setIsAiFormBuilderOpen}
                onFormGenerated={handleFormGenerated}
            />
        </>
    );
}
