
'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
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
import { Input } from "@/components/ui/input";
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import type { VerificationRequestItem, VerificationStatus, VerificationQueueStatus, AdminNote } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { Trash2, Edit, UserCircle } from 'lucide-react';

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
        adminNotes: [...(request.adminNotes || [])], // Deep copy for comparison
      };
      setSelectedOperationalStatus(request.operationalStatus);
      setSelectedProfileStatus(request.profileStatus);
      setCurrentAdminNotes([...(request.adminNotes || [])]); // Deep copy for local modification
      setNewNoteText('');
    } else {
        initialRequestStateRef.current = null; // Reset when dialog is closed or no request
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
        adminId: 'current_admin_placeholder', // Replace with actual admin ID
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
      toast({ title: "Note Deleted", description: "The note has been marked for deletion. Save changes to confirm." });
    }
    setIsDeleteNoteDialogOpen(false);
    setNoteToDeleteId(null);
  };
  
  const handleCancel = () => {
    if (initialRequestStateRef.current) {
        setSelectedOperationalStatus(initialRequestStateRef.current.operationalStatus);
        setSelectedProfileStatus(initialRequestStateRef.current.profileStatus);
        setCurrentAdminNotes([...(initialRequestStateRef.current.adminNotes || [])]);
    }
    setNewNoteText('');
    setShowMainConfirmation(false);
    onOpenChange(false);
  };

  const operationalStatusOptions: VerificationQueueStatus[] = ["New Request", "Contacted", "Docs Under Review", "More Info Requested", "Approved", "Rejected"];
  const profileStatusOptions: VerificationStatus[] = ['anonymous', 'pending_verification', 'verified', 'rejected'];

  const getStatusBadge = (status: VerificationStatus | VerificationQueueStatus, type: 'profile' | 'operational') => {
    if (type === 'profile') {
      switch (status) {
        case 'verified': return <Badge className="bg-green-100 text-green-700 text-xs">Verified</Badge>;
        case 'pending_verification': return <Badge variant="secondary" className="bg-yellow-100 text-yellow-700 text-xs">Pending</Badge>;
        case 'rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
        default: return <Badge variant="outline" className="text-xs capitalize">{status.replace('_', ' ')}</Badge>;
      }
    } else { // operational
       switch (status as VerificationQueueStatus) {
        case 'New Request': return <Badge variant="outline" className="text-xs">New Request</Badge>;
        case 'Contacted': return <Badge className="bg-blue-100 text-blue-700 text-xs">Contacted</Badge>;
        case 'Docs Under Review': return <Badge className="bg-purple-100 text-purple-700 text-xs">Docs Review</Badge>;
        case 'More Info Requested': return <Badge className="bg-orange-100 text-orange-700 text-xs">More Info Req.</Badge>;
        case 'Approved': return <Badge className="bg-green-100 text-green-700 text-xs">Approved</Badge>;
        case 'Rejected': return <Badge variant="destructive" className="text-xs">Rejected</Badge>;
        default: return <Badge className="text-xs">{status}</Badge>;
      }
    }
  };

  return (
    <>
      <Dialog open={isOpen} onOpenChange={(open) => { if (!open) handleCancel(); else onOpenChange(true);}}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] flex flex-col">
          {!showMainConfirmation ? (
            <>
              <DialogHeader>
                <DialogTitle>Manage Verification: {request.userName}</DialogTitle>
                <DialogDescription>
                  User Role: {request.userRole}. Request ID: {request.id.substring(0,8)}...
                  {request.listingId && ` Listing: ${request.listingTitle || request.listingId.substring(0,8)}...`}
                </DialogDescription>
              </DialogHeader>
              <div className="grid md:grid-cols-2 gap-x-6 gap-y-4 py-4 flex-grow overflow-hidden">
                {/* Left Column: Statuses and New Note */}
                <div className="space-y-4 flex flex-col">
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="current-ops-status" className="text-right text-xs">Current Ops</Label>
                    <Input id="current-ops-status" value={request.operationalStatus} disabled className="col-span-2 h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="operationalStatus" className="text-right text-xs">New Ops Status</Label>
                    <Select value={selectedOperationalStatus} onValueChange={(value) => setSelectedOperationalStatus(value as VerificationQueueStatus)}>
                      <SelectTrigger id="operationalStatus" className="col-span-2 h-8 text-xs"><SelectValue placeholder="Select ops status" /></SelectTrigger>
                      <SelectContent>{operationalStatusOptions.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="current-profile-status" className="text-right text-xs">Current Profile</Label>
                    <Input id="current-profile-status" value={request.profileStatus} disabled className="col-span-2 h-8 text-xs" />
                  </div>
                  <div className="grid grid-cols-3 items-center gap-3">
                    <Label htmlFor="profileStatus" className="text-right text-xs">New Profile Status</Label>
                    <Select value={selectedProfileStatus} onValueChange={(value) => setSelectedProfileStatus(value as VerificationStatus)}>
                      <SelectTrigger id="profileStatus" className="col-span-2 h-8 text-xs"><SelectValue placeholder="Select profile status" /></SelectTrigger>
                      <SelectContent>{profileStatusOptions.map(s => <SelectItem key={s} value={s} className="capitalize">{s.replace('_', ' ')}</SelectItem>)}</SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1.5 flex-grow flex flex-col">
                    <Label htmlFor="newAdminNoteText">Add New Note</Label>
                    <Textarea
                      id="newAdminNoteText"
                      value={newNoteText}
                      onChange={(e) => setNewNoteText(e.target.value)}
                      className="flex-grow text-xs min-h-[100px]"
                      placeholder="Type a new internal note..."
                    />
                  </div>
                </div>

                {/* Right Column: Note History */}
                <div className="space-y-2 flex flex-col overflow-hidden">
                  <Label>Notes History ({currentAdminNotes.length})</Label>
                  {currentAdminNotes.length > 0 ? (
                    <ScrollArea className="border rounded-md p-3 h-72 bg-muted/30 flex-grow">
                      <div className="space-y-3">
                        {currentAdminNotes.slice().reverse().map(note => ( // Display newest first
                          <div key={note.id} className="text-xs p-2.5 border rounded-md bg-background shadow-sm">
                            <p className="whitespace-pre-wrap mb-1">{note.note}</p>
                            <div className="text-muted-foreground/80 text-[0.7rem] flex flex-wrap gap-x-2 gap-y-0.5 items-center">
                              <span><UserCircle className="inline h-3 w-3 mr-0.5" /> {note.adminName || note.adminId}</span>
                              <span>@ {new Date(note.timestamp).toLocaleString()}</span>
                              <span>Ops: {getStatusBadge(note.operationalStatusAtTimeOfNote, 'operational')}</span>
                              <span>Profile: {getStatusBadge(note.profileStatusAtTimeOfNote, 'profile')}</span>
                              <Button variant="ghost" size="icon" className="h-5 w-5 ml-auto text-destructive hover:bg-destructive/10" onClick={() => handleOpenDeleteNoteDialog(note.id)}>
                                <Trash2 className="h-3 w-3"/>
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </ScrollArea>
                  ) : (
                    <div className="border rounded-md p-3 h-72 bg-muted/30 flex items-center justify-center text-sm text-muted-foreground">
                      No notes yet.
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild><Button type="button" variant="outline" onClick={handleCancel}>Cancel</Button></DialogClose>
                <Button type="button" onClick={handleAttemptSave} disabled={!hasAnyChange || !selectedOperationalStatus || !selectedProfileStatus}>
                  Review & Save Changes
                </Button>
              </DialogFooter>
            </>
          ) : ( // Show Confirmation View
            <>
              <DialogHeader>
                <DialogTitle>Confirm Status & Note Changes</DialogTitle>
                <DialogDescription>Review the changes before saving.</DialogDescription>
              </DialogHeader>
              <div className="py-4 space-y-3 text-sm max-h-[60vh] overflow-y-auto">
                {operationalStatusChanged && (
                  <p><strong>Operational Status:</strong> <span className="text-muted-foreground line-through">{initialRequestStateRef.current?.operationalStatus}</span> &rarr; <span className="text-primary font-semibold">{selectedOperationalStatus}</span></p>
                )}
                {profileStatusChanged && (
                   <p><strong>Profile Status:</strong> <span className="text-muted-foreground line-through">{initialRequestStateRef.current?.profileStatus}</span> &rarr; <span className="text-primary font-semibold">{selectedProfileStatus}</span></p>
                )}
                {newNoteAdded && (
                  <div>
                    <p><strong>New Note to Add:</strong></p>
                    <p className="text-muted-foreground p-2 border rounded bg-muted/50 whitespace-pre-wrap">{newNoteText.trim()}</p>
                    <p className="text-xs text-muted-foreground">(With statuses: Ops: {selectedOperationalStatus}, Profile: {selectedProfileStatus})</p>
                  </div>
                )}
                {notesChanged && !newNoteAdded && (JSON.stringify(currentAdminNotes) !== JSON.stringify(initialRequestStateRef.current?.adminNotes || [])) && (
                     <p>Admin notes history will be updated (e.g., notes deleted).</p>
                )}
                {!hasAnyChange && <p>No changes detected.</p>}
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setShowMainConfirmation(false)}>Back to Edit</Button>
                <Button type="button" onClick={handleConfirmSave} className="bg-primary text-primary-foreground">Confirm & Save All</Button>
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
              Are you sure you want to delete this note? This action cannot be undone after saving the main changes.
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
