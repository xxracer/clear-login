
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Building, Save, PlusCircle, Trash2, Loader2, Workflow, Edit, Upload, Wand2, Library } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useState, useEffect, useTransition } from "react";
import Image from "next/image";
import { getCompanies, createOrUpdateCompany, deleteCompany } from "@/app/actions/company-actions";
import { type Company } from "@/lib/company-schemas";
import { getFile, uploadKvFile, deleteFile } from "@/app/actions/kv-actions";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Textarea } from "@/components/ui/textarea";

// Main component for the settings page
export default function SettingsPage() {
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [isLoading, setIsLoading] = useState(true);
  const [company, setCompany] = useState<Partial<Company>>({});
  const [logoFile, setLogoFile] = useState<File | undefined>();
  const [logoPreview, setLogoPreview] = useState<string | null>(null);

  // Load initial company data
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const companies = await getCompanies();
      const firstCompany = companies[0] || {};
      setCompany(firstCompany);
      if (firstCompany.logo) {
        const url = await getFile(firstCompany.logo);
        setLogoPreview(url);
      }
      setIsLoading(false);
    }
    loadInitialData();
  }, []);

  const handleFieldChange = (field: keyof Company, value: string) => {
    setCompany(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoChange = (file: File | null) => {
    if (file) {
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };

  const handleSave = () => {
    startTransition(async () => {
      if (!company.name) {
        toast({ variant: 'destructive', title: "Validation Error", description: "Company name is required." });
        return;
      }
      
      try {
        let dataToSave = { ...company };
        
        if (logoFile) {
          const logoKey = `logo-${dataToSave.name?.replace(/\s+/g, '-')}-${Date.now()}`;
          if (dataToSave.logo) {
            await deleteFile(dataToSave.logo);
          }
          const uploadedKey = await uploadKvFile(logoFile, logoKey);
          dataToSave.logo = uploadedKey;
        }

        const result = await createOrUpdateCompany(dataToSave);
        if (!result.success || !result.company) throw new Error(result.error || "Failed to save.");

        toast({ title: "Settings Saved", description: "Company details have been updated." });
        setCompany(result.company);
        setLogoFile(undefined); // Reset file input state

      } catch (error) {
        toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
      }
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-1 items-center justify-center p-10">
        <Loader2 className="h-12 w-12 text-muted-foreground animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Settings className="h-8 w-8 text-foreground" />
          <div>
            <h1 className="text-3xl font-headline font-bold text-foreground">System Settings</h1>
            <p className="text-muted-foreground">Manage company profile and onboarding processes.</p>
          </div>
        </div>
      </div>
      
      {/* Company Details Form - matching the image */}
      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <RadioGroup defaultValue="single" className="flex items-center">
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="single" id="single-company" />
                <Label htmlFor="single-company">Single Company</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="multiple" id="multiple-companies" disabled />
                <Label htmlFor="multiple-companies" className="text-muted-foreground/50">Multiple Companies</Label>
              </div>
            </RadioGroup>
          </div>
        </CardHeader>
        <CardContent>
          <div className="border rounded-lg p-4">
            <CardTitle className="mb-1 flex items-center gap-2 text-xl">
              <Building className="h-5 w-5" />
              New Company Details
            </CardTitle>
            <CardDescription className="mb-6">Manage the company profile and associated onboarding users. Remember to save your changes.</CardDescription>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Left Side */}
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="company-name">Company Name</Label>
                  <Input id="company-name" placeholder="e.g., Noble Health" value={company.name || ''} onChange={(e) => handleFieldChange('name', e.target.value)} />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-address">Address</Label>
                  <Input id="company-address" placeholder="123 Main St, Anytown, USA" value={company.address || ''} onChange={(e) => handleFieldChange('address', e.target.value)} />
                </div>
                <div className="grid grid-cols-2 gap-4">
                   <div className="space-y-2">
                      <Label htmlFor="company-phone">Phone Number</Label>
                      <Input id="company-phone" placeholder="(555) 123-4567" value={company.phone || ''} onChange={(e) => handleFieldChange('phone', e.target.value)} />
                  </div>
                   <div className="space-y-2">
                      <Label htmlFor="company-fax">Fax</Label>
                      <Input id="company-fax" placeholder="(555) 123-4568" value={company.fax || ''} onChange={(e) => handleFieldChange('fax', e.target.value)} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="company-email">Company Email</Label>
                  <Input id="company-email" type="email" placeholder="contact@noblehealth.com" value={company.email || ''} onChange={(e) => handleFieldChange('email', e.target.value)} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-logo">Company Logo</Label>
                    <div className="flex items-center gap-4">
                        <Input id="company-logo" type="file" className="max-w-xs" onChange={(e) => handleLogoChange(e.target.files?.[0] || null)} accept="image/*" />
                        {logoPreview && <Image src={logoPreview} alt="Logo Preview" width={40} height={40} className="rounded-sm object-contain" />}
                    </div>
                </div>
              </div>
              {/* Right Side */}
              <div className="space-y-4 rounded-md border p-4 bg-muted/30">
                <h3 className="font-semibold text-foreground">Onboarding Users</h3>
                <div className="space-y-2">
                  <Label htmlFor="user-name">User Name</Label>
                  <Input id="user-name" placeholder="e.g., John Doe" disabled />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="user-role">Role</Label>
                  <Input id="user-role" placeholder="e.g., HR Manager" disabled />
                </div>
                 <div className="space-y-2">
                  <Label htmlFor="user-email">Email</Label>
                  <Input id="user-email" type="email" placeholder="e.g., john.doe@company.com" disabled />
                </div>
                <Button className="w-full" disabled><PlusCircle className="mr-2 h-4 w-4" /> Add User</Button>
              </div>
            </div>
            <div className="mt-6">
              <Button size="lg" disabled={isPending} onClick={handleSave}>
                {isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Company & Continue
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      {/* Onboarding Process Section */}
      <Card>
        <CardHeader>
            <CardTitle className="flex items-center gap-2"><Workflow className="h-5 w-5" /> Onboarding Process</CardTitle>
            <CardDescription>Customize the application and documentation process for your candidates.</CardDescription>
        </CardHeader>
        <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* AI Form Builder */}
            <Card className="bg-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Wand2 className="h-5 w-5 text-primary" /> AI-Powered Form Builder</CardTitle>
                    <CardDescription>Describe the form you need, and let AI generate it for you.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="ai-prompt">Form Description</Label>
                        <Textarea id="ai-prompt" placeholder="e.g., 'Create a form for a delivery driver application. I need fields for name, contact info, vehicle type, and years of experience.'" disabled />
                    </div>
                    <Button disabled>
                        <Wand2 className="mr-2 h-4 w-4" />
                        Generate Form (Coming Soon)
                    </Button>
                </CardContent>
            </Card>

            {/* Form Library */}
            <Card className="bg-muted/20">
                <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-xl"><Library className="h-5 w-5" /> Your Form Library</CardTitle>
                    <CardDescription>Manage and reuse your saved application forms and onboarding processes.</CardDescription>
                </CardHeader>
                <CardContent>
                     <div className="border rounded-md p-8 text-center text-muted-foreground">
                        <p>Your saved forms will appear here.</p>
                        <Button variant="outline" className="mt-4" disabled>
                           <PlusCircle className="mr-2 h-4 w-4" /> Create New Process (Coming Soon)
                        </Button>
                     </div>
                </CardContent>
            </Card>
        </CardContent>
      </Card>

    </div>
  );
}
