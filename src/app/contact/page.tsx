import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Mail, Phone, MapPin } from "lucide-react";

export default function ContactPage() {
  // Placeholder server action
  async function handleSubmit(formData: FormData) {
    "use server";
    const name = formData.get("name");
    const email = formData.get("email");
    const message = formData.get("message");
    console.log("Contact form submitted:", { name, email, message });
    // Here you would typically send an email or save to a database
    // For MVP, we'll just log it.
  }

  return (
    <div className="container py-12 md:py-16">
      <Card className="shadow-xl max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="text-3xl md:text-4xl font-bold text-center text-primary">Get In Touch</CardTitle>
          <p className="text-muted-foreground text-center mt-2">We&apos;d love to hear from you. Please fill out the form below or reach out via our contact details.</p>
        </CardHeader>
        <CardContent className="grid md:grid-cols-2 gap-12">
          <form action={handleSubmit} className="space-y-6">
            <div>
              <Label htmlFor="name">Full Name</Label>
              <Input id="name" name="name" placeholder="John Doe" required />
            </div>
            <div>
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" name="email" type="email" placeholder="you@example.com" required />
            </div>
            <div>
              <Label htmlFor="subject">Subject (Optional)</Label>
              <Input id="subject" name="subject" placeholder="Inquiry about listing services" />
            </div>
            <div>
              <Label htmlFor="message">Message</Label>
              <Textarea id="message" name="message" placeholder="Your message..." rows={5} required />
            </div>
            <Button type="submit" className="w-full">Send Message</Button>
          </form>
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-foreground">Contact Information</h3>
            <div className="flex items-start space-x-3">
              <Mail className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Email</p>
                <a href="mailto:support@bizmatch.asia" className="text-muted-foreground hover:text-primary">support@bizmatch.asia</a>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <Phone className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Phone</p>
                <p className="text-muted-foreground">+65 1234 5678 (Singapore)</p>
              </div>
            </div>
            <div className="flex items-start space-x-3">
              <MapPin className="h-6 w-6 text-primary mt-1 flex-shrink-0" />
              <div>
                <p className="font-medium">Office Address</p>
                <p className="text-muted-foreground">123 Business Hub Road, Singapore 012345 (By Appointment Only)</p>
              </div>
            </div>
            <div>
              <h4 className="font-semibold text-foreground mb-2">Business Hours</h4>
              <p className="text-muted-foreground">Monday - Friday: 9:00 AM - 6:00 PM (SGT)</p>
              <p className="text-muted-foreground">Saturday, Sunday & Public Holidays: Closed</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
