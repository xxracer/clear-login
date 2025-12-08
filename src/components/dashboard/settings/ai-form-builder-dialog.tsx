
'use client';

import { useState, useTransition } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, HelpCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateFormFromOptions, GenerateFormOptionsOutput } from '@/ai/flows/generate-form-from-options-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { AlertDialog, AlertDialogAction, AlertDialogContent, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { format } from 'date-fns';
import { FormItem } from '@/components/ui/form';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { AiFormField } from '@/lib/company-schemas';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const coreFields = [
    { id: 'fullName', label: 'Full Legal Name' },
    { id: 'email', label: 'Email Address' },
    { id: 'phone', label: 'Phone Number' },
    { id: 'authToWork', label: 'Authorization to Work in the U.S.' },
    { id: 'backgroundCheck', label: 'Background Check Consent' },
];

const recommendedFields = [
    { id: 'address', label: 'Address', tooltip: 'Helps verify applicant location for service areas.' },
    { id: 'availability', label: 'Work Availability', tooltip: 'Helps match applicant availability to open shifts.' },
    { id: 'workHistory', label: 'Previous Work Experience', tooltip: 'Provides insight into the applicant\'s job history.' },
    { id: 'licenseInfo', label: 'Driver’s License Information', tooltip: 'Required for positions that involve driving.' },
    { id: 'resumeUpload', label: 'Upload Resume', tooltip: 'Allows applicants to provide a detailed CV.' },
];

const jobSpecificFields = [
     { id: 'cnaLicense', label: 'CNA Certification / License Number' },
     { id: 'cprCert', label: 'CPR Certification Status' },
     { id: 'tbTest', label: 'TB Test Status' },
     { id: 'liftAbility', label: 'Physical Ability (e.g., can lift 50 lbs)' },
]

const optionalFields = [
    { id: 'emergencyContact', label: 'Emergency Contact', tooltip: 'If included but not marked as required, applicants may leave this blank.' },
    { id: 'references', label: 'References' },
    { id: 'additionalQuestions', label: 'Additional Questions (short answers)' },
    { id: 'skillsChecklist', label: 'Skills Checklist Basic Questions' },
    { id: 'coverLetter', label: 'Cover Letter or Description field' },
]


type AiFormBuilderDialogProps = {
    isOpen: boolean;
    onOpenChange: (isOpen: boolean) => void;
    companyName?: string;
    onFormGenerated: (name: string, fields: AiFormField[]) => Promise<void>;
}

