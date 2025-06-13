'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { VerificationRequestItem, VerificationStatus, VerificationQueueStatus, AdminNote } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, UserCircle, Clock, ShieldCheck, AlertTriangle, Info, Edit, CheckSquare, ListChecks, MessageSquareWarning } from 'lucide-react';
import { cn } from '@/lib/utils';

interface UpdateVerificationStatusDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  request: VerificationRequestItem | null;
  onSave: (
    requestId: string,
    newOperationalStatus: VerificationQueueStatus,
    newProfileStatus: VerificationStatus,
    updatedAdminNotes: AdminNote[]
  ) => void;
}

const OperationalStatusBadge = ({ status }: { status: VerificationQueueStatus }) => {
  const commonClasses = "text-xs px-2 py-0.5 rounded-full font-medium flex items-center gap-1";
  switch (status) {
    case 'New Request': return <Badge variant="outline" className={cn(commonClasses, "bg-blue-100 text-blue-700 border-blue-300")}><Clock className="h-3 w-3" />New</Badge>;
    case 'Contacted': return <Badge variant="outline" className={cn(commonClasses, "bg-sky-100 text-sky-700 border-sky-300")}><UserCircle className="h-3 w-3" />Contacted</Badge>;
    case 'Docs Under Review': return <Badge variant="outline" className={cn(commonClasses, "bg-purple-100 text-purple-700 border-purple-300")}><ListChecks className="h-3 w-3" />Docs Review</Badge>;
    case 'More Info Requested': return <Badge variant="outline" className={cn(commonClasses, "bg-orange-100 text-orange-700 border-orange-300")}><MessageSquareWarning className="h-3 w-3" />More Info</Badge>;
    case 'Approved': return <Badge variant="outline" className={cn(commonClasses, "bg-green-100 text-green-700 border-green-300")}><CheckSquare className="h-3 w-3" />Approved</Badge>;
    case 'Rejected': return <Badge variant="destructive" className={cn(commonClasses, "bg-red-100 text-red-700 border-red-300")}><AlertTriangle className="h-3 w-3" />Rejected</Badge>;
    default: return <Badge className={cn(commonClasses)}>{status}</Badge>;
  }
};

const ProfileStatusBadge = ({ status }: { status: VerificationStatus | undefined }) => {
  const commonClasses = "text-xs px-2 py-1 h-5 gap-1";

  if (!status) {
    return <Badge variant="outline" className={cn(commonClasses, "capitalize")}>Unknown</Badge>;
  }

  switch (status) {
    case 'verified': return <Badge variant="outline" className={cn(commonClasses, "bg-green-100 text-green-700 border-green-300")}><ShieldCheck className="h-3 w-3" />Verified</Badge>;
    case 'pending_verification': return <Badge variant="outline" className={cn(commonClasses, "bg-yellow-100 text-yellow-700 border-yellow-300")}><AlertTriangle className="h-3 w-3" />Pending</Badge>;
    case 'rejected': return <Badge variant="destructive" className={cn(commonClasses, "bg-red-100 text-red-700 border-red-300")}><AlertTriangle className="h-3 w-3" />Rejected</Badge>;
    case 'anonymous':
    default: return <Badge variant="outline" className={cn(commonClasses, "capitalize")}>{(status as string).replace(/_/g, ' ')}</Badge>;
  }
};


