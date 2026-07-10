import { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { CheckCircle2, Clock, Mail, MapPin, Phone, Send } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useSubmitContact } from "@workspace/api-client-react";
import { useToast } from "@/hooks/use-toast";

const contactSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters."),
  email: z.string().email("Please enter a valid email address."),
  phone: z.string().optional(),
  subject: z.string().min(5, "Subject must be at least 5 characters."),
  message: z.string().min(20, "Please provide more details in your message."),
});

export default function Contact() {
  const { toast } = useToast();
  const submitContact = useSubmitContact();
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof contactSchema>>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      subject: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof contactSchema>) {
    submitContact.mutate(
      { data: values },
      {
        onSuccess: () => {
          setIsSuccess(true);
          form.reset();
        },
        onError: () => {
          toast({
            title: "Submission Failed",
            description: "There was an error sending your message. Please try again.",
            variant: "destructive",
          });
        },
      }
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-muted/20 pb-24">
      {/* Header */}
      <section className="bg-primary text-white pt-20 pb-32">
        <div className="container mx-auto px-4 md:px-8">
          <div className="max-w-3xl">
            <h1 className="text-4xl md:text-5xl font-serif font-bold mb-6">Get in Touch</h1>
            <p className="text-lg md:text-xl text-primary-foreground/80 leading-relaxed">
              Whether you have questions about specific job opportunities, visa requirements, or our process, our expert advisors are here to help.
            </p>
          </div>
        </div>
      </section>

      <div className="container mx-auto px-4 md:px-8 -mt-20 relative z-10">
        <div className="flex flex-col lg:flex-row gap-8">
          
          {/* Contact Info */}
          <div className="w-full lg:w-1/3 flex flex-col gap-6">
            <div className="bg-card rounded-xl shadow-md border p-8">
              <h3 className="text-xl font-bold text-primary mb-6">Office Information</h3>
              
              <div className="space-y-6">
                <div className="flex items-start">
                  <MapPin className="w-6 h-6 text-secondary mt-1 mr-4 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary">Address</h4>
                    <p className="text-muted-foreground mt-1">
                      Stefan cel Mare si Sfant Boulevard 65<br />
                      Chisinau, MD-2001<br />
                      Republic of Moldova
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Phone className="w-6 h-6 text-secondary mt-1 mr-4 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary">Phone</h4>
                    <p className="text-muted-foreground mt-1">
                      +373 22 123 456<br />
                      +373 69 987 654 (Mobile/Viber/WhatsApp)
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Mail className="w-6 h-6 text-secondary mt-1 mr-4 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary">Email</h4>
                    <p className="text-muted-foreground mt-1">
                      contact@moldova-visa-assist.replit.app<br />
                      applications@moldova-visa-assist.replit.app
                    </p>
                  </div>
                </div>
                
                <div className="flex items-start">
                  <Clock className="w-6 h-6 text-secondary mt-1 mr-4 shrink-0" />
                  <div>
                    <h4 className="font-semibold text-primary">Business Hours</h4>
                    <p className="text-muted-foreground mt-1">
                      Monday - Friday: 09:00 - 18:00<br />
                      Saturday - Sunday: Closed
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          {/* Contact Form */}
          <div className="flex-1 bg-card rounded-xl shadow-md border p-8 md:p-10">
            {isSuccess ? (
              <div className="flex flex-col items-center justify-center text-center h-full py-12">
                <div className="w-20 h-20 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-6">
                  <CheckCircle2 className="w-10 h-10" />
                </div>
                <h2 className="text-3xl font-serif font-bold text-primary mb-4">Message Sent!</h2>
                <p className="text-muted-foreground mb-8 max-w-md">
                  Thank you for reaching out. We have received your inquiry and one of our advisors will contact you within 24 business hours.
                </p>
                <Button variant="outline" onClick={() => setIsSuccess(false)}>
                  Send Another Message
                </Button>
              </div>
            ) : (
              <>
                <h2 className="text-2xl font-bold text-primary mb-6">Send us a message</h2>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Full Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Your Name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="email"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Email Address</FormLabel>
                            <FormControl>
                              <Input type="email" placeholder="your.email@example.com" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <FormField
                        control={form.control}
                        name="phone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Phone Number (Optional)</FormLabel>
                            <FormControl>
                              <Input placeholder="+373..." {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      
                      <FormField
                        control={form.control}
                        name="subject"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Subject</FormLabel>
                            <FormControl>
                              <Input placeholder="What is your inquiry about?" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    
                    <FormField
                      control={form.control}
                      name="message"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Message</FormLabel>
                          <FormControl>
                            <Textarea 
                              placeholder="Please provide details about your situation, target countries, or specific questions..." 
                              className="min-h-32"
                              {...field} 
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <Button 
                      type="submit" 
                      className="w-full h-12 text-lg font-bold" 
                      disabled={submitContact.isPending}
                    >
                      {submitContact.isPending ? (
                        "Sending..."
                      ) : (
                        <span className="flex items-center">Send Message <Send className="w-5 h-5 ml-2" /></span>
                      )}
                    </Button>
                  </form>
                </Form>
              </>
            )}
          </div>
          
        </div>
      </div>
    </div>
  );
}
