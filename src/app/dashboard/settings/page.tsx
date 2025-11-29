
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building, Save, PlusCircle, Trash2, Loader2, Workflow, Edit, Upload, Wand2, Library, Eye, Info, ArrowRight, Link as LinkIcon, File as FileIcon, UserPlus, Shield } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { getCompanies, createOrUpdateCompany, addOnboardingProcess, deleteOnboardingProcess, uploadCompanyLogo, deleteCompanyLogo, deleteCompany } from "@/app/actions/company-actions";
import { type Company, type OnboardingProcess, requiredDocSchema, type RequiredDoc, type ApplicationForm as AppFormType, AiFormField } from "@/lib/company-schemas";
import { generateIdForServer } from "@/lib/server-utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
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
                 <p className="text-xs text-muted-foreground">If the company exists, the admin will be associated. If not, a new company placeholder will be created.</p>
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
                Create Admin
            </Button>
        </form>
    );
}


function CompanyForm({ company, onSave, onCancel }: { company?: Partial<Company> | null, onSave: (data: Partial<Company>, file?: File) => void, onCancel: () => void }) {
    const [details, setDetails] = useState<Partial<Company>>(company || {});
    const [logoFile, setLogoFile] = useState<File>();
    const [logoPreview, setLogoPreview] = useState<string | null>(company?.logo || null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setLogoFile(file);
            setLogoPreview(URL.createObjectURL(file));
        }
    };

    const handleSave = () => {
        onSave(details, logoFile);
    };

    return (
        <div className="space-y-4">
            <div className="space-y-2">
                <Label htmlFor="company-name">Company Name</Label>
                <Input id="company-name" placeholder="e.g., Acme Home Care" value={details.name || ''} onChange={(e) => setDetails(prev => ({ ...prev, name: e.target.value }))} />
            </div>
            <div className="space-y-2">
                <Label htmlFor="company-logo">Company Logo</Label>
                <div className="flex items-center gap-4">
                    <Input id="company-logo" type="file" className="max-w-xs" onChange={handleFileChange} accept="image/*" />
                    {logoPreview && <Image src={logoPreview} alt="Logo Preview" width={40} height={40} className="rounded-sm object-contain" />}
                </div>
            </div>
            <DialogFooter>
                <Button variant="ghost" onClick={onCancel}>Cancel</Button>
                <Button onClick={handleSave}>
                    <Save className="mr-2 h-4 w-4" /> Save Company
                </Button>
            </DialogFooter>
        </div>
    );
}



