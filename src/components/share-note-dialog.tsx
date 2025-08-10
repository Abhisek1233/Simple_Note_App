'use client';

import { useState, useEffect } from 'react';
import { type Note, type SharedUser } from '@/lib/types';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { X, UserPlus, Trash2 } from 'lucide-react';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { db } from '@/lib/firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

interface ShareNoteDialogProps {
  note: Note;
  isOpen: boolean;
  onClose: () => void;
  onUpdateSharing: (noteId: string, sharedWith: SharedUser[]) => void;
}

const sendShareInvitation = (email: string, noteTitle: string) => {
    // In a real application, you would use a backend service to send an email.
    // For example, you could call a Firebase Cloud Function here.
    console.log(`Simulating: Sending invitation email to ${email} for note: "${noteTitle}"`);
    const appUrl = window.location.origin;
    console.log(`Share link (simulated): ${appUrl}`);
    // Example of email body:
    // `You have been invited to collaborate on the note "${noteTitle}". Click here to view: ${appUrl}`
};


export function ShareNoteDialog({ note, isOpen, onClose, onUpdateSharing }: ShareNoteDialogProps) {
  const { toast } = useToast();
  const [email, setEmail] = useState('');
  const [sharedUsers, setSharedUsers] = useState<SharedUser[]>([]);

  useEffect(() => {
    if (note?.sharedWith) {
      setSharedUsers(note.sharedWith);
    } else {
        setSharedUsers([]);
    }
  }, [note]);

  const handleAddUser = async () => {
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast({ title: 'Invalid Email', description: 'Please enter a valid email address.', variant: 'destructive' });
      return;
    }
    if (sharedUsers.some(u => u.email === email)) {
        toast({ title: 'User Already Added', description: 'This user already has access to the note.', variant: 'destructive' });
        return;
    }

    try {
        const usersRef = collection(db, "users");
        const q = query(usersRef, where("email", "==", email));
        const querySnapshot = await getDocs(q);

        let newSharedUser: SharedUser;

        if (querySnapshot.empty) {
            newSharedUser = {
                uid: `pending-${new Date().getTime()}`,
                email: email,
                role: 'viewer'
            };
            sendShareInvitation(email, note.title);
            toast({
                title: 'Invitation Sent',
                description: `An invitation has been simulated for ${email}. They can access the note after signing up.`
            });
        } else {
            const userDoc = querySnapshot.docs[0];
            newSharedUser = {
                uid: userDoc.id,
                email: userDoc.data().email,
                role: 'viewer'
            };
        }
        
        if (sharedUsers.some(u => u.email === newSharedUser.email)) {
             toast({ title: 'User Already Added', description: 'This user already has access to the note.', variant: 'destructive' });
             return;
        }

        setSharedUsers(prev => [...prev, newSharedUser]);
        setEmail('');

    } catch (error) {
        console.error("Error finding user:", error);
        toast({ title: 'Error', description: 'Could not add user. Please try again.', variant: 'destructive' });
    }
  };

  const handleRemoveUser = (uid: string) => {
    setSharedUsers(prev => prev.filter(u => u.uid !== uid));
  };

  const handleRoleChange = (uid: string, role: 'viewer' | 'editor') => {
    setSharedUsers(prev => prev.map(u => u.uid === uid ? { ...u, role } : u));
  };
  
  const handleSaveChanges = () => {
    onUpdateSharing(note.id, sharedUsers);
    onClose();
  }

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Share "{note.title}"</DialogTitle>
          <DialogDescription>
            Manage who has access to this note.
          </DialogDescription>
        </DialogHeader>
        
        <div className="flex gap-2">
            <Input 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="person@example.com"
            />
            <Button onClick={handleAddUser}><UserPlus className="mr-2 h-4 w-4" /> Add</Button>
        </div>

        <div className="space-y-2 max-h-60 overflow-y-auto">
            {sharedUsers.map(user => (
                <div key={user.uid} className="flex items-center justify-between p-2 rounded-md border">
                    <div className="flex items-center gap-2">
                         <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${user.email}`} alt={user.email} />
                            <AvatarFallback>{user.email.charAt(0).toUpperCase()}</AvatarFallback>
                        </Avatar>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium">{user.email}</span>
                            {user.uid.startsWith('pending-') && <span className="text-xs text-muted-foreground">Pending invitation</span>}
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Select value={user.role} onValueChange={(role: 'viewer' | 'editor') => handleRoleChange(user.uid, role)}>
                            <SelectTrigger className="w-[120px]">
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="editor">Can edit</SelectItem>
                                <SelectItem value="viewer">Can view</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="ghost" size="icon" onClick={() => handleRemoveUser(user.uid)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                    </div>
                </div>
            ))}
        </div>

        <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleSaveChanges}>Save Changes</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
