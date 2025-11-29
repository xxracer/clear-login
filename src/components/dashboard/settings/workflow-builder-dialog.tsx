'use client';

import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, ArrowRight, ArrowLeft } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';

type WorkflowBuilderDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
};

export function WorkflowBuilderDialog({ isOpen, onOpenChange }: WorkflowBuilderDialogProps) {
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);

    const resetWizard = () => {
        setStep(1);
        setIsLoading(false);
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetWizard();
        }
        onOpenChange(open);
    };

    const renderStep = () => {
        switch (step) {
            case 1:
                return (
                    <div className="space-y-6">
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
            // Add other steps here later
            default:
                return <div>Step {step}</div>;
        }
    };

    return (
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
                    <div className="p-6 border rounded-lg bg-muted/30">
                        <h3 className="font-semibold mb-4 text-lg">Step {step}: Job Basics</h3>
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
    );
}
