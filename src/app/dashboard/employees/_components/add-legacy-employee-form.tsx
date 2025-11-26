
'use client';

import { useState, useTransition } from "react";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, File, AlertCircle, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { format, parse } from "date-fns";
import { extractEmployeeDataFromPdf } from "@/ai/flows/extract-employee-data";
import { createLegacyEmployee } from "@/app/actions/client-actions";
import { ExtractEmployeeDataOutput } from "@/lib/schemas";


// Helper to convert a File to a base64 data URI
async function fileToDataURL(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result as string);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

const formSchema = z.object({
    pdf: z.any().refine((file) => !!file, "A PDF file is required."),
    hireDate: z.date({ required_error: "A hire date is required." }),
});


export function AddLegacyEmployeeForm({ onEmployeeAdded }: { onEmployeeAdded: () => void }) {
    const { toast } = useToast();
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [extractedData, setExtractedData] = useState<ExtractEmployeeDataOutput | null>(null);
    const [hireDate, setHireDate] = useState<Date | null>(null);
    const [isPending, startTransition] = useTransition();

    const { control, handleSubmit, watch, formState: { errors } } = useForm<z.infer<typeof formSchema>>({
        resolver: zodResolver(formSchema),
    });
    const pdfFile = watch('pdf');


    const handleAnalyze = async (data: z.infer<typeof formSchema>) => {
        setIsLoading(true);
        setError(null);
        setExtractedData(null);
        setHireDate(data.hireDate); 
        
        try {
            const pdfDataUri = await fileToDataURL(data.pdf);
            const result = await extractEmployeeDataFromPdf({ pdfDataUri });
            setExtractedData(result);
        } catch (e) {
            console.error(e);
            setError("Failed to analyze PDF. The document might be unreadable or the AI service is unavailable.");
        } finally {
            setIsLoading(false);
        }
    };
    
    const handleConfirmAndSave = async () => {
        if (!extractedData || !hireDate || !pdfFile) return;
        
        startTransition(async () => {
            try {
                // The AI returns the date as a "YYYY-MM-DD" string. Parse it into a Date object.
                const expirationDateStr = extractedData.driversLicenseExpiration || "";
                const expirationDate = expirationDateStr ? parse(expirationDateStr, 'yyyy-MM-dd', new Date()) : undefined;

                const employeeData = {
                    firstName: extractedData.firstName,
                    lastName: extractedData.lastName,
                    streetAddress: extractedData.address,
                    city: extractedData.city,
                    state: extractedData.state,
                    zipCode: extractedData.zipCode,
                    driversLicenseExpiration: expirationDate && !isNaN(expirationDate.getTime()) ? expirationDate.toISOString() : undefined,
                    date: hireDate.toISOString(), // Using 'date' field to store hire date as it's used elsewhere for hire/application date
                    position: extractedData.position,
                    homePhone: extractedData.homePhone,
                    emergencyContact: extractedData.emergencyContact,
                    documents: [],
                    miscDocuments: [],
                    // We don't save the PDF itself for legacy employees in this version
                    // applicationPdfUrl, 
                };
                
                const result = await createLegacyEmployee(employeeData);
                
                if (result.success) {
                    toast({ title: "Employee Added", description: `${extractedData.firstName} ${extractedData.lastName} has been added to the system.` });
                    onEmployeeAdded(); // Callback to close dialog and refresh list
                } else {
                    toast({ variant: "destructive", title: "Save Failed", description: result.error });
                }
            } catch (e) {
                console.error(e);
                toast({ variant: "destructive", title: "Save Failed", description: (e as Error).message || "An unexpected error occurred." });
            }
        });
    }


    if (extractedData) {
        return (
            <div className="space-y-4">
                <Alert>
                    <AlertTitle>Confirm Extracted Information</AlertTitle>
                    <AlertDescription>
                        Please review the information extracted by the AI. You can edit it before saving.
                    </AlertDescription>
                </Alert>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <Label>First Name</Label>
                        <Input value={extractedData.firstName} onChange={(e) => setExtractedData({ ...extractedData, firstName: e.target.value })} />
                    </div>
                    <div className="space-y-2">
                        <Label>Last Name</Label>
                        <Input value={extractedData.lastName} onChange={(e) => setExtractedData({ ...extractedData, lastName: e.target.value })} />
                    </div>
                </div>
                 <div className="space-y-2">
                    <Label>Address</Label>
                    <Input value={extractedData.address} onChange={(e) => setExtractedData({ ...extractedData, address: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Position</Label>
                    <Input value={extractedData.position} onChange={(e) => setExtractedData({ ...extractedData, position: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Home Phone</Label>
                    <Input value={extractedData.homePhone} onChange={(e) => setExtractedData({ ...extractedData, homePhone: e.target.value })} />
                </div>
                 <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input value={extractedData.emergencyContact} onChange={(e) => setExtractedData({ ...extractedData, emergencyContact: e.target.value })} />
                </div>
                <div className="space-y-2">
                    <Label>Driver's License Expiration (YYYY-MM-DD)</Label>
                    <Input value={extractedData.driversLicenseExpiration} onChange={(e) => setExtractedData({ ...extractedData, driversLicenseExpiration: e.target.value })} />
                </div>
                <div className="flex justify-end gap-2">
                     <Button variant="ghost" onClick={() => setExtractedData(null)} disabled={isPending}>Back</Button>
                     <Button onClick={handleConfirmAndSave} disabled={isPending}>
                         {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                         Confirm and Save
                     </Button>
                </div>
            </div>
        );
    }

    return (
        <form onSubmit={handleSubmit(handleAnalyze)} className="space-y-6">
            <div className="space-y-2">
                <Label htmlFor="pdf">Employee Application PDF</Label>
                <Controller
                    name="pdf"
                    control={control}
                    render={({ field }) => (
                        <Input 
                            id="pdf"
                            type="file"
                            accept="application/pdf"
                            onChange={(e) => field.onChange(e.target.files?.[0])}
                        />
                    )}
                />
                {pdfFile && <p className="text-sm text-muted-foreground flex items-center gap-2"><File className="h-4 w-4" /> {pdfFile.name}</p>}
                {errors.pdf && <p className="text-sm font-medium text-destructive">{errors.pdf.message as string}</p>}
                <p className="text-xs text-muted-foreground">Please upload one PDF at a time.</p>
            </div>
            
            <div className="space-y-2">
                 <Label>Date of Hire</Label>
                 <Controller
                    name="hireDate"
                    control={control}
                    render={({ field }) => (
                         <Popover>
                            <PopoverTrigger asChild>
                                <Button
                                variant={"outline"}
                                className={cn(
                                    "w-full justify-start text-left font-normal",
                                    !field.value && "text-muted-foreground"
                                )}
                                >
                                <CalendarIcon className="mr-2 h-4 w-4" />
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                </Button>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0">
                                <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={field.onChange}
                                initialFocus
                                />
                            </PopoverContent>
                        </Popover>
                    )}
                />
                {errors.hireDate && <p className="text-sm font-medium text-destructive">{errors.hireDate.message}</p>}
            </div>

            {error && (
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Analysis Failed</AlertTitle>
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
            )}

            <div className="flex justify-end">
                <Button type="submit" disabled={isLoading}>
                    {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Analyze PDF
                </Button>
            </div>
        </form>
    );
}
