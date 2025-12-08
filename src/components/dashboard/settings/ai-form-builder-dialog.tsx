
'use client';

import { useState, useTransition, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, ArrowRight, ArrowLeft, HelpCircle, Bot, Edit, RefreshCw, XCircle, Send } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { generateFormFromOptions, GenerateFormOptionsInput, GenerateFormOptionsOutput } from '@/ai/flows/generate-form-from-options-flow';
import { Alert, AlertTitle, AlertDescription } from '@/components/ui/alert';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Switch } from '@/components/ui/switch';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Textarea } from '@/components/ui/textarea';
import { AiGeneratedForm } from '@/components/dashboard/ai-generated-form';
import { AiFormField } from '@/lib/company-schemas';


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
    onFormGenerated: (name: string, fields: AiFormField[]) => void;
}

export function AiFormBuilderDialog({ isOpen, onOpenChange, companyName, onFormGenerated }: AiFormBuilderDialogProps) {
    const { toast } = useToast();
    const [step, setStep] = useState(1);
    const [isLoading, setIsLoading] = useState(false);
    const [generatedForm, setGeneratedForm] = useState<GenerateFormOptionsOutput | null>(null);
    const [isPending, startTransition] = useTransition();

    // Form State
    const [recommendedFieldsState, setRecommendedFieldsState] = useState(
        recommendedFields.reduce((acc, field) => ({ ...acc, [field.id]: { included: true, required: true } }), {} as Record<string, { included: boolean, required: boolean }>)
    );
     const [jobSpecificFieldsState, setJobSpecificFieldsState] = useState(
        jobSpecificFields.reduce((acc, field) => ({ ...acc, [field.id]: { included: true, required: true } }), {} as Record<string, { included: boolean, required: boolean }>)
    );
    const [optionalFieldsState, setOptionalFieldsState] = useState(
        optionalFields.reduce((acc, field) => ({ ...acc, [field.id]: { included: false, required: false } }), {} as Record<string, { included: boolean, required: boolean }>)
    );
    const [customInstructions, setCustomInstructions] = useState('');
    const [generationError, setGenerationError] = useState<string | null>(null);
    
    // State for the Edit with AI dialog
    const [isEditDialogVisible, setEditDialogVisible] = useState(false);
    const [editInstructions, setEditInstructions] = useState('');


    useEffect(() => {
        const resetForm = () => {
            setStep(1);
            setIsLoading(false);
            setGeneratedForm(null);
            setGenerationError(null);
            setEditInstructions('');
            setCustomInstructions('');
        };
        
        if (isOpen) {
            resetForm();
        }
    }, [isOpen]);

    const handleOpenChange = (open: boolean) => {
        onOpenChange(open);
    };
    
    const handleNextStep = () => {
       setStep(s => s + 1);
    };

    const handleGenerateForm = async (regenerate = false) => {
        setStep(3); // Go to loading screen
        setIsLoading(true);
        setGenerationError(null);
        if (!regenerate) {
            setGeneratedForm(null);
        }

        try {
            // Map selected fields to a simple array of strings for the prompt
            const selectedFields: string[] = ['Full Legal Name', 'Email Address', 'Phone Number', 'Authorization to Work in the U.S.', 'Background Check Consent'];
            const addSelected = (state: Record<string, { included: boolean }>, sourceFields: { id: string; label: string }[]) => {
                for (const field of sourceFields) {
                    if (state[field.id]?.included) {
                        selectedFields.push(field.label);
                    }
                }
            };
            addSelected(recommendedFieldsState, recommendedFields);
            addSelected(jobSpecificFieldsState, jobSpecificFields);
            addSelected(optionalFieldsState, optionalFields);

            const input: GenerateFormOptionsInput = {
                formPurpose: 'Certified Nursing Assistant (CNA) Application', // Placeholder
                companyName: companyName,
                personalInfo: selectedFields,
                includeReferences: optionalFieldsState['references']?.included,
                includeEducation: true, // Assuming from work history
                includeEmploymentHistory: recommendedFieldsState['workHistory']?.included,
                includeCredentials: true,
                includeLogo: false, // This is a design choice
            };

            const result = await generateFormFromOptions(input);
            setGeneratedForm(result);
            setStep(4);
        } catch (e) {
            console.error("AI Generation Error:", e);
            setGenerationError("The AI failed to generate the form. Please try again or go back to adjust your selections.");
            setStep(3); // Stay on loading/error screen
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleAcceptForm = async () => {
        if (!generatedForm) return;
        
        startTransition(() => {
            onFormGenerated(generatedForm.formName, generatedForm.fields);
            toast({ title: 'Form Saved', description: 'Your new application form has been added to the workflow.' });
            handleOpenChange(false);
        });
    }

    const handleFieldToggle = (fieldId: string, property: 'included' | 'required', value: boolean) => {
        if (!generatedForm) return;

        setGeneratedForm(prev => {
            if (!prev) return null;
            const newFields = prev.fields.map(f => {
                if (f.id === fieldId) {
                    if (property === 'required') {
                        return { ...f, required: value };
                    }
                }
                return f;
            });

             if (property === 'included') {
                 if (value === false) {
                     return { ...prev, fields: newFields.filter(f => f.id !== fieldId) };
                 }
             }
            
            return { ...prev, fields: newFields };
        });
    }


    const renderFieldSelection = (field: {id: string, label: string, tooltip?: string}, state: any, setState: Function) => (
        <div key={field.id} className="flex items-center justify-between p-3 border rounded-md">
            <div className="flex items-center gap-2">
                <Checkbox
                    id={`include-${field.id}`}
                    checked={state[field.id]?.included}
                    onCheckedChange={(checked) => setState({ ...state, [field.id]: { ...state[field.id], included: !!checked } })}
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
                        onCheckedChange={(checked) => setState({ ...state, [field.id]: { ...state[field.id], required: !!checked } })}
                    />
                </div>
            )}
        </div>
    );

    const renderStepContent = () => {
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
                            <h4 className="font-semibold text-foreground">Job-Type Specific Fields (CNA)</h4>
                             <p className="text-xs text-muted-foreground">These fields are commonly required for this position. You may include or remove them.</p>
                            <div className="mt-2 space-y-2">
                                {jobSpecificFields.map(field => renderFieldSelection(field, jobSpecificFieldsState, setJobSpecificFieldsState))}
                            </div>
                        </div>

                         <div>
                            <h4 className="font-semibold text-foreground">Optional Fields</h4>
                            <div className="mt-2 space-y-2">
                                 {optionalFields.map(field => renderFieldSelection(field, optionalFieldsState, setOptionalFieldsState))}
                            </div>
                        </div>
                    </div>
                );
            case 2:
                 return (
                    <div className="space-y-4">
                         <h3 className="font-semibold">Customize Your Application</h3>
                         <p className="text-sm text-muted-foreground">Optional: Tell the AI how you’d like your application to sound or if you want any additional questions included.</p>
                        <Textarea 
                            placeholder="Example: Make the tone friendly, add a question about preferred schedule, remove vaccination questions, translate labels to Spanish, etc." 
                            rows={10} 
                            value={customInstructions}
                            onChange={(e) => setCustomInstructions(e.target.value)}
                        />
                    </div>
                 );
            case 3: // Loading / Error screen
                return (
                     <div className="flex flex-col items-center justify-center space-y-4 p-8 min-h-[400px]">
                        {generationError ? (
                             <Alert variant="destructive">
                                <AlertTitle>Something went wrong</AlertTitle>
                                <AlertDescription>{generationError}</AlertDescription>
                            </Alert>
                        ) : (
                            <>
                                <Loader2 className="h-12 w-12 animate-spin text-primary" />
                                <h3 className="font-semibold">Building your custom job application…</h3>
                                <p className="text-muted-foreground text-sm text-center">We’re adding your selected fields, applying your custom instructions, and formatting everything for applicants.</p>
                            </>
                        )}
                    </div>
                );
            case 4: // Preview screen
                if (!generatedForm) return null;
                return (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        {/* Left Side - Preview */}
                        <div className="h-[65vh] overflow-y-auto border rounded-lg p-4 bg-muted/30">
                           <h3 className="font-semibold text-lg mb-2">Application Preview</h3>
                           <div className="pointer-events-none scale-95 origin-top-left">
                                <AiGeneratedForm 
                                    formName={generatedForm.formName}
                                    fields={generatedForm.fields}
                                    companyName={companyName || 'Your Company'}
                                />
                           </div>
                        </div>

                        {/* Right Side - Controls */}
                        <div className="space-y-4 h-[65vh] overflow-y-auto pr-2">
                             <h3 className="font-semibold text-lg">Included Fields</h3>
                             <p className="text-sm text-muted-foreground">You may turn fields on or off or change whether they are required. These changes update instantly.</p>
                            <div className="space-y-2">
                                {generatedForm.fields.map(field => (
                                     <div key={field.id} className="flex items-center justify-between p-3 border rounded-md">
                                        <Label htmlFor={`field-toggle-${field.id}`} className="font-medium">{field.label}</Label>
                                        <div className="flex items-center space-x-2">
                                            <Label htmlFor={`required-toggle-${field.id}`}>Required</Label>
                                            <Switch
                                                id={`required-toggle-${field.id}`}
                                                checked={field.required}
                                                onCheckedChange={(checked) => handleFieldToggle(field.id, 'required', checked)}
                                            />
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                );
            default:
                return <div>Step {step}</div>;
        }
    };
    
    const renderFooter = () => {
         if (step === 3 && generationError) { // Error state on loading screen
             return (
                 <div className="flex justify-between w-full">
                    <Button variant="outline" onClick={() => setStep(s => s - 1)}>
                        <ArrowLeft className="mr-2 h-4 w-4" /> Back
                    </Button>
                     <Button onClick={() => handleGenerateForm(true)}>
                         <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                    </Button>
                </div>
             );
         }
         
         if (step === 4) { // Preview screen
             return (
                 <div className="w-full">
                    <p className="text-xs text-muted-foreground mb-4 text-center">Review the generated form. You can accept it, ask the AI to make changes, or start over.</p>
                    <div className="flex justify-between w-full flex-wrap gap-2">
                        <Button variant="ghost" onClick={() => handleOpenChange(false)} disabled={isPending}>
                            <XCircle className="mr-2 h-4 w-4" /> Discard and Return
                        </Button>
                        <div className="flex gap-2">
                             <Button variant="outline" onClick={() => handleGenerateForm(true)} disabled={isPending}>
                                <RefreshCw className="mr-2 h-4 w-4" /> Try Again
                            </Button>
                             <Dialog open={isEditDialogVisible} onOpenChange={setEditDialogVisible}>
                                <DialogTrigger asChild>
                                     <Button variant="secondary" disabled={isPending}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit With AI
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader>
                                        <DialogTitle>Edit With AI</DialogTitle>
                                        <DialogDescription>What would you like to change?</DialogDescription>
                                    </DialogHeader>
                                    <Textarea
                                        placeholder="e.g., Make the tone more formal, add a question about teamwork..."
                                        value={editInstructions}
                                        onChange={(e) => setEditInstructions(e.target.value)}
                                        rows={4}
                                    />
                                    <DialogFooter>
                                        <Button variant="ghost" onClick={() => setEditDialogVisible(false)}>Cancel</Button>
                                        <Button>
                                            Apply Changes <Send className="ml-2 h-3 w-3" />
                                        </Button>
                                    </DialogFooter>
                                </DialogContent>
                            </Dialog>
                             <Button onClick={handleAcceptForm} disabled={isPending}>
                                 {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                                Use This Form
                            </Button>
                        </div>
                    </div>
                 </div>
             )
         }

        // Default navigation for steps 1 & 2
        return (
             <div className="flex justify-between w-full">
                <Button variant="outline" onClick={() => setStep(s => s - 1)} disabled={step === 1 || isLoading}>
                    <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </Button>
                
                {step === 1 ? (
                    <Button onClick={handleNextStep} disabled={isLoading}>
                        Next <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                ) : step === 2 ? (
                    <Button onClick={() => handleGenerateForm(false)} disabled={isLoading}>
                        <Bot className="mr-2 h-4 w-4" />
                        Generate My Application Form
                    </Button>
                ) : null}
            </div>
        )
    }

    return (
        <Dialog open={isOpen} onOpenChange={handleOpenChange}>
            <DialogContent className="sm:max-w-4xl md:max-w-6xl">
                <DialogHeader>
                    <DialogTitle className="font-headline text-xl">AI Application Form Wizard</DialogTitle>
                    {step < 3 && <DialogDescription>Step {step} of 2 - {step === 1 ? 'Select the application fields.' : 'Add any custom instructions (Optional).'}</DialogDescription>}
                    {step === 3 && isLoading && <DialogDescription>Building your form...</DialogDescription>}
                    {step === 4 && <DialogDescription>Step 3 of 3 - Review your application.</DialogDescription>}
                </DialogHeader>
                
                <div className="py-4">
                    {renderStepContent()}
                </div>

                <DialogFooter>
                    {renderFooter()}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
