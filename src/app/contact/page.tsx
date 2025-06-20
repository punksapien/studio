"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactPage() {
  const [formData, setFormData] = useState<FormData>({
    name: "",
    email: "",
    subject: "",
    message: ""
  });

  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  // Form validation
  const validateForm = (): boolean => {
    const newErrors: FormErrors = {};

    if (!formData.name.trim()) {
      newErrors.name = "Name is required";
    } else if (formData.name.length > 100) {
      newErrors.name = "Name must be under 100 characters";
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = "Please enter a valid email address";
    } else if (formData.email.length > 100) {
      newErrors.email = "Email must be under 100 characters";
    }

    if (!formData.message.trim()) {
      newErrors.message = "Message is required";
    } else if (formData.message.length > 2000) {
      newErrors.message = "Message must be under 2000 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle form submission
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast({
        variant: "destructive",
        title: "Validation Error",
        description: "Please fix the errors below and try again."
      });
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limit Exceeded",
            description: result.error || "Too many submissions. Please wait before trying again."
          });
        } else {
          toast({
            variant: "destructive",
            title: "Submission Failed",
            description: result.error || "Failed to send your message. Please try again."
          });
        }
        return;
      }

      // Success!
      toast({
        title: "Message Sent Successfully!",
        description: result.message || "Thank you for your message! We'll get back to you soon."
      });

      // Reset form
      setFormData({
        name: "",
        email: "",
        subject: "",
        message: ""
      });
      setErrors({});

    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        variant: "destructive",
        title: "Network Error",
        description: "Unable to send your message. Please check your connection and try again."
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input changes
  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field as keyof FormErrors]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary font-heading">
            Get In Touch
          </CardTitle>
          <p className="text-muted-foreground text-center mt-2">
            We&apos;d love to hear from you. Please fill out the form below or reach out via our contact details.
          </p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-12">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                placeholder="John Doe"
                className={errors.name ? "border-destructive" : ""}
                disabled={isLoading}
                required
              />
              {errors.name && (
                <p className="text-sm text-destructive mt-1">{errors.name}</p>
              )}
            </div>

            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleInputChange('email', e.target.value)}
                placeholder="you@example.com"
                className={errors.email ? "border-destructive" : ""}
                disabled={isLoading}
                required
              />
              {errors.email && (
                <p className="text-sm text-destructive mt-1">{errors.email}</p>
              )}
            </div>

            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => handleInputChange('subject', e.target.value)}
                placeholder="Inquiry about listing services"
                disabled={isLoading}
              />
            </div>

            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea
                id="message"
                value={formData.message}
                onChange={(e) => handleInputChange('message', e.target.value)}
                placeholder="Your message..."
                rows={5}
                className={errors.message ? "border-destructive" : ""}
                disabled={isLoading}
                required
              />
              {errors.message && (
                <p className="text-sm text-destructive mt-1">{errors.message}</p>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {formData.message.length}/2000 characters
              </p>
            </div>

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Sending Message...
                </>
              ) : (
                "Send Message"
              )}
            </Button>
          </form>

          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground font-heading">
              Contact Information
            </h3>
            <div className="flex items-start space-x-3">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Email</p>
                <a
                  href="mailto:Business@nobridge.co"
                  className="text-muted-foreground hover:text-primary transition-colors"
                >
                  Business@nobridge.co
                </a>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
