
'use client';

import { useState, useEffect, useCallback } from 'react';
import { v4 as uuidv4 } from 'uuid';
import { type Note, type SharedUser } from '@/lib/types';
import { useToast } from '@/hooks/use-toast';
import { db } from '@/lib/firebase';
import {
  collection,
  query,
  where,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  writeBatch,
  serverTimestamp,
  or,
  getDoc,
} from 'firebase/firestore';

const NOTES_STORAGE_KEY = 'simple-notes-app-storage';

export const useNotes = (userId?: string) => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();
  const isCloudSync = !!userId;

  // Effect for loading notes from Firestore or localStorage
  useEffect(() => {
    if (!isCloudSync) {
      try {
          const storedNotes = localStorage.getItem(NOTES_STORAGE_KEY);
          setNotes(storedNotes ? JSON.parse(storedNotes) : []);
      } catch (error) {
          console.error('Failed to load notes from localStorage', error);
      } finally {
          setIsLoading(false);
      }
      return;
    }

    setIsLoading(true);
    const q = query(
      collection(db, 'notes'),
      or(
          where('userId', '==', userId),
          where('sharedWithUids', 'array-contains', userId)
      )
    );
    
    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const notesData: Note[] = querySnapshot.docs.map(doc => {
          const data = doc.data({ serverTimestamps: 'estimate' }); // Use estimate to get temporary date on optimistic updates
          return {
              ...data,
              id: doc.id,
              createdAt: data.createdAt?.toDate().toISOString(),
              updatedAt: data.updatedAt?.toDate().toISOString(),
              userId: data.userId,
              sharedWith: data.sharedWith || [],
              isOwner: data.userId === userId,
          } as Note;
        });
        
        setNotes(notesData.sort((a, b) => {
            const dateA = a.updatedAt ? new Date(a.updatedAt).getTime() : 0;
            const dateB = b.updatedAt ? new Date(b.updatedAt).getTime() : 0;
            return dateB - dateA;
        }));
        setIsLoading(false);
      },
      (error) => {
        console.error('Error fetching notes from Firestore:', error);
        toast({
          title: 'Error',
          description: 'Could not load your notes from the cloud.',
          variant: 'destructive',
        });
        setIsLoading(false);
      }
    );
    
    return () => unsubscribe();

  }, [isCloudSync, userId, toast]);

  // Effect for saving notes to localStorage when not signed in
  useEffect(() => {
    if (!isCloudSync && !isLoading) {
      localStorage.setItem(NOTES_STORAGE_KEY, JSON.stringify(notes));
    }
  }, [notes, isCloudSync, isLoading]);

  const addNote = useCallback(async (newNote: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isOwner'>) => {
      const noteWithMeta: Omit<Note, 'id'> = {
        ...newNote,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        userId: userId || 'local',
        isOwner: true,
        sharedWith: [],
        sharedWithUids: [],
        todos: newNote.todos || [],
        tags: newNote.tags || [],
        textOptions: newNote.textOptions || {},
      };

      if (!isCloudSync) {
        setNotes((prevNotes) => [{ ...noteWithMeta, id: uuidv4()}, ...prevNotes]);
        toast({
            title: 'Note Created',
            description: `"${noteWithMeta.title}" has been created.`,
        });
        return;
      }

      const firestoreData = {
        ...newNote,
        userId,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
        sharedWith: [],
        sharedWithUids: [],
      };
      
      try {
        await addDoc(collection(db, 'notes'), firestoreData);
        // The onSnapshot listener will handle updating the state with the server-confirmed note.
        toast({
            title: 'Note Created',
            description: `"${newNote.title}" has been created.`,
        });
      } catch (error) {
        console.error('Error adding note to Firestore:', error);
        // Snapshot listener will eventually correct the UI, but we can show an error
        throw error;
      }
    },
    [isCloudSync, userId, toast]
  );

  const updateNote = useCallback(async (updatedNote: Note) => {
      if (!isCloudSync) {
        setNotes((prevNotes) =>
          prevNotes.map((note) =>
            note.id === updatedNote.id ? { ...updatedNote, updatedAt: new Date().toISOString() } : note
          ).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
        );
        return;
      }
      
      // The onSnapshot listener will handle all UI updates, including optimistic ones.
      const { id, isOwner, createdAt, updatedAt, ...noteData } = updatedNote;
      try {
        const noteRef = doc(db, 'notes', id);
        await updateDoc(noteRef, {
          ...noteData,
          updatedAt: serverTimestamp(),
        });
        // onSnapshot listener will update the UI with the final state.
      } catch (error) {
        console.error('Error updating note in Firestore:', error);
        throw error;
      }
    },
    [isCloudSync]
  );

  const updateNoteSharing = useCallback(async (noteId: string, sharedWith: SharedUser[]) => {
    if (!isCloudSync) return;
    try {
        const noteRef = doc(db, 'notes', noteId);
        const sharedWithUids = sharedWith.filter(u => !u.uid.startsWith('pending-')).map(u => u.uid);
        await updateDoc(noteRef, {
            sharedWith,
            sharedWithUids,
            updatedAt: serverTimestamp(),
        });
        toast({
            title: "Sharing Updated",
            description: "Note sharing permissions have been updated."
        });
    } catch(error) {
        console.error("Error updating sharing settings", error);
        toast({ title: 'Error', description: 'Could not update sharing settings.', variant: 'destructive' });
    }
  }, [isCloudSync, toast]);

  const deleteNote = useCallback(async (noteId: string) => {
      const noteToDelete = notes.find((n) => n.id === noteId);
      if (!noteToDelete) return;
      
      if (isCloudSync) {
        try {
          await deleteDoc(doc(db, 'notes', noteId));
        } catch (error) {
          console.error('Error deleting note from Firestore:', error);
          toast({ title: 'Error', description: 'Could not delete note.', variant: 'destructive' });
          return;
        }
      } else {
         setNotes((prevNotes) => prevNotes.filter((note) => note.id !== noteId));
      }
       toast({
        title: 'Note Deleted',
        description: `"${noteToDelete.title}" has been deleted.`,
      });
    },
    [isCloudSync, notes, toast]
  );
  
  const importNotes = useCallback(async (file: File) => {
    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const content = e.target?.result;
        if (typeof content !== 'string') throw new Error('Invalid file content');
        let importedNotes: Partial<Note>[] = JSON.parse(content);

        if (!Array.isArray(importedNotes)) throw new Error('Invalid JSON format');
        
        const notesWithDefaults: Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isOwner'| 'sharedWithUids'>[] = importedNotes.map(note => ({
            title: note.title || 'Untitled',
            content: note.content || '',
            tags: note.tags || [],
            todos: note.todos || [],
            textOptions: note.textOptions || {},
            sharedWith: [],
        }));

        if (isCloudSync) {
            const batch = writeBatch(db);
            notesWithDefaults.forEach(note => {
                const docRef = doc(collection(db, 'notes'));
                batch.set(docRef, { 
                    ...note, 
                    userId, 
                    createdAt: serverTimestamp(),
                    updatedAt: serverTimestamp(),
                    sharedWith: [],
                    sharedWithUids: [],
                });
            });
            await batch.commit();
        } else {
            const notesToStore: Note[] = notesWithDefaults.map(note => ({
                ...note,
                id: uuidv4(),
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString(),
                userId: 'local',
                isOwner: true,
            }));
            setNotes(prev => [...notesToStore, ...prev]);
        }

        toast({
          title: 'Import Successful',
          description: `${notesWithDefaults.length} notes have been imported.`,
        });
      } catch (error) {
        console.error('Failed to import notes', error);
        toast({
          title: 'Import Failed',
          description: 'The selected file is not a valid notes JSON file.',
          variant: 'destructive',
        });
      }
    };
    reader.onerror = () => {
        toast({
            title: 'Import Failed',
            description: 'Could not read the selected file.',
            variant: 'destructive',
          });
    };
    reader.readAsText(file);
  }, [toast, isCloudSync, userId]);


  const exportNotes = useCallback(() => {
    if (notes.length === 0) {
      toast({
        title: 'Export Failed',
        description: 'There are no notes to export.',
        variant: 'destructive'
      });
      return;
    }
    const exportedData = notes.map(({userId, isOwner, sharedWith, sharedWithUids, ...rest}) => rest);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(exportedData, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `simple-notes-export-${new Date().toISOString()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
    toast({
      title: 'Export Successful',
      description: 'Your notes have been exported to a JSON file.',
    });
  }, [notes, toast]);

  return { notes, isLoading, addNote, updateNote, deleteNote, importNotes, exportNotes, isCloudSync, updateNoteSharing };
};
