
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building, Save, PlusCircle, Trash2, Loader2, Workflow, Edit, Upload, Wand2, Library } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { getCompanies, createOrUpdateCompany, deleteCompany, deleteAllCompanies } from "@/app/actions/company-actions";
import { type Company, type OnboardingProcess, type RequiredDoc } from "@/lib/company-schemas";
import Link from "next/link";
import { Separator } from "@/components/ui/separator";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { generateId } from "@/lib/local-storage-client";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Table, TableBody, TableCell, TableHeader, TableHead, TableRow } from "@/components/ui/table";
import { uploadKvFile, getFile, deleteFile } from "@/app/actions/kv-actions";
import { Textarea } from "@/components/ui/textarea";


const STANDARD_DOCS: RequiredDoc[] = [
    { id: 'i9', label: 'Form I-9', type: 'upload' },
    { id: 'w4', label: 'Form W-4', type: 'upload' },
    { id: 'proofOfIdentity', label: 'Proof of Identity (Govt. ID)', type: 'upload' },
    { id: 'educationalDiplomas', label: 'Educational Diplomas/Certificates', type: 'upload' },
    { id: 'proofOfAddress', label: 'Proof of Address', type: 'upload' },
];

function OnboardingProcessManager({ company, onSave, isPending }: { company: Partial<Company>, onSave: (companyData: Partial<Company>) => void, isPending: boolean }) {
    const [processes, setProcesses] = useState<OnboardingProcess[]>(company.onboardingProcesses || []);
    
    useEffect(() => {
        setProcesses(company.onboardingProcesses || []);
    }, [company.onboardingProcesses]);

    const handleSave = () => {
        onSave({ ...company, onboardingProcesses: processes });
    };

    const handleAddNewProcess = () => {
        const newProcess: OnboardingProcess = {
            id: generateId(),
            name: `New Onboarding Process #${processes.length + 1}`,
            applicationForm: { id: generateId(), name: 'Default Application', type: 'template' },
            interviewScreen: { type: 'template' },
            requiredDocs: [],
        };
        setProcesses(prev => [...prev, newProcess]);
    };

     const handleDeleteProcess = (processId: string) => {
        if (window.confirm('Are you sure you want to delete this onboarding process? This change is temporary until you save.')) {
            setProcesses(prev => prev.filter(p => p.id !== processId));
        }
    };
    
    const handleUpdateProcessField = <K extends keyof OnboardingProcess>(processId: string, field: K, value: OnboardingProcess[K]) => {
        setProcesses(prev => prev.map(p => p.id === processId ? { ...p, [field]: value } : p));
    };

    const handleUpdateNestedProcessField = (processId: string, topField: 'applicationForm' | 'interviewScreen', nestedField: string, value: any) => {
        setProcesses(prev => prev.map(p => {
            if (p.id === processId) {
                const topFieldValue = p[topField] || {};
                const newTopFieldValue = { ...topFieldValue, [nestedField]: value };
                return { ...p, [topField]: newTopFieldValue };
            }
            return p;
        }));
    };
    
    const handlePhase1ImageUpload = async (processId: string, files: FileList | null) => {
        if (!files) return;
        const imageKeys: string[] = [];
        for (const file of Array.from(files)) {
            const key = `process-${processId}-form-image-${Date.now()}`;
            const uploadedKey = await uploadKvFile(file, key);
            imageKeys.push(uploadedKey);
        }

        const existingImages = processes.find(p => p.id === processId)?.applicationForm?.images || [];
        handleUpdateNestedProcessField(processId, 'applicationForm', 'images', [...existingImages, ...imageKeys]);
    };
    
     const handleInterviewImageUpload = async (processId: string, file: File | null) => {
        if (!file) return;
        const key = `process-${processId}-interview-bg-${Date.now()}`;
        const uploadedKey = await uploadKvFile(file, key);
        handleUpdateNestedProcessField(processId, 'interviewScreen', 'imageUrl', uploadedKey);
    };

    const handleAddRequiredDoc = (processId: string, doc: RequiredDoc) => {
        setProcesses(prev => prev.map(p => {
            if (p.id === processId) {
                const existingDocs = p.requiredDocs || [];
                if (existingDocs.some(d => d.id === doc.id)) return p;
                return { ...p, requiredDocs: [...existingDocs, doc] };
            }
            return p;
        }));
    };

    const handleAddCustomDoc = (processId: string, docLabel: string) => {
        if (!docLabel) return;
        const docId = docLabel.toLowerCase().replace(/\s/g, '-') + `-${generateId()}`;
        const newDoc: RequiredDoc = { id: docId, label: docLabel, type: 'upload' };
        handleAddRequiredDoc(processId, newDoc);
    };

    const handleRemoveRequiredDoc = (processId: string, docId: string) => {
        setProcesses(prev => prev.map(p => {
            if (p.id === processId) {
                return { ...p, requiredDocs: p.requiredDocs?.filter(d => d.id !== docId) };
            }
            return p;
        }));
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5" /> Onboarding Processes</CardTitle>
                <CardDescription>Define reusable onboarding flows for different roles or departments. This is your Form Library.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <Accordion type="multiple" className="w-full space-y-4">
                    {processes.map((process) => (
                        <AccordionItem key={process.id} value={process.id} className="border rounded-md p-4 bg-muted/20">
                            <AccordionTrigger className="w-full hover:no-underline -mb-2">
                                <div className="flex items-center justify-between w-full">
                                <Input 
                                    className="text-lg font-semibold border-none shadow-none -ml-3 p-2 focus-visible:ring-1 focus-visible:ring-ring bg-transparent"
                                    value={process.name}
                                    onClick={(e) => e.stopPropagation()}
                                    onChange={(e) => handleUpdateProcessField(process.id, 'name', e.target.value)}
                                />
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="pt-4 space-y-6">
                                {/* Phase 1, 2, 3 configurations go here */}
                                 {/* Phase 1 Configuration */}
                                <div className="p-4 border rounded-md bg-background/50 space-y-4">
                                    <h3 className="font-semibold">Phase 1: Application Form</h3>
                                    <RadioGroup 
                                        value={process.applicationForm?.type || 'template'} 
                                        onValueChange={(value) => handleUpdateNestedProcessField(process.id, 'applicationForm', 'type', value)}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="template" id={`template-${process.id}`} />
                                            <Label htmlFor={`template-${process.id}`}>Use Template Application Form</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="custom" id={`custom-${process.id}`} />
                                            <Label htmlFor={`custom-${process.id}`}>Use Custom Application Form Images</Label>
                                        </div>
                                    </RadioGroup>
                                    
                                    {process.applicationForm?.type === 'custom' && (
                                        <div className="pl-6 pt-2 space-y-2">
                                            <Label htmlFor={`phase1-upload-${process.id}`}>Upload Form Images (e.g., screenshots of a PDF)</Label>
                                            <Input 
                                                id={`phase1-upload-${process.id}`}
                                                type="file"
                                                multiple
                                                accept="image/*"
                                                onChange={(e) => handlePhase1ImageUpload(process.id, e.target.files)}
                                            />
                                            {/* Preview uploaded images */}
                                        </div>
                                    )}
                                </div>

                                {/* Phase 2 Configuration */}
                                <div className="p-4 border rounded-md bg-background/50 space-y-4">
                                    <h3 className="font-semibold">Phase 2: Interview Screen</h3>
                                     <RadioGroup 
                                        value={process.interviewScreen?.type || 'template'} 
                                        onValueChange={(value) => handleUpdateNestedProcessField(process.id, 'interviewScreen', 'type', value)}
                                        className="space-y-2"
                                    >
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="template" id={`interview-template-${process.id}`} />
                                            <Label htmlFor={`interview-template-${process.id}`}>Use Template Interview Screen</Label>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <RadioGroupItem value="custom" id={`interview-custom-${process.id}`} />
                                            <Label htmlFor={`interview-custom-${process.id}`}>Use Custom Background Image</Label>
                                        </div>
                                    </RadioGroup>

                                    {process.interviewScreen?.type === 'custom' && (
                                        <div className="pl-6 pt-2 space-y-2">
                                            <Label htmlFor={`phase2-upload-${process.id}`}>Upload Background Image</Label>
                                            <Input 
                                                id={`phase2-upload-${process.id}`}
                                                type="file"
                                                accept="image/*"
                                                onChange={(e) => handleInterviewImageUpload(process.id, e.target.files?.[0] || null)}
                                            />
                                            {/* Preview uploaded image */}
                                        </div>
                                    )}
                                </div>

                                {/* Phase 3 Configuration */}
                                <div className="p-4 border rounded-md bg-background/50 space-y-4">
                                    <h3 className="font-semibold">Phase 3: Required Documentation</h3>
                                    <div className="space-y-4">
                                        <Label>Select documents required for this process</Label>
                                        <div className="space-y-2">
                                        {(process.requiredDocs || []).map(doc => (
                                            <div key={doc.id} className="flex items-center justify-between text-sm p-2 bg-muted/50 rounded-md">
                                                <span>{doc.label}</span>
                                                <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleRemoveRequiredDoc(process.id, doc.id)}>
                                                    <Trash2 className="h-4 w-4 text-destructive" />
                                                </Button>
                                            </div>
                                        ))}
                                        {process.requiredDocs?.length === 0 && <p className="text-xs text-muted-foreground">No documents added yet.</p>}
                                        </div>
                                        
                                        <Popover>
                                            <PopoverTrigger asChild>
                                                <Button type="button" variant="outline" size="sm"><PlusCircle className="mr-2 h-4 w-4" /> Add Document</Button>
                                            </PopoverTrigger>
                                            <PopoverContent className="w-80">
                                                <div className="grid gap-4">
                                                    <h4 className="font-medium leading-none">Add Documents</h4>
                                                    <p className="text-sm text-muted-foreground">Select standard documents or add a custom one.</p>
                                                    <div className="space-y-2">
                                                        {STANDARD_DOCS.map(doc => (
                                                            <div key={doc.id} className="flex items-center justify-between">
                                                                <Label htmlFor={`doc-${process.id}-${doc.id}`} className="font-normal flex items-center gap-2">
                                                                    <Checkbox 
                                                                        id={`doc-${process.id}-${doc.id}`}
                                                                        checked={(process.requiredDocs || []).some(d => d.id === doc.id)}
                                                                        onCheckedChange={(checked) => {
                                                                            if (checked) {
                                                                                handleAddRequiredDoc(process.id, doc)
                                                                            } else {
                                                                                handleRemoveRequiredDoc(process.id, doc.id)
                                                                            }
                                                                        }}
                                                                    />
                                                                    {doc.label}
                                                                </Label>
                                                            </div>
                                                        ))}
                                                    </div>
                                                    <Separator />
                                                    <form onSubmit={(e) => {
                                                        e.preventDefault();
                                                        const input = e.currentTarget.elements.namedItem('custom-doc-label') as HTMLInputElement;
                                                        handleAddCustomDoc(process.id, input.value);
                                                        input.value = '';
                                                    }} className="flex gap-2">
                                                        <Input name="custom-doc-label" placeholder="Custom document name..." className="h-8" />
                                                        <Button type="submit" size="sm" className="h-8">Add</Button>
                                                    </form>
                                                </div>
                                            </PopoverContent>
                                        </Popover>
                                    </div>
                                </div>


                                <div className="flex justify-end gap-2 pt-4">
                                    <Button type="button" variant="destructive" size="sm" onClick={() => handleDeleteProcess(process.id)}><Trash2 className="mr-2 h-4 w-4" /> Delete Process</Button>
                                </div>
                            </AccordionContent>
                        </AccordionItem>
                    ))}
                </Accordion>
                <Button type="button" variant="outline" onClick={handleAddNewProcess}>
                    <PlusCircle className="mr-2 h-4 w-4" /> Add Onboarding Process
                </Button>
            </CardContent>
            <CardContent>
                <Button size="lg" disabled={isPending} onClick={handleSave}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save All Processes
                </Button>
            </CardContent>
        </Card>
    );
}


