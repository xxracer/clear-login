

"use client"

import { zodResolver } from "@hookform/resolvers/zod"
import { useFieldArray, useForm } from "react-hook-form"
import { z } from "zod"
import { CalendarIcon, PlusCircle, Trash2 } from "lucide-react"
import { format } from "date-fns"
import { useRouter } from "next/navigation"
import { useState } from "react"


import { Button } from "@/components/ui/button"
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { applicationSchema, type ApplicationSchema } from "@/lib/schemas"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Calendar } from "@/components/ui/calendar"
import { cn } from "@/lib/utils"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Checkbox } from "../ui/checkbox"
import { useToast } from "@/hooks/use-toast"
import { Textarea } from "../ui/textarea"
import { createCandidate } from "@/app/actions/client-actions"
import { Loader2 } from "lucide-react"


export function ApplicationForm({ companyName }: { companyName: string }) {
    const { toast } = useToast()
    const router = useRouter()
    const [isSubmitting, setIsSubmitting] = useState(false)

    const form = useForm<ApplicationSchema>({
        resolver: zodResolver(applicationSchema),
        defaultValues: {
            applyingFor: [companyName],
            lastName: "",
            firstName: "",
            middleName: "",
            streetAddress: "",
            city: "",
            state: "",
            zipCode: "",
            homePhone: "",
            businessPhone: "",
            emergencyContact: "",
            hoursAvailable: 40,
            position: "",
            workEveningsWeekends: false,
            education: {
                college: { name: "", location: "", course: "", degree: "" },
                voTech: { name: "", location: "", course: "", degree: "" },
                highSchool: { name: "", location: "", course: "", degree: "" },
                other: { name: "", location: "", course: "", degree: "" },
            },
            employmentHistory: [],
            professionalReferences: [],
            specializedSkills: "",
            resume: undefined,
            driversLicense: undefined,
            driversLicenseName: "",
            certification: false,
            signature: "",
            previouslyEmployed: "no",
            legallyEligible: "yes",
            howLearned: undefined,
            differentLastName: "no",
            previousName: "",
            currentlyEmployed: "no",
            reliableTransportation: "yes",
            convictedOfCrime: "no",
            crimeDescription: "",
            capableOfPerformingJob: "yes",
            jobRequirementLimitation: "",
        },
    });

    const { fields: employmentFields, append: appendEmployment, remove: removeEmployment } = useFieldArray({
      control: form.control,
      name: "employmentHistory",
    });

    const { fields: referenceFields, append: appendReference, remove: removeReference } = useFieldArray({
      control: form.control,
      name: "professionalReferences",
    });

    async function onSubmit(data: ApplicationSchema) {
        setIsSubmitting(true);

        try {
            const result = await createCandidate({
                ...data,
                applyingFor: [companyName],
            });

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
    }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
        <Card>
          <CardHeader>
            <CardTitle className="font-headline">Personal Information</CardTitle>
            <CardDescription>All information provided herein will be kept confidential.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
              <FormField control={form.control} name="lastName" render={({ field }) => (
                  <FormItem><FormLabel>Last Name <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Doe" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="firstName" render={({ field }) => (
                  <FormItem><FormLabel>First Name <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Jane" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
              <FormField control={form.control} name="middleName" render={({ field }) => (
                  <FormItem><FormLabel>Middle Name</FormLabel><FormControl><Input placeholder="(Optional)" {...field} /></FormControl><FormMessage /></FormItem>
              )}/>
            </div>
             <FormField control={form.control} name="date" render={({ field }) => (
                <FormItem className="flex flex-col"><FormLabel>Date <span className="text-destructive">*</span></FormLabel>
                <Popover><PopoverTrigger asChild>
                    <FormControl>
                        <Button variant={"outline"} className={cn("w-full md:w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                        {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                        <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                        </Button>
                    </FormControl>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                    <Calendar mode="single" selected={field.value} onSelect={field.onChange} disabled={(date) => date > new Date() || date < new Date("1900-01-01")} initialFocus />
                </PopoverContent></Popover>
                <FormMessage />
                </FormItem>
            )}/>
          </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Contact Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField control={form.control} name="streetAddress" render={({ field }) => (
                    <FormItem><FormLabel>Street Address <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="123 Main St" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                    <FormField control={form.control} name="city" render={({ field }) => (
                        <FormItem><FormLabel>City <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Anytown" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="state" render={({ field }) => (
                        <FormItem><FormLabel>State <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="CA" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="zipCode" render={({ field }) => (
                        <FormItem><FormLabel>Zip Code <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="90210" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                 <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                    <FormField control={form.control} name="homePhone" render={({ field }) => (
                        <FormItem><FormLabel>Home Phone <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="(555) 123-4567" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                    <FormField control={form.control} name="businessPhone" render={({ field }) => (
                        <FormItem><FormLabel>Business Phone</FormLabel><FormControl><Input placeholder="(Optional)" {...field} /></FormControl><FormMessage /></FormItem>
                    )}/>
                </div>
                <FormField control={form.control} name="emergencyContact" render={({ field }) => (
                    <FormItem><FormLabel>Emergency contact (person not living with you) <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="John Smith" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Employment Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <FormField control={form.control} name="previouslyEmployed" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Have you ever applied for employment with this Agency? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                 <FormField control={form.control} name="hoursAvailable" render={({ field }) => (
                    <FormItem><FormLabel>How many hours a week are you available for work? <span className="text-destructive">*</span></FormLabel><FormControl><Input type="number" placeholder="40" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
                <FormField control={form.control} name="legallyEligible" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Are you legally eligible for employment in the United States? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="howLearned" render={({ field }) => (
                    <FormItem><FormLabel>How did you learn of our organization? <span className="text-destructive">*</span></FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl><SelectTrigger><SelectValue placeholder="Select an option" /></SelectTrigger></FormControl>
                            <SelectContent>
                                <SelectItem value="online">Online Ad</SelectItem>
                                <SelectItem value="employee">Agency employee</SelectItem>
                                <SelectItem value="other">Other</SelectItem>
                            </SelectContent>
                        </Select><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="workEveningsWeekends" render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm">
                        <FormControl><Checkbox checked={field.value} onCheckedChange={field.onChange} /></FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>Are you willing to work evenings/weekends?</FormLabel>
                            <FormDescription>Check if you are available for flexible hours.</FormDescription>
                        </div>
                    </FormItem>
                )}/>
                <FormField control={form.control} name="position" render={({ field }) => (
                    <FormItem><FormLabel>Position applying for <span className="text-destructive">*</span></FormLabel><FormControl><Input placeholder="Software Engineer" {...field} /></FormControl><FormMessage /></FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Education</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="space-y-4">
                    <p className="text-sm text-muted-foreground">Enter your educational background below.</p>
                    
                    <div className="p-4 border rounded-md">
                        <h4 className="font-semibold text-md mb-4">College</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="education.college.name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.college.location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.college.course" render={({ field }) => (<FormItem><FormLabel>Course of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.college.degree" render={({ field }) => (<FormItem><FormLabel>Degree/Diploma</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>

                    <div className="p-4 border rounded-md">
                        <h4 className="font-semibold text-md mb-4">Vo-Tech or Trade School</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="education.voTech.name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.voTech.location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.voTech.course" render={({ field }) => (<FormItem><FormLabel>Course of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.voTech.degree" render={({ field }) => (<FormItem><FormLabel>Degree/Diploma</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>

                    <div className="p-4 border rounded-md">
                        <h4 className="font-semibold text-md mb-4">High School</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="education.highSchool.name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.highSchool.location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.highSchool.course" render={({ field }) => (<FormItem><FormLabel>Course of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.highSchool.degree" render={({ field }) => (<FormItem><FormLabel>Degree/Diploma</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                    
                    <div className="p-4 border rounded-md">
                        <h4 className="font-semibold text-md mb-4">Other</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <FormField control={form.control} name="education.other.name" render={({ field }) => (<FormItem><FormLabel>School Name</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.other.location" render={({ field }) => (<FormItem><FormLabel>Location</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.other.course" render={({ field }) => (<FormItem><FormLabel>Course of Study</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                            <FormField control={form.control} name="education.other.degree" render={({ field }) => (<FormItem><FormLabel>Degree/Diploma</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                        </div>
                    </div>
                </div>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Employment History</CardTitle>
                <CardDescription>List the last five years of employment history, starting with the most recent employer.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {employmentFields.map((field, index) => (
                <div key={field.id} className="space-y-6 rounded-md border p-4 relative">
                    <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeEmployment(index)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>

                    <h4 className="font-semibold">Employer #{index + 1}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormField control={form.control} name={`employmentHistory.${index}.companyName`} render={({ field }) => (
                        <FormItem><FormLabel>Company Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`employmentHistory.${index}.telephone`} render={({ field }) => (
                        <FormItem><FormLabel>Telephone <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    </div>
                    <FormField control={form.control} name={`employmentHistory.${index}.address`} render={({ field }) => (
                        <FormItem><FormLabel>Address <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name={`employmentHistory.${index}.city`} render={({ field }) => (
                        <FormItem><FormLabel>City <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`employmentHistory.${index}.state`} render={({ field }) => (
                        <FormItem><FormLabel>State <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    <FormField control={form.control} name={`employmentHistory.${index}.zipCode`} render={({ field }) => (
                        <FormItem><FormLabel>Zip Code <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                    )} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <FormField control={form.control} name={`employmentHistory.${index}.dateFrom`} render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>Dates of Employment: From <span className="text-destructive">*</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name={`employmentHistory.${index}.dateTo`} render={({ field }) => (
                        <FormItem className="flex flex-col">
                            <FormLabel>To <span className="text-destructive">*</span></FormLabel>
                            <Popover>
                                <PopoverTrigger asChild>
                                    <FormControl>
                                        <Button variant={"outline"} className={cn("w-full pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                            {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                            <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                        </Button>
                                    </FormControl>
                                </PopoverTrigger>
                                <PopoverContent className="w-auto p-0" align="start"><Calendar mode="single" selected={field.value} onSelect={field.onChange} /></PopoverContent>
                            </Popover>
                            <FormMessage />
                        </FormItem>
                    )}/>
                    <FormField control={form.control} name={`employmentHistory.${index}.startingPay`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Starting Pay <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Input type="number" {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    </div>

                    <FormField control={form.control} name={`employmentHistory.${index}.jobTitleAndDescription`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Job Title and Describe your work <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                    <FormField control={form.control} name={`employmentHistory.${index}.reasonForLeaving`} render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reason for leaving <span className="text-destructive">*</span></FormLabel>
                            <FormControl><Textarea {...field} /></FormControl>
                            <FormMessage />
                        </FormItem>
                    )} />
                </div>
                ))}
                {employmentFields.length < 3 && (
                <Button type="button" variant="outline" size="sm" onClick={() => appendEmployment({ companyName: "", telephone: "", address: "", city: "", state: "", zipCode: "", dateFrom: new Date(), dateTo: new Date(), startingPay: 0, jobTitleAndDescription: "", reasonForLeaving: "" })}>
                    <PlusCircle className="mr-2 h-4 w-4" />
                    Add Employment
                </Button>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Additional Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                <FormField control={form.control} name="differentLastName" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Was your last name different from your present name during the above listed jobs? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                {form.watch('differentLastName') === 'yes' && (
                    <FormField control={form.control} name="previousName" render={({ field }) => (<FormItem><FormLabel>If yes, what was your name? <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
                <FormField control={form.control} name="currentlyEmployed" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Are you currently employed? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                <FormField control={form.control} name="reliableTransportation" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Do you have reliable transportation? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Professional References</CardTitle>
                <CardDescription>List persons who can furnish information about your job performance.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {referenceFields.map((field, index) => (
                    <div key={field.id} className="space-y-6 rounded-md border p-4 relative">
                        <Button type="button" variant="ghost" size="icon" className="absolute top-2 right-2" onClick={() => removeReference(index)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                        <h4 className="font-semibold">Reference #{index + 1}</h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <FormField control={form.control} name={`professionalReferences.${index}.name`} render={({ field }) => (
                                <FormItem><FormLabel>Name <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                            <FormField control={form.control} name={`professionalReferences.${index}.telephone`} render={({ field }) => (
                                <FormItem><FormLabel>Telephone <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                            )} />
                        </div>
                        <FormField control={form.control} name={`professionalReferences.${index}.address`} render={({ field }) => (
                            <FormItem><FormLabel>Address <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>
                        )} />
                    </div>
                ))}
                {referenceFields.length < 3 && (
                    <Button type="button" variant="outline" size="sm" onClick={() => appendReference({ name: "", telephone: "", address: "" })}>
                        <PlusCircle className="mr-2 h-4 w-4" />
                        Add Reference
                    </Button>
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">General Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-8">
                 <FormField control={form.control} name="convictedOfCrime" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Have you ever been convicted of a crime in the past 5 years, barring employment in a Home Care and community support Agency? <span className="text-destructive">*</span></FormLabel>
                        <FormDescription>Conviction will not necessarily disqualify an applicant from employment.</FormDescription>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                {form.watch('convictedOfCrime') === 'yes' && (
                    <FormField control={form.control} name="crimeDescription" render={({ field }) => (<FormItem><FormLabel>If yes, describe in full: <span className="text-destructive">*</span></FormLabel><FormControl><Textarea {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}

                <FormField control={form.control} name="capableOfPerformingJob" render={({ field }) => (
                    <FormItem className="space-y-3"><FormLabel>Are you capable of performing the job set forth in the job description? <span className="text-destructive">*</span></FormLabel>
                        <FormControl>
                            <RadioGroup onValueChange={field.onChange} defaultValue={field.value} className="flex flex-row space-x-4">
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="yes" /></FormControl><FormLabel className="font-normal">Yes</FormLabel></FormItem>
                                <FormItem className="flex items-center space-x-2 space-y-0"><FormControl><RadioGroupItem value="no" /></FormControl><FormLabel className="font-normal">No</FormLabel></FormItem>
                            </RadioGroup>
                        </FormControl><FormMessage />
                    </FormItem>
                )}/>
                {form.watch('capableOfPerformingJob') === 'no' && (
                    <FormField control={form.control} name="jobRequirementLimitation" render={({ field }) => (<FormItem><FormLabel>If you answered No, which job requirement can you not meet? <span className="text-destructive">*</span></FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem>)} />
                )}
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Credentials & Skills</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="specializedSkills"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Credentials/Specialized Skills & Qualifications/Equipment Operated</FormLabel>
                            <FormDescription>List all states in which licensed giving registration and expiration date. Summarize special job-related skills and qualification acquired from employment or other experience.</FormDescription>
                            <FormControl>
                                <Textarea rows={5} {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Resume / CV</CardTitle>
            </CardHeader>
            <CardContent>
                <FormField
                    control={form.control}
                    name="resume"
                    render={({ field: { onChange, value, ...fieldProps} }) => {
                        // Check if a file is selected to display its name
                        const fileName = value instanceof File ? value.name : "No file chosen";
                        return (
                            <FormItem>
                                <FormLabel>Upload your resume <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept=".pdf,.doc,.docx" 
                                        onChange={(e) => onChange(e.target.files?.[0])}
                                        {...fieldProps}
                                        value={undefined} // Required to allow file input to be controlled
                                     />
                                </FormControl>
                                <FormDescription>
                                  Please upload your resume in PDF, DOC, or DOCX format.
                                  {value instanceof File && <span className="block mt-1">Selected file: {fileName}</span>}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
            </CardContent>
        </Card>

        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Driver's License</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <FormField
                    control={form.control}
                    name="driversLicense"
                    render={({ field: { onChange, value, ...fieldProps} }) => {
                        const fileName = value instanceof File ? value.name : "No file chosen";
                        return (
                            <FormItem>
                                <FormLabel>Upload your Driver's License <span className="text-destructive">*</span></FormLabel>
                                <FormControl>
                                    <Input 
                                        type="file" 
                                        accept="image/*,.pdf" 
                                        onChange={(e) => onChange(e.target.files?.[0])}
                                        {...fieldProps}
                                        value={undefined}
                                     />
                                </FormControl>
                                <FormDescription>
                                  Please upload a clear image or PDF of your license.
                                  {value instanceof File && <span className="block mt-1">Selected file: {fileName}</span>}
                                </FormDescription>
                                <FormMessage />
                            </FormItem>
                        );
                    }}
                />
                 <FormField
                    control={form.control}
                    name="driversLicenseName"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Name on Driver's License <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Jane Doe" {...field} />
                            </FormControl>
                            <FormMessage />
                        </FormItem>
                    )}
                />
                <FormField 
                    control={form.control} 
                    name="driversLicenseExpiration" 
                    render={({ field }) => (
                        <FormItem className="flex flex-col"><FormLabel>License Expiration Date <span className="text-destructive">*</span></FormLabel>
                        <Popover><PopoverTrigger asChild>
                            <FormControl>
                                <Button variant={"outline"} className={cn("w-full md:w-[240px] pl-3 text-left font-normal", !field.value && "text-muted-foreground")}>
                                {field.value ? format(field.value, "PPP") : <span>Pick a date</span>}
                                <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                            </FormControl>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar mode="single" selected={field.value} onSelect={field.onChange} initialFocus />
                        </PopoverContent></Popover>
                        <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>


        <Card>
            <CardHeader>
                <CardTitle className="font-headline">Certification & Authorization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6 text-sm text-muted-foreground">
                <p>I certify that the facts contained in this application are true and complete to the best of my knowledge and understand, that, if employed, falsified statements on this application SHALL BE GROUNDS FOR DISMISSAL.</p>
                <p>I Authorize complete investigation of all statements contained herein and herby give my full permission for the Agency to contact and fully discuss my background and history with all persons and entities listed above to give the Agency any and all information concerning my previous employment and any information they may have, and release all former employees and others listed above from all liability for any damage that my result from furnishing the same to the Agency.</p>
                <p>I understand and agree that, if hired, my employment is for no definite period arid may, regardless of the date of payment of my wages and salary, be terminated at any time for any lawful reason, without prior notice and with or without cause.</p>
                <p>This application for employment shall be considered active for a period of time not to exceed 45 days. Any applicant wishing to be considered for employment beyond this time period shall inquire as to whether or not applications are being accepted at that time.</p>
                
                <FormField
                    control={form.control}
                    name="certification"
                    render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0 rounded-md border p-4 shadow-sm bg-background">
                        <FormControl>
                            <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                            <FormLabel>By checking this box, I acknowledge that I have read and agree to the terms above. <span className="text-destructive">*</span></FormLabel>
                        </div>
                        </FormItem>
                    )}
                />

                <FormField
                    control={form.control}
                    name="signature"
                    render={({ field }) => (
                        <FormItem>
                            <FormLabel>Electronic Signature <span className="text-destructive">*</span></FormLabel>
                            <FormControl>
                                <Input placeholder="Type your full name" {...field} />
                            </FormControl>
                            <FormDescription>Typing your full name here serves as your electronic signature.</FormDescription>
                            <FormMessage />
                        </FormItem>
                    )}
                />
            </CardContent>
        </Card>

        <div className="flex justify-end">
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Submit Application
          </Button>
        </div>
      </form>
    </Form>
  )
}