export function AiFormBuilderDialog({ isOpen, onOpenChange, companyName, onFormGenerated }: AiFormBuilderDialogProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedForm, setGeneratedForm] = useState<{ name: string; date: Date; fields: GenerateFormOptionsOutput['fields'] } | null>(null);
    const [isPending, startTransition] = useTransition();

    // Form State for Step 1
    const [recommendedFieldsState, setRecommendedFieldsState] = useState(
        recommendedFields.reduce((acc, field) => ({ ...acc, [field.id]: { included: true, required: true } }), {})
    );

    const resetForm = () => {
        setStep(1);
        setIsLoading(false);
        setGeneratedForm(null);
        setRecommendedFieldsState(
             recommendedFields.reduce((acc, field) => ({ ...acc, [field.id]: { included: true, required: true } }), {})
        );
    };

    const handleOpenChange = (open: boolean) => {
        if (!open) {
            resetForm();
        }
        onOpenChange(open);
    };
    
    const handleNextStep = () => {
       setStep(s => s + 1);
    };

    const handleGenerateForm = async () => {
        setIsLoading(true);
        // This is where you would eventually gather all state and call the AI flow
        setTimeout(() => {
            setIsLoading(false);
            setStep(3); // Move to loading screen simulation
        }, 1000);
    };

    const renderFieldSelection = (field: {id: string, label: string, tooltip?: string}, state: any, setState: Function) => (
        <div key={field.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`include-${field.id}`}
                    checked={state[field.id]?.included}
                    onCheckedChange={(checked) => setState({ ...state, [field.id]: { ...state[field.id], included: checked } })}
                />
                <Label htmlFor={`include-${field.id}`} className="font-medium">{field.label}</Label>
                {field.tooltip && (
                    <TooltipProvider>
                        <Tooltip>
                            <TooltipTrigger asChild><HelpCircle className="h-4 w-4 text-muted-foreground cursor-help" /></TooltipTrigger>
                            <TooltipContent><p>{field.tooltip}</p></TooltipContent>
                        </Tooltip>
                    </TooltipProvider>
                )}
            </div>
            {state[field.id]?.included && (
                <div className="flex items-center space-x-2">
                    <Label htmlFor={`required-${field.id}`}>Required?</Label>
                    <Switch
                        id={`required-${field.id}`}
                        checked={state[field.id]?.required}
                        onCheckedChange={(checked) => setState({ ...state, [field.id]: { ...state[field.id], required: checked } })}
                    />
                </div>
            )}
        </div>
    );

    const renderStepContent = () => {
        if (isLoading || isPending) {
            return (
                <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[400px]">
                    <Loader2 className="h-12 w-12 animate-spin text-primary" />
                    <p className="text-muted-foreground">{isPending ? "Saving your form..." : "Generating your form..."}</p>
                </div>
            );
        }

        switch (step) {
            case 1:
                return (
                    <div className="space-y-6 max-h-[60vh] overflow-y-auto pr-4">
                        <div>
                            <h4 className="font-semibold text-foreground">Core Required Fields</h4>
                            <p className="text-xs text-muted-foreground">These fields are required for all ClearComply applications.</p>
                            <div className="mt-2 space-y-2">
                                {coreFields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-md bg-muted/50">
                                        <div className="flex items-center gap-2">
                                            <Checkbox id={field.id} checked disabled />
                                            <Label htmlFor={field.id} className="font-medium text-muted-foreground">{field.label}</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor={`req-${field.id}`} className="text-muted-foreground">Required?</Label>
                                            <Switch id={`req-${field.id}`} checked disabled />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>

                        <div>
                            <h4 className="font-semibold text-foreground">Recommended Fields</h4>
                            <div className="mt-2 space-y-2">
                                {recommendedFields.map(field => renderFieldSelection(field, recommendedFieldsState, setRecommendedFieldsState))}
                            </div>
                        </div>

                         <div>
                            <h4 className="font-semibold text-foreground">Job-Type Specific Fields (e.g., for CNA)</h4>
                             <p className="text-xs text-muted-foreground">These fields are commonly required for this position. You may include or remove them.</p>
                            <div className="mt-2 space-y-2">
                                {/* Placeholder for dynamic fields */}
                                {jobSpecificFields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-md opacity-50">
                                        <Label className="font-medium">{field.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>

                         <div>
                            <h4 className="font-semibold text-foreground">Optional Fields</h4>
                            <div className="mt-2 space-y-2">
                                 {optionalFields.map(field => (
                                    <div key={field.id} className="flex items-center justify-between p-3 border rounded-md opacity-50">
                                        <Label className="font-medium">{field.label}</Label>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                 return (
                    <div className="space-y-6">
                        {/* Placeholder for Step 2 content */}
                        <h3 className="font-semibold">Step 2: Custom Instructions</h3>
                        <Textarea placeholder="Example: Make the tone friendly, add a question about preferred schedule, translate labels to Spanish, etc." rows={10} />
                    </div>
                 )
            // Other steps would go here
            default:
                return <div>Step {step}</div>;
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-3xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">AI Application Form Wizard</DialogTitle>
                    {step === 1 && <DialogDescription>Choose what you want to include in your job application. You can also choose which fields are required.</DialogDescription>}
                    {step === 2 && <DialogDescription>Optional: Tell the AI how you’d like your application to sound or if you want any additional questions included.</DialogDescription>}
                </DialogHeader>
                
                <div className="py-4">
                    {renderStepContent()}
                </div>

                <DialogFooter>
                    <div className="flex justify-between w-full">
                        <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1 || isLoading}>
                            <ArrowLeft className="mr-2 h-4 w-4" /> Back
                        </Button>
                        
                        {step === 1 ? (
                            <Button onClick={handleNextStep} disabled={isLoading}>
                                Next <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : step === 2 ? (
                            <Button onClick={handleGenerateForm} disabled={isLoading}>
                                {isLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Generate My Application Form <ArrowRight className="ml-2 h-4 w-4" />
                            </Button>
                        ) : (
                           <Button onClick={() => { /* Placeholder for final action */ }} disabled={isLoading}>
                                Use This Form
                            </Button>
                        )}
                    </div>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