function CompanyDetailsForm({ company, onSave, isPending, onSwitchToProcesses }: { company: Partial<Company>, onSave: (companyData: Partial<Company>, logoFile?: File) => void, isPending: boolean, onSwitchToProcesses: () => void }) {
    const [companyForEdit, setCompanyForEdit] = useState<Partial<Company>>(company);
    const [logoFile, setLogoFile] = useState<File | undefined>();
    const [logoPreview, setLogoPreview] = useState<string | null>(null);

    useEffect(() => {
        const fetchAndSetLogo = async (logoKey: string) => {
            const url = await getFile(logoKey);
            setLogoPreview(url);
        };
        setCompanyForEdit(company);
        if (company.logo) {
            fetchAndSetLogo(company.logo);
        } else {
            setLogoPreview(null);
        }
    }, [company]);

    const handleSave = () => {
        onSave(companyForEdit, logoFile);
    };
    
     const handleLogoChange = (file: File | null) => {
        if (file) {
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    return (
         <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Building className="h-5 w-5" />
                    {companyForEdit.id ? 'Edit Company Details' : 'New Company Details'}
                </CardTitle>
                <CardDescription>Manage the main profile for this company.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                 <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" placeholder="e.g., Noble Health" value={companyForEdit.name || ''} onChange={(e) => setCompanyForEdit(prev => ({...prev, name: e.target.value}))} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-email">Company Contact Email</Label>
                    <Input id="company-email" type="email" placeholder="contact@noblehealth.com" value={companyForEdit.email || ''} onChange={(e) => setCompanyForEdit(prev => ({...prev, email: e.target.value}))} />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label htmlFor="company-phone">Phone Number</Label>
                        <Input id="company-phone" placeholder="(555) 123-4567" value={companyForEdit.phone || ''} onChange={(e) => setCompanyForEdit(prev => ({...prev, phone: e.target.value}))} />
                    </div>
                     <div className="space-y-2">
                        <Label htmlFor="company-fax">Fax Number</Label>
                        <Input id="company-fax" placeholder="(555) 123-4568" value={companyForEdit.fax || ''} onChange={(e) => setCompanyForEdit(prev => ({...prev, fax: e.target.value}))} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-address">Company Address</Label>
                    <Input id="company-address" placeholder="123 Health St, Wellness City, 90210" value={companyForEdit.address || ''} onChange={(e) => setCompanyForEdit(prev => ({...prev, address: e.target.value}))} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                        <Input id="company-logo" type="file" className="max-w-xs" onChange={(e) => handleLogoChange(e.target.files?.[0] || null)} accept="image/*" />
                        {logoPreview && <Image src={logoPreview} alt="Logo Preview" width={40} height={40} className="rounded-sm object-contain" />}
                    </div>
                </div>
            </CardContent>
            <CardContent className="flex flex-col sm:flex-row gap-2">
                <Button size="lg" disabled={isPending} onClick={handleSave}>
                    {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                    Save Company
                </Button>
                 {company.id && (
                     <Button size="lg" variant="outline" onClick={onSwitchToProcesses}>
                        <Workflow className="mr-2 h-4 w-4" />
                        Manage Onboarding Processes
                    </Button>
                )}
            </CardContent>
        </Card>
    )
}

function AiFormBuilder() {
    return (
        <Card className="opacity-50 pointer-events-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> AI-Powered Form Builder</CardTitle>
                <CardDescription>Describe the form you need, and let AI generate the fields for you. (Feature coming soon)</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="space-y-2">
                    <Label htmlFor="ai-prompt">Form Description</Label>
                    <Textarea id="ai-prompt" placeholder="e.g., 'Create a form for a delivery driver application. I need fields for name, contact info, vehicle type, and years of experience.'" disabled />
                </div>
                <Button disabled>
                    <Wand2 className="mr-2 h-4 w-4" />
                    Generate Form
                </Button>
            </CardContent>
        </Card>
    );
}

function FormLibrary() {
    return (
        <Card className="opacity-50 pointer-events-none">
            <CardHeader>
                <CardTitle className="flex items-center gap-2"><Library className="h-5 w-5" /> Your Form Library</CardTitle>
                <CardDescription>Manage and reuse your saved application forms and onboarding processes. (Feature coming soon)</CardDescription>
            </CardHeader>
            <CardContent>
                 <div className="border rounded-md p-4 text-center text-muted-foreground">
                    Your saved forms will appear here.
                 </div>
            </CardContent>
        </Card>
    );
}


export default function SettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);

  const [allCompanies, setAllCompanies] = useState<Company[]>([]);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);
  const [view, setView] = useState<'list' | 'editCompany' | 'editProcesses'>('list');

  const loadAllCompanies = async () => {
    setIsLoading(true);
    try {
        const data = await getCompanies();
        setAllCompanies(data);
        if (data.length === 0) {
            setView('editCompany');
            setEditingCompany({});
        } else {
            setView('list');
            setEditingCompany(null);
        }
    } catch (error) {
        toast({ variant: 'destructive', title: "Failed to load companies", description: (error as Error).message });
    } finally {
        setIsLoading(false);
    }
  }

  useEffect(() => {
    loadAllCompanies();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  
  const handleSaveCompany = (companyData: Partial<Company>, logoFile?: File) => {
      startTransition(async () => {
          if (!companyData.name) {
              toast({ variant: 'destructive', title: "Validation Error", description: "Company name is required."});
              return;
          }
          
          try {
              let dataToSave = { ...companyData };
              
              if (logoFile) {
                  const logoKey = `logo-${companyData.name?.replace(/\s+/g, '-')}-${Date.now()}`;
                  // If there was an old logo, delete it
                  if (dataToSave.id && dataToSave.logo) {
                    await deleteFile(dataToSave.logo);
                  }
                  const uploadedKey = await uploadKvFile(logoFile, logoKey);
                  dataToSave.logo = uploadedKey;
              }

              const result = await createOrUpdateCompany(dataToSave);
              if (!result.success || !result.company) throw new Error(result.error || "Failed to save company settings.");
              
              toast({ title: "Company Settings Saved", description: `Settings for ${result.company.name} have been saved.` });
              
              const updatedCompanies = await getCompanies();
              setAllCompanies(updatedCompanies);
              setEditingCompany(result.company);
              setView('editProcesses'); // Go to process management after saving details
              
          } catch (error) {
               toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
          }
      });
  }

  const handleDeleteCurrentCompany = (id: string) => {
     startTransition(async () => {
        try {
            const companyToDelete = allCompanies.find(c => c.id === id);
            if (companyToDelete?.onboardingProcesses) {
                for (const process of companyToDelete.onboardingProcesses) {
                    if (process.applicationForm?.images) {
                        for (const key of process.applicationForm.images) { await deleteFile(key); }
                    }
                     if (process.interviewScreen?.imageUrl) { await deleteFile(process.interviewScreen.imageUrl); }
                }
            }
             if (companyToDelete?.logo) { await deleteFile(companyToDelete.logo); }

            await deleteCompany(id);
            toast({ title: "Company Deleted", description: "The company has been removed."});
            await loadAllCompanies();
        } catch (error) {
             toast({ variant: "destructive", title: "Deletion Failed", description: (error as Error).message });
        }
     });
  }
  
  const handleAddNewCompany = () => {
    setEditingCompany({});
    setView('editCompany');
  }

  const handleEditCompany = (id: string) => {
    const company = allCompanies.find(c => c.id === id);
    if (company) {
        setEditingCompany(company);
        setView('editCompany');
    }
  }

  const handleBackToList = () => {
      setView('list');
      setEditingCompany(null);
  }
  
  const renderContent = () => {
    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center p-10">
                <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
            </div>
        );
    }
    
    if (view === 'editCompany') {
        return <CompanyDetailsForm 
                    company={editingCompany || {}}
                    onSave={handleSaveCompany} 
                    isPending={isPending}
                    onSwitchToProcesses={() => setView('editProcesses')}
                />
    }

    if (view === 'editProcesses' && editingCompany) {
         return (
            <div className="space-y-6">
                <OnboardingProcessManager
                    company={editingCompany}
                    onSave={handleSaveCompany}
                    isPending={isPending}
                />
                <Separator />
                <AiFormBuilder />
                <FormLibrary />
            </div>
         );
    }

    return (
        <Card>
            <CardHeader className="flex flex-row items-center justify-between">
                <div>
                    <CardTitle>Company List</CardTitle>
                    <CardDescription>Add, edit, or remove companies from your system.</CardDescription>
                </div>
                <Button onClick={handleAddNewCompany}><PlusCircle className="mr-2 h-4 w-4" /> Add New Company</Button>
            </CardHeader>
            <CardContent>
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Company Name</TableHead>
                            <TableHead>Onboarding Processes</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {allCompanies.length > 0 ? allCompanies.map(company => (
                            <TableRow key={company.id}>
                                <TableCell className="font-medium">{company.name}</TableCell>
                                <TableCell>{company.onboardingProcesses?.length || 0}</TableCell>
                                <TableCell className="text-right space-x-2">
                                     <Button variant="outline" size="sm" onClick={() => handleEditCompany(company.id!)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                            <Button variant="destructive" size="sm">
                                                <Trash2 className="mr-2 h-4 w-4" /> Delete
                                            </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader>
                                                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                <AlertDialogDescription>
                                                    This will permanently delete '{company.name}' and all its data.
                                                </AlertDialogDescription>
                                            </AlertDialogHeader>
                                            <AlertDialogFooter>
                                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                <AlertDialogAction onClick={() => handleDeleteCurrentCompany(company.id!)}>Confirm & Delete</AlertDialogAction>
                                            </AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </TableCell>
                            </TableRow>
                        )) : (
                            <TableRow>
                                <TableCell colSpan={3} className="text-center h-24">
                                    No companies found. Click "Add New Company" to start.
                                </TableCell>
                            </TableRow>
                        )}
                    </TableBody>
                </Table>
            </CardContent>
        </Card>
    );
  }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
                <Settings className="h-8 w-8 text-foreground" />
                <div>
                    <h1 className="text-3xl font-headline font-bold text-foreground">System Settings</h1>
                    <p className="text-muted-foreground">
                       Manage companies and their onboarding processes.
                    </p>
                </div>
            </div>
             {view !== 'list' && (
                <Button variant="outline" onClick={handleBackToList}>
                    &larr; Back to Company List
                </Button>
            )}
        </div>

      {renderContent()}
    </div>
  );
}
