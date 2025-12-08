
'use client';

import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, Controller } from "react-hook-form";
import { z } from "zod";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { createCandidate } from "@/app/actions/client-actions";
import { AiFormField } from "@/lib/company-schemas";

// Helper to create a Zod schema from the AI-generated fields
const createZodSchema = (fields: AiFormField[]) => {
    const shape: { [key: string]: z.ZodType<any, any> } = {};
    fields.forEach(field => {
        let zodField: z.ZodType<any, any>;

        switch (field.type) {
            case 'text':
            case 'textarea':
                zodField = z.string();
                break;
            case 'number':
                zodField = z.coerce.number();
                break;
            case 'email':
                zodField = z.string().email();
                break;
            case 'phone':
                zodField = z.string().min(10);
                break;
            case 'date':
                zodField = z.string().refine(val => !isNaN(Date.parse(val)), { message: "Invalid date" });
                break;
            case 'select':
                zodField = z.string();
                break;
            case 'checkbox':
                zodField = z.boolean();
                break;
            default:
                zodField = z.string();
        }

        if (field.required) {
            if (field.type === 'checkbox') {
                 zodField = z.literal(true, {
                    errorMap: () => ({ message: "This field must be checked." }),
                });
            } else if (zodField instanceof z.ZodString || zodField instanceof z.ZodNumber) {
                 if (zodField instanceof z.ZodString) {
                    zodField = zodField.min(1, { message: "This field is required." });
                 }
            }
        } else {
            zodField = zodField.optional();
        }
        
        shape[field.id] = zodField;
    });

    return z.object(shape);
};


type AiGeneratedFormProps = {
    formName: string;
    fields: AiFormField[];
    companyName: string;
};

export function AiGeneratedForm({ formName, fields, companyName }: AiGeneratedFormProps) {
    const { toast } = useToast();
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = useState(false);

    // This is a safeguard. If fields is empty, zod throws an error.
    if (!fields || fields.length === 0) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>{formName}</CardTitle>
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">This form has no fields configured.</p>
                </CardContent>
            </Card>
        )
    }

    const formSchema = createZodSchema(fields);
    type FormSchema = z.infer<typeof formSchema>;

    const form = useForm<FormSchema>({
        resolver: zodResolver(formSchema),
        defaultValues: fields.reduce((acc, field) => {
            // @ts-ignore
            acc[field.id] = field.type === 'checkbox' ? false : field.type === 'number' ? 0 : '';
            return acc;
        }, {}),
    });

    const onSubmit = async (data: FormSchema) => {
        setIsSubmitting(true);
        try {
            // Flatten the data for storage, including the company name
            const submissionData = {
                ...data,
                applyingFor: [companyName],
                formName: formName,
                // Add default personal info if not present, as createCandidate might expect it
                firstName: (data as any).firstName || (data as any).fullName || 'N/A',
                lastName: (data as any).lastName || '',
            };

            const result = await createCandidate(submissionData as any);

            if (result.success) {
                toast({
                  title: "Application Submitted",
                  description: "Your application has been received.",
                });
                router.push('/application/success');
            } else {
                 toast({
                  variant: "destructive",
                  title: "Submission Failed",
                  description: result.error || "An unknown error occurred.",
                });
            }

        } catch (error) {
             toast({
              variant: "destructive",
              title: "Submission Failed",
              description: (error as Error).message || "An unexpected error occurred.",
            });
        } finally {
            setIsSubmitting(false);
        }
    };


    return (
        <Card>
            <CardHeader>
                <CardTitle>{formName}</CardTitle>
                <CardDescription>Please fill out the fields below.</CardDescription>
            </CardHeader>
            <CardContent>
                <Form {...form}>
                    <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                        {fields.map(field => (
                            <FormField
                                key={field.id}
                                control={form.control}
                                name={field.id as any}
                                render={({ field: formField }) => (
                                    <FormItem>
                                        <FormLabel>{field.label}{field.required && <span className="text-destructive ml-1">*</span>}</FormLabel>
                                        <FormControl>
                                            <div>
                                                {field.type === 'text' && <Input {...formField} value={formField.value || ''} />}
                                                {field.type === 'email' && <Input type="email" {...formField} value={formField.value || ''} />}
                                                {field.type === 'number' && <Input type="number" {...formField} value={formField.value || 0} />}
                                                {field.type === 'phone' && <Input type="tel" {...formField} value={formField.value || ''} />}
                                                {field.type === 'date' && <Input type="date" {...formField} value={formField.value || ''} />}
                                                {field.type === 'textarea' && <Textarea {...formField} value={formField.value || ''} />}
                                                {field.type === 'checkbox' && (
                                                     <div className="flex items-center space-x-2 pt-2">
                                                        <Checkbox id={field.id} checked={formField.value} onCheckedChange={formField.onChange} />
                                                        <label htmlFor={field.id} className="text-sm font-normal">I agree</label>
                                                    </div>
                                                )}
                                                {field.type === 'select' && (
                                                    <Select onValueChange={formField.onChange} defaultValue={formField.value}>
                                                        <SelectTrigger>
                                                            <SelectValue placeholder={`Select a ${field.label.toLowerCase()}`} />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {(field.options || []).map(opt => <SelectItem key={opt} value={opt}>{opt}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                )}
                                            </div>
                                        </FormControl>
                                        <FormMessage />
                                    </FormItem>
                                )}
                            />
                        ))}
                        <div className="flex justify-end pt-4">
                            <Button type="submit" disabled={isSubmitting}>
                                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Submit Application
                            </Button>
                        </div>
                    </form>
                </Form>
            </CardContent>
        </Card>
    )
}
