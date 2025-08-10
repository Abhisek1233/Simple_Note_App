'use client';

import { MoreHorizontal, Trash2, Edit, Tag, UserPlus } from 'lucide-react';
import { format, isValid } from 'date-fns';
import { type Note, type Todo, type SharedUser } from '@/lib/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Badge } from '@/components/ui/badge';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import React, { useState } from 'react';
import { ShareNoteDialog } from './share-note-dialog';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';

interface NoteCardProps {
  note: Note;
  onEdit: (note: Note) => void;
  onDelete: (noteId: string) => void;
  onUpdate: (note: Note) => void;
  onUpdateSharing: (noteId: string, sharedWith: SharedUser[]) => void;
}

export function NoteCard({ note, onEdit, onDelete, onUpdate, onUpdateSharing }: NoteCardProps) {
  const { user } = useFirebaseAuth();
  const [isShareOpen, setIsShareOpen] = useState(false);
  const contentPreview = note.content.substring(0, 200) + (note.content.length > 200 ? '...' : '');

  const canEdit = note.isOwner || note.sharedWith?.find(u => u.uid === user?.uid)?.role === 'editor';

  const handleTodoToggle = (todoId: string) => {
    if (!canEdit) return;
    const updatedTodos = note.todos.map(todo =>
      todo.id === todoId ? { ...todo, completed: !todo.completed } : todo
    );
    onUpdate({ ...note, todos: updatedTodos });
  };

  const textStyle = {
    fontFamily: note.textOptions?.fontFamily || 'inherit',
    textAlign: note.textOptions?.textAlign || 'left',
    color: note.textOptions?.textColor || 'inherit',
    backgroundColor: note.textOptions?.highlightColor || 'transparent',
  } as React.CSSProperties;
  
  const updatedAtDate = new Date(note.updatedAt);

  return (
    <Card className="flex flex-col h-full break-inside-avoid-column transition-all hover:shadow-lg">
      <CardHeader>
        <div className="flex items-start justify-between gap-4">
          <CardTitle className="font-semibold text-lg">{note.title}</CardTitle>
          <AlertDialog>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {canEdit && (
                    <DropdownMenuItem onClick={() => onEdit(note)}>
                        <Edit className="mr-2 h-4 w-4" />
                        <span>Edit</span>
                    </DropdownMenuItem>
                )}
                {note.isOwner && (
                    <>
                        <DropdownMenuItem onClick={() => setIsShareOpen(true)}>
                            <UserPlus className="mr-2 h-4 w-4" />
                            <span>Share</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <AlertDialogTrigger asChild>
                            <DropdownMenuItem className="text-destructive focus:text-destructive">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span>Delete</span>
                            </DropdownMenuItem>
                        </AlertDialogTrigger>
                    </>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Are you sure?</AlertDialogTitle>
                <AlertDialogDescription>
                  This action cannot be undone. This will permanently delete your note titled "{note.title}".
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => onDelete(note.id)}>Delete</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </CardHeader>
      <CardContent className="flex-grow">
        {note.content && (
            <p style={textStyle} className="text-sm text-muted-foreground whitespace-pre-wrap rounded-md p-2">
                {contentPreview}
            </p>
        )}

        {note.todos && note.todos.length > 0 && (
          <div className="mt-4 space-y-2">
            {note.todos.map(todo => (
              <div key={todo.id} className="flex items-center gap-2">
                <Checkbox
                  id={`todo-${note.id}-${todo.id}`}
                  checked={todo.completed}
                  onCheckedChange={() => handleTodoToggle(todo.id)}
                  disabled={!canEdit}
                />
                <label
                  htmlFor={`todo-${note.id}-${todo.id}`}
                  className={cn(
                    'text-sm flex-grow',
                    todo.completed ? 'line-through text-muted-foreground' : 'text-foreground',
                    !canEdit ? 'cursor-not-allowed' : ''
                  )}
                >
                  {todo.text}
                </label>
              </div>
            ))}
          </div>
        )}

        {note.tags && note.tags.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {note.tags.map((tag, index) => (
              <Badge key={index} variant="secondary">
                <Tag className="mr-1 h-3 w-3" />
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </CardContent>
      <CardFooter className="flex justify-between items-center">
        <CardDescription>
          {isValid(updatedAtDate) ? `Updated: ${format(updatedAtDate, 'PPp')}` : 'Updating...'}
        </CardDescription>
        {note.sharedWith && note.sharedWith.length > 0 && (
            <div className="flex items-center -space-x-2">
                {note.sharedWith.slice(0, 3).map(person => (
                    <Avatar key={person.uid} className="h-6 w-6 border-2 border-background">
                        <AvatarImage src={`https://api.dicebear.com/8.x/initials/svg?seed=${person.email}`} alt={person.email} />
                        <AvatarFallback>{person.email.charAt(0).toUpperCase()}</AvatarFallback>
                    </Avatar>
                ))}
                {note.sharedWith.length > 3 && (
                    <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center text-xs font-bold border-2 border-background">
                        +{note.sharedWith.length - 3}
                    </div>
                )}
            </div>
        )}
      </CardFooter>
       <ShareNoteDialog 
        isOpen={isShareOpen}
        onClose={() => setIsShareOpen(false)}
        note={note}
        onUpdateSharing={onUpdateSharing}
       />
    </Card>
  );
}
