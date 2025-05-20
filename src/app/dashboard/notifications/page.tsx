
'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Bell, Check, Mail } from "lucide-react";
import type { NotificationItem, User } from "@/lib/types";
import { sampleBuyerNotifications, sampleUsers } from "@/lib/placeholder-data";
import { Badge } from "@/components/ui/badge";

// Placeholder for current buyer ID
const currentBuyerId = 'user6'; // Change to 'user2' to see different notifications
const currentUser: User | undefined = sampleUsers.find(u => u.id === currentBuyerId && u.role === 'buyer');

// Filter notifications for the current buyer
const buyerNotifications: NotificationItem[] = sampleBuyerNotifications
  .filter(notif => notif.userId === currentBuyerId)
  .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime()); // Newest first

export default function NotificationsPage() {
  
  // Placeholder for marking as read
  const handleMarkAsRead = (notificationId: string) => {
    console.log("Marking notification as read:", notificationId);
    // In a real app, update the notification's isRead status in backend/state
  };

  if (!currentUser) {
     return (
      <div className="space-y-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Access Denied</h1>
        <p className="text-muted-foreground">You must be logged in as a buyer to view this page.</p>
        <Button asChild><Link href="/auth/login">Login</Link></Button>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">My Notifications</h1>
      <p className="text-muted-foreground">
        Stay updated with important alerts and messages related to your activity.
      </p>

      {buyerNotifications.length === 0 ? (
        <Card className="shadow-md text-center py-12">
          <CardContent>
            <Bell className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
            <p className="text-xl font-semibold text-muted-foreground">No notifications yet.</p>
            <p className="text-sm text-muted-foreground mt-1">
              Important updates and alerts will appear here.
            </p>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-lg">
          <CardHeader>
            <CardTitle>All Notifications</CardTitle>
            <CardDescription>You have {buyerNotifications.filter(n => !n.isRead).length} unread notifications.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {buyerNotifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 border rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 ${notification.isRead ? 'bg-card hover:bg-muted/30' : 'bg-primary/10 hover:bg-primary/20 border-primary/50'}`}
              >
                <div className="flex-grow">
                  <p className={`text-sm ${notification.isRead ? 'text-muted-foreground' : 'text-foreground'}`}>
                    {notification.message}
                  </p>
                  <p className={`text-xs mt-1 ${notification.isRead ? 'text-muted-foreground/70' : 'text-primary/80'}`}>
                    {new Date(notification.timestamp).toLocaleString()}
                  </p>
                </div>
                <div className="flex-shrink-0 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
                  {notification.link && (
                    <Button variant="outline" size="sm" asChild>
                      <Link href={notification.link}>
                        {notification.link.includes('verification') ? <ShieldCheck className="mr-2 h-4 w-4"/> : <Mail className="mr-2 h-4 w-4"/>}
                        View Details
                      </Link>
                    </Button>
                  )}
                  {!notification.isRead && (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkAsRead(notification.id)}>
                      <Check className="mr-2 h-4 w-4"/> Mark as Read
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