export function UpdateVerificationStatusDialog({
  isOpen,
  onOpenChange,
  request,
  onSave,
}: UpdateVerificationStatusDialogProps) {
  const { toast } = useToast();
  const [selectedOperationalStatus, setSelectedOperationalStatus] = React.useState<VerificationQueueStatus | undefined>(undefined);
  const [selectedProfileStatus, setSelectedProfileStatus] = React.useState<VerificationStatus | undefined>(undefined);
  const [currentAdminNotes, setCurrentAdminNotes] = React.useState<AdminNote[]>([]);
  const [newNoteText, setNewNoteText] = React.useState('');

  const [showMainConfirmation, setShowMainConfirmation] = React.useState(false);
  const [noteToDeleteId, setNoteToDeleteId] = React.useState<string | null>(null);
  const [isDeleteNoteDialogOpen, setIsDeleteNoteDialogOpen] = React.useState(false);

  const initialRequestStateRef = React.useRef<{
    operationalStatus?: VerificationQueueStatus;
    profileStatus?: VerificationStatus;
    adminNotes?: AdminNote[];
  } | null>(null);

  React.useEffect(() => {
    if (request && isOpen) {
      initialRequestStateRef.current = {
        operationalStatus: request.operationalStatus,
        profileStatus: request.profileStatus,
        adminNotes: JSON.parse(JSON.stringify(request.adminNotes || [])),
      };
      setSelectedOperationalStatus(request.operationalStatus);
      setSelectedProfileStatus(request.profileStatus);
      setCurrentAdminNotes(JSON.parse(JSON.stringify(request.adminNotes || [])));
      setNewNoteText('');
    } else {
        initialRequestStateRef.current = null;
    }
    setShowMainConfirmation(false);
    setNoteToDeleteId(null);
    setIsDeleteNoteDialogOpen(false);
  }, [request, isOpen]);

  if (!request) return null;

  const operationalStatusChanged = selectedOperationalStatus !== initialRequestStateRef.current?.operationalStatus;
  const profileStatusChanged = selectedProfileStatus !== initialRequestStateRef.current?.profileStatus;
  const newNoteAdded = newNoteText.trim() !== '';
  const notesChanged = JSON.stringify(currentAdminNotes) !== JSON.stringify(initialRequestStateRef.current?.adminNotes || []);
  const hasAnyChange = operationalStatusChanged || profileStatusChanged || newNoteAdded || notesChanged;

  const handleAttemptSave = () => {
    if (!selectedOperationalStatus || !selectedProfileStatus) {
      toast({ variant: "destructive", title: "Error", description: "Please select both operational and profile statuses." });
      return;
    }
    if (hasAnyChange) {
      setShowMainConfirmation(true);
    } else {
      toast({ title: "No Changes", description: "No changes were made to statuses or notes." });
      onOpenChange(false);
    }
  };

  const handleConfirmSave = () => {
    if (!selectedOperationalStatus || !selectedProfileStatus) return;

    let finalNotes = [...currentAdminNotes];
    if (newNoteText.trim() !== '') {
      finalNotes.push({
        id: `note_${Date.now()}`,
        note: newNoteText.trim(),
        timestamp: new Date(),
        operationalStatusAtTimeOfNote: selectedOperationalStatus,
        profileStatusAtTimeOfNote: selectedProfileStatus,
        adminId: 'current_admin_placeholder', // Replace with actual admin ID from auth context
        adminName: 'Admin User', // Replace with actual admin name
      });
    }
    onSave(request.id, selectedOperationalStatus, selectedProfileStatus, finalNotes);
    setShowMainConfirmation(false);
    onOpenChange(false);
  };

  const handleOpenDeleteNoteDialog = (noteId: string) => {
    setNoteToDeleteId(noteId);
    setIsDeleteNoteDialogOpen(true);
  };

  const handleConfirmDeleteNote = () => {
    if (noteToDeleteId) {
      setCurrentAdminNotes(prev => prev.filter(note => note.id !== noteToDeleteId));
      toast({ title: "Note Marked for Deletion", description: "The note will be removed when you save changes." });
    }
    setIsDeleteNoteDialogOpen(false);
    setNoteToDeleteId(null);
  };

  const handleCancel = () => {
    if (initialRequestStateRef.current) {
        setSelectedOperationalStatus(initialRequestStateRef.current.operationalStatus);
        setSelectedProfileStatus(initialRequestStateRef.current.profileStatus);
        setCurrentAdminNotes(JSON.parse(JSON.stringify(initialRequestStateRef.current.adminNotes || [])));
    }
    setNewNoteText('');
    setShowMainConfirmation(false);
    onOpenChange(false);
  };

  const operationalStatusOptions: VerificationQueueStatus[] = ["New Request", "Contacted", "Docs Under Review", "More Info Requested", "Approved", "Rejected"];
  const profileStatusOptions: VerificationStatus[] = ['anonymous', 'pending_verification', 'verified', 'rejected'];

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); else onOpenChange(true);}}>
        <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col p-0 bg-card text-card-foreground">
          {!showMainConfirmation ? (
            <>
              <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                  <Edit className="mr-2 h-5 w-5 text-accent"/>Manage Verification: {request.userName}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">
                  Request ID: <span className="font-mono text-xs">{request.id.substring(0,8)}...</span>
                  {request.listingId && ` | Listing: ${request.listingTitle || request.listingId.substring(0,8)}...`}
                </DialogDescription>
                <div className="flex items-center gap-2 mt-2">
                  <span className="text-sm text-muted-foreground">Role:</span>
                  <Badge variant="outline" className="capitalize text-xs">{request.userRole}</Badge>
                </div>

                {/* User Contact Information Section */}
                <div className="mt-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-md border border-blue-200 dark:border-blue-800">
                  <h4 className="text-sm font-medium text-blue-900 dark:text-blue-100 mb-2 flex items-center">
                    <UserCircle className="h-4 w-4 mr-1" />
                    Contact Information & Preferences
                  </h4>
                  <div className="grid sm:grid-cols-2 gap-3 text-xs">
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-200">Phone:</span>
                      <span className="ml-1 text-blue-700 dark:text-blue-300">
                        {request.phoneNumber || request.userPhone || 'Not provided'}
                      </span>
                    </div>
                    <div>
                      <span className="font-medium text-blue-800 dark:text-blue-200">Best time to call:</span>
                      <span className="ml-1 text-blue-700 dark:text-blue-300">
                        {request.bestTimeToCall || 'No preference'}
                      </span>
                    </div>
                  </div>
                  {request.userNotes && (
                    <div className="mt-2">
                      <span className="font-medium text-blue-800 dark:text-blue-200">User Notes:</span>
                      <p className="text-blue-700 dark:text-blue-300 text-xs mt-1 whitespace-pre-wrap">{request.userNotes}</p>
                    </div>
                  )}
                </div>
              </DialogHeader>

              <div className="grid md:grid-cols-2 gap-6 p-6 flex-grow overflow-y-auto">
                {/* Left Column: Statuses and New Note */}
                <div className="space-y-6 flex flex-col">
                  <div>
                    <Label className="text-sm font-medium text-foreground">Operational Status</Label>
                    <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-xs text-muted-foreground">Current:</span>
                        <OperationalStatusBadge status={request.operationalStatus} />
                    </div>
                    <Select value={selectedOperationalStatus} onValueChange={(value) => setSelectedOperationalStatus(value as VerificationQueueStatus)}>
                      <SelectTrigger id="operationalStatus" className="h-9 text-sm bg-background border-input"><SelectValue placeholder="Select new operational status" /></SelectTrigger>
                      <SelectContent>{operationalStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label className="text-sm font-medium text-foreground">Profile Status</Label>
                     <div className="flex items-center gap-2 mt-1 mb-2">
                        <span className="text-xs text-muted-foreground">Current:</span>
                        <ProfileStatusBadge status={request.profileStatus} />
                    </div>
                    <Select value={selectedProfileStatus} onValueChange={(value) => setSelectedProfileStatus(value as VerificationStatus)}>
                      <SelectTrigger id="profileStatus" className="h-9 text-sm bg-background border-input"><SelectValue placeholder="Select new profile status" /></SelectTrigger>
                      <SelectContent>{profileStatusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5 flex-grow flex flex-col">
                    <Label htmlFor="newAdminNoteText" className="text-sm font-medium text-foreground">Add New Internal Note</Label>
                    <Textarea
                      id="newAdminNoteText"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-grow text-sm min-h-[120px] sm:min-h-[150px] bg-muted/50 focus:ring-accent border-input"
                      placeholder="Type a new internal note for this request..."
                    />
                  </div>
                </div>

                {/* Right Column: Note History */}
                <div className="space-y-2 flex flex-col overflow-hidden">
                  <Label className="text-sm font-medium text-foreground">Notes History ({currentAdminNotes.length})</Label>
                  {currentAdminNotes.length > 0 ? (
                    <ScrollArea className="border rounded-md p-3 h-80 sm:h-[calc(100%-2rem)] bg-muted/30 flex-grow">
                      <div className="space-y-3">
                        {currentAdminNotes.slice().reverse().map(note => (
                          <div key={note.id} className="text-xs p-2.5 border rounded-md bg-background shadow-sm relative group">
                            <p className="whitespace-pre-wrap mb-1.5 text-foreground/90 text-[13px]">{note.note}</p>
                            <div className="text-muted-foreground/80 text-[0.7rem] flex flex-wrap gap-x-2 gap-y-0.5 items-center border-t pt-1.5 mt-1.5">
                              <span><UserCircle className="inline h-3 w-3 mr-0.5" /> {note.adminName || note.adminId}</span>
                              <span>@ {new Date(note.timestamp).toLocaleString([], {dateStyle: 'short', timeStyle: 'short'})}</span>
                              <div className="flex items-center gap-1">
                                <span>Ops:</span>
                                <OperationalStatusBadge status={note.operationalStatusAtTimeOfNote} />
                              </div>
                              <div className="flex items-center gap-1">
                                <span>Profile:</span>
                                <ProfileStatusBadge status={note.profileStatusAtTimeOfNote} />
                              </div>
                            </div>
                             <Button variant="ghost" size="icon" className="absolute top-1 right-1 h-6 w-6 text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => handleOpenDeleteNoteDialog(note.id)} title="Delete this note">
                                <Trash2 className="h-3.5 w-3.5"/>
                              </Button>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="border rounded-md p-3 h-80 sm:h-[calc(100%-2rem)] bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
                      No internal notes recorded yet.
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter className="p-6 border-t">
                <Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button>
                <Button type="button" onClick={handleAttemptSave} disabled={!hasAnyChange || !selectedOperationalStatus || !selectedProfileStatus} className="bg-primary text-primary-foreground hover:bg-primary/90">
                  Review & Save Changes
                </Button>
              </DialogFooter>
            </>
          ) : (
            <>
              <DialogHeader className="p-6 border-b">
                <DialogTitle className="text-xl font-semibold text-foreground flex items-center">
                    <Info className="mr-2 h-5 w-5 text-accent"/>Confirm Changes for {request.userName}
                </DialogTitle>
                <DialogDescription className="text-sm text-muted-foreground">Please review the changes before saving.</DialogDescription>
              </DialogHeader>
              <div className="p-6 space-y-4 text-sm max-h-[60vh] overflow-y-auto">
                {operationalStatusChanged && (
                  <div>
                    <strong>Operational Status:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <OperationalStatusBadge status={initialRequestStateRef.current!.operationalStatus!} />
                      <span>&rarr;</span>
                      <OperationalStatusBadge status={selectedOperationalStatus!} />
                    </div>
                  </div>
                )}
                {profileStatusChanged && (
                  <div>
                    <strong>Profile Status:</strong>
                    <div className="flex items-center gap-2 mt-1">
                      <ProfileStatusBadge status={initialRequestStateRef.current!.profileStatus!} />
                      <span>&rarr;</span>
                      <ProfileStatusBadge status={selectedProfileStatus!} />
                    </div>
                  </div>
                )}
                {newNoteAdded && (
                  <div>
                    <p><strong>New Note to Add:</strong></p>
                    <p className="text-muted-foreground p-3 border rounded bg-muted/40 whitespace-pre-wrap text-xs">{newNoteText.trim()}</p>
                    <p className="text-xs text-muted-foreground mt-1">(Will be saved with statuses: Ops: {selectedOperationalStatus}, Profile: {selectedProfileStatus})</p>
                  </div>
                )}
                {notesChanged && !newNoteAdded && (JSON.stringify(currentAdminNotes) !== JSON.stringify(initialRequestStateRef.current?.adminNotes || [])) && (
                     <p className="text-yellow-700 bg-yellow-100 border-yellow-200 p-2 rounded border"><AlertTriangle className="inline h-4 w-4 mr-1"/>Notes history will be updated (e.g., notes deleted).</p>
                )}
                {!hasAnyChange && <p className="text-muted-foreground">No changes were detected.</p>}
              </div>
              <DialogFooter className="p-6 border-t">
                <Button type="button" variant="outline" onClick={() => setShowMainConfirmation(false)}>Back to Edit</Button>
                <Button type="button" onClick={handleConfirmSave} className="bg-accent text-accent-foreground hover:bg-accent/90">Confirm & Save All Changes</Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteNoteDialogOpen} onOpenChange={setIsDeleteNoteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Admin Note?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to permanently delete this note? This action cannot be undone once changes are saved.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setNoteToDeleteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmDeleteNote} className="bg-destructive hover:bg-destructive/90">Delete Note</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

