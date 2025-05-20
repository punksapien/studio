import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, MessageSquare, Mail } from "lucide-react";

// Placeholder data
const sampleInquiries = [
  {
    id: "inq1",
    listingTitle: "Profitable E-commerce Store in SEA",
    listingId: "1",
    otherPartyName: "Jane Smith (Verified Buyer)", // If seller is viewing
    // otherPartyName: "John Doe (Verified Seller)", // If buyer is viewing
    otherPartyRole: "Buyer", // or "Seller"
    date: new Date("2023-11-10T10:00:00Z"),
    status: "Seller Engaged - Buyer Pending Verification", // Example status from types.ts
    isRead: false,
  },
  {
    id: "inq2",
    listingId: "2",
    listingTitle: "Established SaaS Platform - B2B Niche",
    otherPartyName: "Anonymous Buyer (ID: B789)",
    otherPartyRole: "Buyer",
    date: new Date("2023-11-08T15:30:00Z"),
    status: "New Inquiry",
    isRead: true,
  },
];

// Placeholder for current user role
const currentUserRole = "seller"; // or "buyer"

export default function InquiriesPage() {
  const getStatusBadgeVariant = (status: string) => {
    if (status.includes("New")) return "default";
    if (status.includes("Pending")) return "secondary";
    if (status.includes("Ready") || status.includes("Facilitated")) return "default"; // bg-accent
    return "outline";
  };
  const getStatusBadgeClass = (status: string) => {
    if (status.includes("Ready") || status.includes("Facilitated")) return "bg-accent text-accent-foreground";
    return "";
  }


  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Inquiries</h1>
      <p className="text-muted-foreground">
        {currentUserRole === 'seller' 
          ? "Track inquiries from potential buyers for your listings." 
          : "Manage your inquiries sent to sellers about their businesses."}
      </p>

      {sampleInquiries.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <MessageSquare className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No inquiries yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              {currentUserRole === 'seller' 
                ? "Potential buyers will appear here once they inquire about your listings."
                : "Your inquiries to sellers will be shown here."}
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {sampleInquiries.map((inquiry) => (
            <Card key={inquiry.id} className={`shadow-lg ${!inquiry.isRead ? 'border-primary border-2' : ''}`}>
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row justify-between sm:items-center gap-2">
                  <CardTitle className="text-xl">
                    Inquiry for: <Link href={`/listings/${inquiry.listingId}`} className="text-primary hover:underline">{inquiry.listingTitle}</Link>
                  </CardTitle>
                  <Badge variant={getStatusBadgeVariant(inquiry.status)} className={getStatusBadgeClass(inquiry.status)}>
                    {inquiry.status}
                  </Badge>
                </div>
                <CardDescription className="text-xs">
                  Received on: {inquiry.date.toLocaleDateString()} at {inquiry.date.toLocaleTimeString()}
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-0 pb-4">
                <p className="text-sm">
                  {currentUserRole === 'seller' ? 'From' : 'To'}:{' '}
                  <span className="font-medium text-foreground">{inquiry.otherPartyName}</span> ({inquiry.otherPartyRole})
                </p>
                {/* More details might go here based on inquiry status */}
              </CardContent>
              <CardFooter className="flex justify-end gap-2 pt-0">
                {inquiry.status === "New Inquiry" && currentUserRole === 'seller' && (
                   <Button size="sm">
                     Engage in Conversation <ArrowRight className="ml-2 h-4 w-4" />
                   </Button>
                )}
                 {inquiry.status.includes("Pending Verification") && (
                   <Button size="sm" variant="outline" disabled>
                     Awaiting Verification
                   </Button>
                )}
                 {inquiry.status === "Ready for Admin Connection" && (
                   <Button size="sm" variant="default" className="bg-accent text-accent-foreground hover:bg-accent/90">
                     Admin Connecting <Mail className="ml-2 h-4 w-4" />
                   </Button>
                )}
                {/* More actions based on status */}
                 <Button size="sm" variant="ghost">
                     View Details
                 </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
