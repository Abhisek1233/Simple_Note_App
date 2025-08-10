'use client';

import { useState, useMemo } from 'react';
import { Plus, LogIn } from 'lucide-react';
import { useNotes } from '@/hooks/use-notes-store';
import { type Note, type SharedUser } from '@/lib/types';
import { Header } from '@/components/header';
import { NoteCard } from '@/components/note-card';
import { NoteEditor } from '@/components/note-editor';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { signInWithGoogle } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';

export default function HomePage() {
  const { user, loading: authLoading } = useFirebaseAuth();
  const {
    notes,
    isLoading: notesLoading,
    addNote,
    updateNote,
    deleteNote,
    importNotes,
    exportNotes,
    isCloudSync,
    updateNoteSharing,
  } = useNotes(user?.uid);
  const { toast } = useToast();

  const [searchQuery, setSearchQuery] = useState('');
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [isEditorOpen, setIsEditorOpen] = useState(false);

  const isLoading = authLoading || (isCloudSync && notesLoading);

  const filteredNotes = useMemo(() => {
    if (!searchQuery) return notes;
    return notes.filter(
      (note) =>
        note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        note.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (note.tags && note.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))) ||
        (note.todos && note.todos.some(todo => todo.text.toLowerCase().includes(searchQuery.toLowerCase())))
    );
  }, [notes, searchQuery]);

  const handleAddNew = () => {
    if (!user && isCloudSync) {
        signInWithGoogle();
        return;
    }
    setEditingNote(null);
    setIsEditorOpen(true);
  };

  const handleEdit = (note: Note) => {
    setEditingNote(note);
    setIsEditorOpen(true);
  };

  const handleSaveNote = async (noteData: Note | Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isOwner'>) => {
    try {
      if ('id' in noteData) {
        await updateNote(noteData as Note);
      } else {
        await addNote(noteData);
      }
    } catch (error) {
       toast({
          title: 'Error Saving Note',
          description: 'There was a problem saving your note. Please try again.',
          variant: 'destructive',
        });
    }
  };
  
  const handleUpdateNote = (note: Note) => {
    updateNote(note);
  };

  const handleUpdateSharing = (noteId: string, sharedWith: SharedUser[]) => {
    updateNoteSharing(noteId, sharedWith);
  };


  const renderNoteGrid = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex flex-col gap-2 p-4 rounded-lg bg-card">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-6 w-1/2" />
            </div>
          ))}
        </div>
      );
    }
    
    if (!authLoading && !user) {
        return (
            <div className="text-center py-20">
                <h2 className="text-2xl font-semibold">Welcome to Simple Note</h2>
                <p className="text-muted-foreground mt-2">Sign in to create, save, and sync your notes across devices, or continue offline.</p>
                <Button onClick={signInWithGoogle} className="mt-4">
                    <LogIn className="mr-2 h-4 w-4" />
                    Sign in with Google
                </Button>
            </div>
        );
    }

    if (filteredNotes.length === 0) {
      return (
        <div className="text-center py-20">
          <h2 className="text-2xl font-semibold">No notes found</h2>
          <p className="text-muted-foreground mt-2">
            {searchQuery ? 'Try a different search term' : 'Create your first note to get started!'}
          </p>
          {!searchQuery && (
            <Button onClick={handleAddNew} className="mt-4">
              <Plus className="mr-2 h-4 w-4" />
              Create Note
            </Button>
          )}
        </div>
      );
    }

    return (
        <div className="columns-1 sm:columns-2 md:columns-3 lg:grid-cols-4 xl:columns-5 gap-4 space-y-4">
            {filteredNotes.map((note) => (
                <NoteCard
                    key={note.id}
                    note={note}
                    onEdit={handleEdit}
                    onDelete={deleteNote}
                    onUpdate={handleUpdateNote}
                    onUpdateSharing={handleUpdateSharing}
                />
            ))}
        </div>
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header
        onSearch={setSearchQuery}
        onAddNew={handleAddNew}
        onImport={importNotes}
        onExport={exportNotes}
      />
      <main className="flex-grow container py-8">
        {renderNoteGrid()}
      </main>
      <NoteEditor
        isOpen={isEditorOpen}
        onClose={() => setIsEditorOpen(false)}
        note={editingNote}
        onSave={handleSaveNote}
      />
      <div className="md:hidden fixed bottom-6 right-6 z-20">
          <Button onClick={handleAddNew} size="icon" className="h-14 w-14 rounded-full shadow-lg">
              <Plus className="h-6 w-6" />
              <span className="sr-only">New Note</span>
          </Button>
      </div>
    </div>
  );
}
