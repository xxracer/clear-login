
"use client";

import { Company, OnboardingProcess } from "@/lib/company-schemas";
import { useToast } from "@/hooks/use-toast";
import {
    createOrUpdateCompany,
    addOnboardingProcess,
    deleteOnboardingProcess,
    getCompanies,
} from "@/app/actions/company-actions";
import { uploadKvFile, deleteFile } from "@/app/actions/kv-actions";
import { useState, useEffect, useTransition, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  ArrowRight,
  Building,
  FileImage,
  FilePlus,
  FileText,
  Image as ImageIcon,
  Info,
  Link as LinkIcon,
  Loader2,
  Mail,
  MessageSquare,
  Plus,
  PlusCircle,
  Save,
  Trash2,
  Upload,
  Wand2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { AiFormBuilderDialog } from "@/components/dashboard/settings/ai-form-builder-dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { AiFormField, ApplicationForm } from "@/lib/company-schemas";
import { generateIdForServer } from "@/lib/server-utils";
import Image from "next/image";
import { getFile } from "@/app/actions/kv-actions";
import { cn } from "@/lib/utils";
import Link from "next/link";


type ActiveProcessPhase = 'application' | 'interview' | 'documentation';


export default function SettingsPage() {
  const [company, setCompany] = useState<Partial<Company>>({ name: "", onboardingProcesses: [] });
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [interviewImageFile, setInterviewImageFile] = useState<File | null>(null);
  const [interviewImagePreview, setInterviewImagePreview] = useState<string | null>(null);
  const [customFormImages, setCustomFormImages] = useState<File[]>([]);
  const [customFormImagePreviews, setCustomFormImagePreviews] = useState<string[]>([]);
  const [isFormBuilderOpen, setFormBuilderOpen] = useState(false);
  const [selectedProcess, setSelectedProcess] = useState<OnboardingProcess | null>(null);
  const [activePhase, setActivePhase] = useState<ActiveProcessPhase>('application');

  const [showProcessesHint, setShowProcessesHint] = useState(false);

  const loadCompanyData = useCallback(async () => {
    startTransition(async () => {
      try {
        const companies = await getCompanies();
        if (companies && companies.length > 0) {
          const loadedCompany = companies[0];
          setCompany(loadedCompany);
          if (loadedCompany.onboardingProcesses && loadedCompany.onboardingProcesses.length > 0) {
              setSelectedProcess(loadedCompany.onboardingProcesses[0]);
              setShowProcessesHint(false);
          } else {
              setShowProcessesHint(true);
          }
          if (loadedCompany.logo) {
              const url = await getFile(loadedCompany.logo);
              setLogoPreview(url);
          }
        } else {
            setShowProcessesHint(true);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Error loading company", description: "Could not load company data." });
      }
    });
  }, [toast]);
  
  useEffect(() => {
    loadCompanyData();
  }, [loadCompanyData]);
  
  useEffect(() => {
    if (selectedProcess) {
        if (selectedProcess.applicationForm?.type === 'custom' && selectedProcess.applicationForm.images) {
            const fetchPreviews = async () => {
                const urls = await Promise.all(selectedProcess!.applicationForm!.images!.map(key => getFile(key).catch(() => null)));
                setCustomFormImagePreviews(urls.filter(Boolean) as string[]);
            }
            fetchPreviews();
        } else {
            setCustomFormImagePreviews([]);
        }
         if (selectedProcess.interviewScreen?.type === 'custom' && selectedProcess.interviewScreen.imageUrl) {
            const fetchPreview = async () => {
                const url = await getFile(selectedProcess!.interviewScreen!.imageUrl!);
                setInterviewImagePreview(url);
            }
            fetchPreview();
        } else {
            setInterviewImagePreview(null);
        }
    }
  }, [selectedProcess])

  const handleSave = () => {
    startTransition(async () => {
      let companyToSave = { ...company };
      
      try {
        if (logoFile) {
          if (company.logo) await deleteFile(company.logo);
          const newLogoKey = await uploadKvFile(logoFile, `logo_${Date.now()}_${logoFile.name}`);
          companyToSave.logo = newLogoKey;
        }

        if (interviewImageFile && selectedProcess) {
          const currentImageUrl = selectedProcess.interviewScreen?.imageUrl;
          if (currentImageUrl) await deleteFile(currentImageUrl);
          const newImageKey = await uploadKvFile(interviewImageFile, `interview_bg_${Date.now()}_${interviewImageFile.name}`);
          
          const updatedProcesses = company.onboardingProcesses?.map(p => 
            p.id === selectedProcess.id 
              ? { ...p, interviewScreen: { ...p.interviewScreen, type: 'custom' as const, imageUrl: newImageKey } }
              : p
          ) || [];
          companyToSave.onboardingProcesses = updatedProcesses;
        }

        if (customFormImages.length > 0 && selectedProcess) {
            // Delete old images first
            const oldImageKeys = selectedProcess.applicationForm?.images || [];
            await Promise.all(oldImageKeys.map(key => deleteFile(key)));

            // Upload new images
            const newImageKeys = await Promise.all(
                customFormImages.map(file => uploadKvFile(file, `form_img_${Date.now()}_${file.name}`))
            );
            
            const updatedProcesses = (companyToSave.onboardingProcesses || []).map(p => 
                p.id === selectedProcess.id 
                ? { ...p, applicationForm: { ...(p.applicationForm || { id: generateIdForServer(), name: 'Custom' }), type: 'custom' as const, fields: [], images: newImageKeys } }
                : p
            );
            companyToSave.onboardingProcesses = updatedProcesses;
        }


        const result = await createOrUpdateCompany(companyToSave);

        if (result.success) {
          toast({ title: "Settings Saved", description: "Your company profile has been updated." });
          setCompany(result.company);
          if (result.company?.onboardingProcesses?.length) {
            setSelectedProcess(result.company.onboardingProcesses.find(p => p.id === selectedProcess?.id) || result.company.onboardingProcesses[0]);
          }
        } else {
          throw new Error(result.error);
        }
      } catch (error) {
        toast({ variant: "destructive", title: "Save Failed", description: (error as Error).message });
      }
    });
  };

  const handleLogoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setLogoFile(file);
      setLogoPreview(URL.createObjectURL(file));
    }
  };
  
  const handleInterviewImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files?.[0]) {
      const file = e.target.files[0];
      setInterviewImageFile(file);
      setInterviewImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCustomFormImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const files = Array.from(e.target.files);
      setCustomFormImages(files);
      setCustomFormImagePreviews(files.map(f => URL.createObjectURL(f)));
    }
  }

  const handleCreateProcess = () => {
      startTransition(async () => {
          const newProcess: OnboardingProcess = {
            id: generateIdForServer(),
            name: `Custom Form ${ (company.onboardingProcesses?.length || 0) + 1}`,
            applicationForm: {
                id: generateIdForServer(),
                name: `Custom Form ${ (company.onboardingProcesses?.length || 0) + 1}`,
                type: 'template',
            },
            interviewScreen: {
                type: 'template',
                imageUrl: null,
            },
            requiredDocs: [],
          };
          const result = await addOnboardingProcess(company.id!, newProcess);
          if (result.success) {
              setCompany(result.company);
              setSelectedProcess(newProcess);
              setShowProcessesHint(false);
          } else {
              toast({ variant: 'destructive', title: 'Error', description: result.error });
          }
      });
  }

  const handleDeleteProcess = (processId: string) => {
    startTransition(async () => {
        if (!company.id) return;
        const result = await deleteOnboardingProcess(company.id, processId);
        if (result.success) {
            setCompany(result.company);
            // If the deleted process was selected, select the first one or null
            if (selectedProcess?.id === processId) {
                 setSelectedProcess(result.company?.onboardingProcesses?.[0] || null);
            }
        } else {
            toast({ variant: 'destructive', title: 'Error', description: result.error });
        }
    });
  }

  const handleAddGeneratedForm = async (name: string, fields: AiFormField[]) => {
      const newForm: ApplicationForm = {
          id: generateIdForServer(),
          name,
          type: 'custom',
          fields,
          images: [],
      };
      
      const newProcess: OnboardingProcess = {
        id: generateIdForServer(),
        name: name,
        applicationForm: newForm,
        interviewScreen: { type: 'template', imageUrl: null },
        requiredDocs: [],
      };
      
      const result = await addOnboardingProcess(company.id!, newProcess);
      if (result.success) {
          setCompany(result.company);
          setSelectedProcess(newProcess);
          toast({ title: "AI Form Saved", description: `${name} has been added to your forms.`});
      } else {
          toast({ variant: "destructive", title: "Save Failed", description: result.error });
      }
  };

  const availableForms = company.onboardingProcesses?.filter(p => p.applicationForm) || [];
  const availableInterviews = company.onboardingProcesses?.filter(p => p.interviewScreen) || [];

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-6 w-6" /> Company Profile
          </CardTitle>
          <CardDescription>
            Update your company's public details and logo. This information will be visible to candidates.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                    <Label htmlFor="company-name">Company Name</Label>
                    <Input id="company-name" value={company.name} onChange={(e) => setCompany({ ...company, name: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label htmlFor="company-phone">Phone Number</Label>
                    <Input id="company-phone" value={company.phone} onChange={(e) => setCompany({ ...company, phone: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-address">Address</Label>
                    <Input id="company-address" value={company.address} onChange={(e) => setCompany({ ...company, address: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label htmlFor="company-email">Email</Label>
                    <Input id="company-email" type="email" value={company.email} onChange={(e) => setCompany({ ...company, email: e.target.value })} />
                </div>
            </div>
            <div className="space-y-2">
                <Label>Company Logo</Label>
                <div className="flex items-center gap-4">
                    {logoPreview ? (
                        <Image src={logoPreview} alt="Company Logo" width={120} height={40} className="rounded-md border p-2 object-contain" />
                    ) : (
                        <div className="h-16 w-32 rounded-md border flex items-center justify-center text-xs text-muted-foreground bg-muted/50">No Logo</div>
                    )}
                    <Input id="logo-upload" type="file" accept="image/*" onChange={handleLogoChange} className="max-w-xs" />
                </div>
            </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="flex-row items-start justify-between">
            <div>
                <CardTitle className="flex items-center gap-2">
                    <Wand2 className="h-6 w-6 text-primary" /> AI-Powered Process Builder
                </CardTitle>
                <CardDescription>
                    Use our guided wizard to generate custom onboarding processes with AI.
                </CardDescription>
            </div>
             <Button variant="outline" onClick={() => setFormBuilderOpen(true)}>
                <Wand2 className="mr-2 h-4 w-4" /> Start Wizard
            </Button>
        </CardHeader>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-start justify-between">
          <div>
            <CardTitle>Onboarding Processes</CardTitle>
            <CardDescription>
              Manage the steps and forms for different roles.
            </CardDescription>
          </div>
           {showProcessesHint && (
                <div className="flex items-center gap-2 text-primary animate-pulse">
                    <p className="text-sm font-medium">Click here first!</p>
                    <ArrowRight className="h-4 w-4" />
                    <AlertDialog defaultOpen>
                        <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7"><Info className="h-5 w-5 text-muted-foreground" /></Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>Let's Create Your First Onboarding Process</AlertDialogTitle>
                                <AlertDialogDescription>
                                    An onboarding process is a set of steps a candidate goes through. It starts with an application form. Click "Create New Process" to get started. You can create different processes for different job roles.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogAction>Got it!</AlertDialogAction>
                            </AlertDialogFooter>
                        </AlertDialogContent>
                    </AlertDialog>
                </div>
            )}
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 rounded-lg border p-4 space-y-4">
                <div className="flex items-center justify-between">
                     <h3 className="font-semibold">
                        {activePhase === 'application' && 'Available Forms'}
                        {activePhase === 'interview' && 'Available Interview Screens'}
                     </h3>
                    <Button size="sm" variant="outline" onClick={handleCreateProcess} disabled={isPending}>
                        <PlusCircle className="mr-2 h-4 w-4" /> New
                    </Button>
                </div>
                <div className="space-y-2">
                  {(activePhase === 'application' ? availableForms : availableInterviews).map(process => (
                      <Button key={process.id} variant={selectedProcess?.id === process.id ? "secondary" : "ghost"} className="w-full justify-start group" onClick={() => setSelectedProcess(process)}>
                          <FileText className="mr-2 h-4 w-4" />
                          <span className="flex-1 text-left">{process.name}</span>
                           <AlertDialog>
                              <AlertDialogTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-6 w-6 opacity-0 group-hover:opacity-100" onClick={(e) => e.stopPropagation()}>
                                  <Trash2 className="h-4 w-4 text-destructive"/>
                                </Button>
                              </AlertDialogTrigger>
                              <AlertDialogContent>
                                <AlertDialogHeader>
                                  <AlertDialogTitle>Delete "{process.name}"?</AlertDialogTitle>
                                  <AlertDialogDescription>This will permanently delete the process and its configuration. This action cannot be undone.</AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                                  <AlertDialogAction onClick={() => handleDeleteProcess(process.id)}>Delete</AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                      </Button>
                  ))}
                  {isPending && <Loader2 className="animate-spin" />}
                </div>
            </div>
            <div className="md:col-span-2 rounded-lg border p-4">
                 {selectedProcess ? (
                    <div className="space-y-6">
                        <div>
                            <Label htmlFor="process-name">Process Name</Label>
                            <Input id="process-name" value={selectedProcess.name} readOnly className="font-semibold" />
                        </div>

                         <Card className={cn("overflow-hidden", activePhase === 'application' && "ring-2 ring-primary")}>
                            <CardHeader className="bg-muted/30 cursor-pointer" onClick={() => setActivePhase('application')}>
                                <CardTitle className="text-lg">Phase 1: Application Form</CardTitle>
                            </CardHeader>
                            {activePhase === 'application' && (
                               <CardContent className="p-6 space-y-4">
                                   <div className="grid grid-cols-2 gap-4">
                                        <Button variant={selectedProcess.applicationForm?.type !== 'custom' ? 'secondary' : 'outline'} onClick={() => {
                                            const updatedProcesses = company.onboardingProcesses?.map(p => p.id === selectedProcess.id ? {...p, applicationForm: {...(p.applicationForm || { id: generateIdForServer(), name: 'Default' }), type: 'template', fields: [], images: [] }} : p);
                                            setCompany({...company, onboardingProcesses: updatedProcesses});
                                            setSelectedProcess(updatedProcesses?.find(p => p.id === selectedProcess.id) || null);
                                        }}>
                                            <FileText className="mr-2 h-4 w-4" />Use Default Template
                                        </Button>
                                         <Button variant={selectedProcess.applicationForm?.type === 'custom' ? 'secondary' : 'outline'} onClick={() => {/*This button is for visual selection*/}}>
                                            <FileImage className="mr-2 h-4 w-4" />Use Custom Form Image
                                        </Button>
                                   </div>
                                   {selectedProcess.applicationForm?.type === 'custom' && (
                                       <div className="space-y-2 pt-4">
                                            <Label htmlFor="custom-form-upload">Upload Form Images (e.g. scans of paper forms)</Label>
                                            <Input id="custom-form-upload" type="file" accept="image/*" multiple onChange={handleCustomFormImageChange} />
                                            {customFormImagePreviews.length > 0 && (
                                                <div className="flex gap-2 pt-2 overflow-x-auto">
                                                    {customFormImagePreviews.map((src, i) => <Image key={i} src={src} alt="form preview" width={80} height={110} className="rounded border object-cover" />)}
                                                </div>
                                            )}
                                            <p className="text-xs text-muted-foreground">Candidates will see these images instead of a web form.</p>
                                       </div>
                                   )}
                                </CardContent>
                            )}
                        </Card>

                        <Card className={cn("overflow-hidden", activePhase === 'interview' && "ring-2 ring-primary")}>
                             <CardHeader className="bg-muted/30 cursor-pointer" onClick={() => setActivePhase('interview')}>
                                <CardTitle className="text-lg">Phase 2: Interview Screen</CardTitle>
                             </CardHeader>
                            {activePhase === 'interview' && (
                               <CardContent className="p-6 space-y-4">
                                   <p className="text-sm text-muted-foreground">Customize the screen HR personnel will use to review candidates during the interview.</p>
                                   <div className="grid grid-cols-2 gap-4">
                                       <Button variant={selectedProcess.interviewScreen?.type !== 'custom' ? 'secondary' : 'outline'} onClick={() => {
                                            const updatedProcesses = company.onboardingProcesses?.map(p => p.id === selectedProcess.id ? {...p, interviewScreen: { type: 'template', imageUrl: null }} : p);
                                            setCompany({...company, onboardingProcesses: updatedProcesses});
                                            setSelectedProcess(updatedProcesses?.find(p => p.id === selectedProcess.id) || null);
                                       }}>
                                            <MessageSquare className="mr-2 h-4 w-4" />Use Default Screen
                                       </Button>
                                       <Button variant={selectedProcess.interviewScreen?.type === 'custom' ? 'secondary' : 'outline'} onClick={() => {/* visual */}}>
                                            <ImageIcon className="mr-2 h-4 w-4" />Use Custom Background
                                       </Button>
                                   </div>
                                    {selectedProcess.interviewScreen?.type === 'custom' && (
                                       <div className="space-y-2 pt-4">
                                            <Label htmlFor="interview-bg-upload">Upload Background Image</Label>
                                            <div className="flex items-center gap-4">
                                                {interviewImagePreview ? (
                                                    <Image src={interviewImagePreview} alt="Interview background" width={120} height={67} className="rounded-md border p-1 object-cover" />
                                                ) : (
                                                    <div className="h-16 w-32 rounded-md border flex items-center justify-center text-xs text-muted-foreground bg-muted/50">No Image</div>
                                                )}
                                                <Input id="interview-bg-upload" type="file" accept="image/*" onChange={handleInterviewImageChange} className="max-w-xs" />
                                            </div>
                                       </div>
                                   )}
                               </CardContent>
                            )}
                        </Card>
                        
                        <Card className="overflow-hidden">
                             <CardHeader className="bg-muted/30">
                                <CardTitle className="text-lg flex items-center justify-between">
                                    <span>Phase 3: Required Documentation</span> 
                                    <span className="text-xs font-medium text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Available Soon</span>
                                </CardTitle>
                             </CardHeader>
                        </Card>
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center h-full text-center text-muted-foreground">
                        <FileText className="h-12 w-12" />
                        <h3 className="mt-4 font-semibold">Select a form from the library to edit.</h3>
                    </div>
                )}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-2">
        <Button variant="outline" asChild>
            <Link href="/dashboard/settings/preview/application" target="_blank">Preview</Link>
        </Button>
        <Button onClick={handleSave} disabled={isPending}>
          {isPending ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Saving...</>) : (<><Save className="mr-2 h-4 w-4" /> Save All Settings</>)}
        </Button>
      </div>

       <AiFormBuilderDialog 
        isOpen={isFormBuilderOpen}
        onOpenChange={setFormBuilderOpen}
        companyName={company.name}
        onFormGenerated={handleAddGeneratedForm}
      />
    </div>
  );
}
