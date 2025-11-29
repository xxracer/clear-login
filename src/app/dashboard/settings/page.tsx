
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building, Save, PlusCircle, Trash2, Loader2, Workflow, Edit, Upload, Wand2, Library, Eye, Info, ArrowRight, Link as LinkIcon, File as FileIcon, UserPlus, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import { getCompanies, createOrUpdateCompany, addOnboardingProcess, deleteOnboardingProcess, uploadCompanyLogo, deleteCompanyLogo } from "@/app/actions/company-actions";
import { type Company, type OnboardingProcess, requiredDocSchema, type RequiredDoc, type ApplicationForm as AppFormType, AiFormField } from "@/lib/company-schemas";
import { generateIdForServer } from "@/lib/server-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AiFormBuilderDialog } from "@/components/dashboard/settings/ai-form-builder-dialog";
import { generateForm } from "@/ai/flows/generate-form-flow";
import { cn } from "@/lib/utils";
import { createAdminUser } from "@/app/actions/auth-actions";


function CreateAdminForm() {
    const { toast } = useToast();
    const [companyName, setCompanyName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [isCreating, setIsCreating] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!companyName || !email || !password) {
            toast({ variant: "destructive", title: "Missing fields", description: "Please fill all required fields." });
            return;
        }
        setIsCreating(true);
        const result = await createAdminUser(email, password, companyName);
        setIsCreating(false);

        if (result.success) {
            toast({ title: "Admin Created", description: `User ${email} for ${companyName} created.` });
            setCompanyName('');
            setEmail('');
            setPassword('');
        } else {
            toast({ variant: "destructive", title: "Creation Failed", description: result.error });
        }
    };
    
    return (
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="companyName">Company Name / ID</Label>
                <Input id="companyName" value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Enter new or existing company name" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="adminEmail">Admin Email</Label>
                <Input id="adminEmail" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@newclient.com" required />
            </div>
            <div className="space-y-2">
                <Label htmlFor="initialPassword">Initial Password</Label>
                <Input id="initialPassword" type="password" value={password} onChange={e => setPassword(e.target.value)} required />
            </div>
            <Button type="submit" disabled={isCreating} className="w-full">
                {isCreating ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
                Create Company Admin
            </Button>
        </form>
    );
}