// Main component for the settings page
export default function SettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [companies, setCompanies] = useState<Company[]>([]);
  
  const [isCompanyFormOpen, setIsCompanyFormOpen] = useState(false);
  const [editingCompany, setEditingCompany] = useState<Partial<Company> | null>(null);


  const loadCompanies = async () => {
      setIsLoading(true);
      try {
          const companiesData = await getCompanies();
          setCompanies(companiesData || []);
      } catch (error) {
          toast({ variant: "destructive", title: "Error", description: "Could not load company data." });
      } finally {
          setIsLoading(false);
      }
  };

  useEffect(() => {
    loadCompanies();
  }, [toast]);


  const handleSaveCompany = (companyData: Partial<Company>, logoFile?: File) => {
    startTransition(async () => {
      if (!companyData.name) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Company name is required." });
        return;
      }
      
      let dataToSave = { ...companyData };
      
      if (logoFile) {
        if(dataToSave.logo) {
            await deleteCompanyLogo(dataToSave.logo);
        }
        const newLogoUrl = await uploadCompanyLogo(logoFile);
        dataToSave.logo = newLogoUrl;
      }

      const result = await createOrUpdateCompany(dataToSave);
      if (result.success && result.company) {
          toast({ title: "Company Saved", description: `${result.company.name} has been saved.` });
          setIsCompanyFormOpen(false);
          setEditingCompany(null);
          loadCompanies();
      } else {
        toast({ variant: "destructive", title: "Save Failed", description: result.error || "Failed to save." });
      }
    });
  };
  
  const handleEditCompany = (company: Company) => {
      setEditingCompany(company);
      setIsCompanyFormOpen(true);
  }
  
  const handleAddNewCompany = () => {
      setEditingCompany(null);
      setIsCompanyFormOpen(true);
  }
  
  const handleDeleteCompany = (companyId: string) => {
      startTransition(async () => {
          await deleteCompany(companyId);
          toast({ title: "Company Deleted", description: "The company has been removed."});
          loadCompanies();
      });
  }


    if (isLoading) {
        return <div className="flex justify-center items-center h-40"><Loader2 className="h-8 w-8 animate-spin" /></div>
    }

  return (
    <div className="space-y-6">
        <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
            <Settings className="h-8 w-8 text-foreground" />
            <div>
                <h1 className="text-3xl font-headline font-bold text-foreground">Settings</h1>
                <p className="text-muted-foreground">Manage companies, users, and onboarding workflows.</p>
            </div>
            </div>
        </div>
      
        <div className="w-full space-y-6">
            <Card>
                <CardHeader className="flex flex-row items-center justify-between">
                    <div className="flex items-center gap-2">
                        <Building className="h-5 w-5" />
                        <CardTitle className="text-xl">Manage Companies</CardTitle>
                    </div>
                     <Dialog open={isCompanyFormOpen} onOpenChange={setIsCompanyFormOpen}>
                        <DialogTrigger asChild>
                           <Button onClick={handleAddNewCompany}><PlusCircle className="mr-2 h-4 w-4" /> Add New Company</Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>{editingCompany ? 'Edit Company' : 'Add New Company'}</DialogTitle>
                                <DialogDescription>Fill in the details for the company.</DialogDescription>
                            </DialogHeader>
                            <CompanyForm 
                                company={editingCompany} 
                                onSave={handleSaveCompany} 
                                onCancel={() => { setIsCompanyFormOpen(false); setEditingCompany(null); }}
                            />
                        </DialogContent>
                    </Dialog>
                </CardHeader>
                <CardContent className="space-y-2">
                    {companies.length === 0 ? (
                        <p className="text-sm text-muted-foreground text-center py-4">No companies created yet. Click "Add New Company" to start.</p>
                    ) : (
                        companies.map(company => (
                             <div key={company.id} className="flex items-center justify-between p-2 rounded-md hover:bg-muted/50">
                                <div className="flex items-center gap-3">
                                    {company.logo ? (
                                        <Image src={company.logo} alt={`${company.name} logo`} width={32} height={32} className="rounded-sm object-contain" />
                                    ) : (
                                        <div className="h-8 w-8 rounded-sm bg-muted flex items-center justify-center text-muted-foreground"><Building className="h-4 w-4" /></div>
                                    )}
                                    <span className="font-semibold">{company.name}</span>
                                </div>
                                <div className="flex items-center gap-2">
                                    <Button variant="outline" size="sm" onClick={() => handleEditCompany(company)}>
                                        <Edit className="mr-2 h-4 w-4" /> Edit
                                    </Button>
                                    <AlertDialog>
                                        <AlertDialogTrigger asChild><Button variant="destructive" size="sm"><Trash2 className="mr-2 h-4 w-4" /> Delete</Button></AlertDialogTrigger>
                                        <AlertDialogContent>
                                            <AlertDialogHeader><AlertDialogTitle>Are you sure?</AlertDialogTitle><AlertDialogDescription>This will permanently delete {company.name} and all associated data.</AlertDialogDescription></AlertDialogHeader>
                                            <AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => handleDeleteCompany(company.id!)}>Delete</AlertDialogAction></AlertDialogFooter>
                                        </AlertDialogContent>
                                    </AlertDialog>
                                </div>
                             </div>
                        ))
                    )}
                </CardContent>
            </Card>

            <Card>
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <UserPlus className="h-5 w-5" />
                        <CardTitle className="text-xl">Create Company Admin</CardTitle>
                    </div>
                    <CardDescription>Create a new user account for a company administrator.</CardDescription>
                </CardHeader>
                <CardContent>
                    <CreateAdminForm />
                </CardContent>
            </Card>

            <Card>
                 <CardHeader>
                    <div className="flex items-center gap-2">
                        <Workflow className="h-5 w-5" />
                        <CardTitle className="text-xl">Onboarding Workflows</CardTitle>
                    </div>
                     <CardDescription>
                        Build and manage repeatable onboarding processes for different job roles.
                    </CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="text-center p-8 border-2 border-dashed rounded-lg">
                        <p className="text-muted-foreground mb-4">You don’t have any workflows yet.</p>
                        <Button>
                            <PlusCircle className="mr-2 h-4 w-4"/>
                            Create New Workflow
                        </Button>
                    </div>
                </CardContent>
            </Card>
        </div>
    </div>
  );
}