// Main component for the settings page
export default function SettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true); // Used for initial data load
  const [company, setCompany] = useState<Partial<Company> | null>(null);
  
  const [companyDetails, setCompanyDetails] = useState<Partial<Company>>({
    name: '',
    address: '',
    phone: '',
    fax: '',
    email: '',
    logo: null,
    onboardingProcesses: []
  });
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  const [isCompanySetupComplete, setIsCompanySetupComplete] = useState(false);
  const [showSavedDialog, setShowSavedDialog] = useState(false);

  const [isAiBuilderOpen, setIsAiBuilderOpen] = useState(false);
  
  useEffect(() => {
    async function loadCompanyData() {
        setIsLoading(true);
        try {
            const companies = await getCompanies();
            if (companies && companies.length > 0) {
                const mainCompany = companies[0];
                setCompany(mainCompany);
                setCompanyDetails(mainCompany);
                setLogoPreview(mainCompany.logo || null);
                setIsCompanySetupComplete(!!mainCompany.name);
            }
        } catch (error) {
            toast({ variant: "destructive", title: "Error", description: "Could not load company data." });
        } finally {
            setIsLoading(false);
        }
    }
    loadCompanyData();
  }, [toast]);


  const handleFieldChange = (field: keyof Company, value: any) => {
    setCompanyDetails(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  }
  
  const handleSaveCompany = () => {
    startTransition(async () => {
      if (!companyDetails.name) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Company name is required." });
        return;
      }
      
      let dataToSave = { ...companyDetails };
      
      if (logoFile) {
        if(dataToSave.logo) {
            await deleteCompanyLogo(dataToSave.logo);
        }
        const newLogoUrl = await uploadCompanyLogo(logoFile);
        dataToSave.logo = newLogoUrl;
      }

      const result = await createOrUpdateCompany(dataToSave);
      if (result.success && result.company) {
          setCompany(result.company);
          setCompanyDetails(result.company);
          setLogoFile(undefined);
          setLogoPreview(result.company.logo || null);
          setIsCompanySetupComplete(true);
          setShowSavedDialog(true);
          // Manually trigger a refresh of other components if needed
          window.dispatchEvent(new Event('company-updated'));
      } else {
        toast({ variant: "destructive", title: "Save Failed", description: result.error || "Failed to save." });
      }
    });
  };

  const handleAddNewProcess = async (name: string, fields: AiFormField[]) => {
      if (!company?.id) return;
      const newProcess: OnboardingProcess = {
          id: generateIdForServer(),
          name: name,
          applicationForm: { id: generateIdForServer(), name: name, type: 'custom', images: [], fields: fields },
          interviewScreen: { type: 'template' },
          requiredDocs: [],
      };
      
      startTransition(async () => {
          const result = await addOnboardingProcess(company.id!, newProcess);
          if (result.success && result.company) {
              setCompany(result.company);
              toast({ title: "Process Added", description: `"${name}" has been saved.` });
          } else {
              toast({ variant: 'destructive', title: 'Save Failed', description: result.error });
          }
      });
  };

  const handleDeleteProcess = (processId: string) => {
      if (!company?.id) return;
      startTransition(async () => {
          const result = await deleteOnboardingProcess(company.id!, processId);
          if (result.success && result.company) {
              setCompany(result.company);
              toast({ title: "Process Deleted", description: `The onboarding process has been removed.` });
          } else {
              toast({ variant: 'destructive', title: 'Deletion Failed', description: result.error });
          }
      });
  };
    
    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-foreground" />
            <div>
                <h1 className="text-3xl font-headline font-bold text-foreground"> Company Settings</h1>
                <p className="text-muted-foreground">Manage company profile and onboarding processes.</p>
            </div>
            </div>
            {isCompanySetupComplete && (
                <div className="flex items-center gap-2">
                    <div className="text-sm font-semibold bg-green-100 text-green-800 px-3 py-1 rounded-full dark:bg-green-900/30 dark:text-green-300">
                        ✓ Company Setup Complete
                    </div>
                </div>
            )}
        </div>
      
        {!isCompanySetupComplete && (
             <Alert className="border-primary">
                <AlertTitle className="font-bold flex items-center gap-2">Finish Your Company Setup</AlertTitle>
                <AlertDescription>
                   Before building workflows, please complete your company profile below.
                </AlertDescription>
            </Alert>
        )}
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        <CardTitle className="text-xl">Company Profile</CardTitle>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="company-name">Company Name</Label>
                        <Input id="company-name" placeholder="e.g., Acme Home Care" value={companyDetails.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-address">Address</Label>
                        <Input id="company-address" placeholder="123 Main St, Anytown, USA" value={companyDetails.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="company-phone">Phone Number</Label>
                            <Input id="company-phone" placeholder="(555) 123-4567" value={companyDetails.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="company-fax">Fax</Label>
                            <Input id="company-fax" placeholder="(555) 123-4568" value={companyDetails.fax || ''} onChange={(e) => handleFieldChange('fax', e.target.value)} />
                        </div>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-email">Company Email</Label>
                        <Input id="company-email" type="email" placeholder="contact@acme.com" value={companyDetails.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="company-logo">Company Logo</Label>
                        <div className="flex items-center gap-4">
                            <Input id="company-logo" type="file" className="max-w-xs" onChange={handleLogoFileChange} accept="image/*" />
                            {logoPreview && <Image src={logoPreview} alt="Logo Preview" width={40} height={40} className="rounded-sm object-contain" />}
                        </div>
                    </div>
                    <div className="mt-6 flex justify-end">
                        <Button size="lg" disabled={isPending} onClick={handleSaveCompany}>
                        {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        {isCompanySetupComplete ? 'Update Company Details' : 'Save Company & Continue'}
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
        <div>
            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <Shield className="h-5 w-5" />
                        <CardTitle className="text-xl">Superuser: User Management</CardTitle>
                    </div>
                    <CardDescription>Create new admin users for companies.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateAdminForm />
                </CardContent>
            </Card>
        </div>
      </div>


    <div className={cn(!isCompanySetupComplete && "opacity-50 pointer-events-none")}>
        <Card>
            <CardHeader>
                <div className="flex items-center gap-2">
                    <Workflow className="h-5 w-5" />
                    <CardTitle className="text-xl">Onboarding Workflows</CardTitle>
                </div>
                <CardDescription>
                    Build and manage repeatable onboarding processes for different positions.
                </CardDescription>
            </CardHeader>
            <CardContent>
                {(!company?.onboardingProcesses || company.onboardingProcesses.length === 0) ? (
                    <div className="text-center p-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">You don’t have any onboarding workflows yet.</p>
                        <Dialog>
                            <DialogTrigger asChild>
                                 <Button>
                                    <PlusCircle className="mr-2 h-4 w-4"/>
                                    Create New Workflow
                                </Button>
                            </DialogTrigger>
                            <DialogContent>
                                <DialogHeader><DialogTitle>Coming Soon!</DialogTitle></DialogHeader>
                                <p>The workflow builder is coming soon.</p>
                            </DialogContent>
                        </Dialog>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex justify-end">
                            <Dialog>
                                <DialogTrigger asChild>
                                    <Button>
                                        <PlusCircle className="mr-2 h-4 w-4"/>
                                        Create New Workflow
                                    </Button>
                                </DialogTrigger>
                                <DialogContent>
                                    <DialogHeader><DialogTitle>Coming Soon!</DialogTitle></DialogHeader>
                                    <p>The workflow builder is coming soon.</p>
                                </DialogContent>
                            </Dialog>
                        </div>
                        <div className="border rounded-lg">
                            {company.onboardingProcesses.map(process => (
                                <div key={process.id} className="flex items-center justify-between p-3 border-b last:border-b-0 hover:bg-muted/50 transition-colors">
                                    <div>
                                        <p className="font-semibold">{process.name}</p>
                                        <p className="text-xs text-muted-foreground">
                                            Last Updated: {new Date().toLocaleDateString()} | 
                                            Status: <span className="text-green-600">Active</span>
                                        </p>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <Dialog>
                                            <DialogTrigger asChild>
                                                <Button variant="outline" size="sm"><Edit className="mr-2 h-4 w-4"/>Edit</Button>
                                            </DialogTrigger>
                                            <DialogContent>
                                                <DialogHeader><DialogTitle>Coming Soon!</DialogTitle></DialogHeader>
                                                <p>Editing workflows is coming soon.</p>
                                            </DialogContent>
                                        </Dialog>
                                         <AlertDialog>
                                            <AlertDialogTrigger asChild>
                                                <Button variant="destructive" size="sm" disabled={isPending}>
                                                    <Trash2 className="mr-2 h-4 w-4" />
                                                    Delete
                                                </Button>
                                            </AlertDialogTrigger>
                                            <AlertDialogContent>
                                                <AlertDialogHeader>
                                                    <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                                                    <AlertDialogDescription>
                                                        This action cannot be undone. This will permanently delete the "{process.name}" onboarding process.
                                                    </AlertDialogDescription>
                                                </AlertDialogHeader>
                                                <AlertDialogFooter>
                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                    <AlertDialogAction onClick={() => handleDeleteProcess(process.id)}>Delete</AlertDialogAction>
                                                </AlertDialogFooter>
                                            </AlertDialogContent>
                                        </AlertDialog>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
      </div>


      <AlertDialog open={showSavedDialog} onOpenChange={setShowSavedDialog}>
        <AlertDialogContent>
            <AlertDialogHeader>
                <AlertDialogTitle>Settings Saved</AlertDialogTitle>
                <AlertDialogDescription>
                    Company details have been updated.
                </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
                <AlertDialogAction onClick={() => setShowSavedDialog(false)}>OK</AlertDialogAction>
            </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
