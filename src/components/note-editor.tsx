'use client';

import { useState, useEffect } from 'react';
import { useForm, Controller, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { type Note, type TextOptions } from '@/lib/types';
import { generateNoteTags } from '@/ai/flows/generate-note-tags';
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
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Loader2, Tag, Wand2, X, Plus, Trash2, Palette, Pilcrow, CaseSensitive, Baseline } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useTextOptions } from '@/hooks/use-text-options';

const todoSchema = z.object({
  id: z.string(),
  text: z.string().min(1, 'Todo text cannot be empty'),
  completed: z.boolean(),
});

const textOptionsSchema = z.object({
  fontFamily: z.string().optional(),
  textAlign: z.enum(['left', 'center', 'right', 'justify']).optional(),
  textColor: z.string().optional(),
  highlightColor: z.string().optional(),
});

const noteSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100),
  content: z.string(),
  tags: z.array(z.string()),
  todos: z.array(todoSchema),
  textOptions: textOptionsSchema.optional(),
});

type NoteFormData = z.infer<typeof noteSchema>;

interface NoteEditorProps {
  note: Note | null;
  isOpen: boolean;
  onClose: () => void;
  onSave: (note: Note | Omit<Note, 'id' | 'createdAt' | 'updatedAt' | 'userId' | 'isOwner'>) => Promise<void>;
}

const ColorButton = ({ color, onClick, active }: { color: string, onClick: (color: string) => void, active: boolean }) => (
    <button type="button" onClick={() => onClick(color)} className={`w-6 h-6 rounded-full border ${active ? 'ring-2 ring-primary' : ''}`} style={{ backgroundColor: color }}/>
);

export function NoteEditor({ note, isOpen, onClose, onSave }: NoteEditorProps) {
  const { toast } = useToast();
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  
  const {
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<NoteFormData>({
    resolver: zodResolver(noteSchema),
    defaultValues: {
      title: '',
      content: '',
      tags: [],
      todos: [],
      textOptions: {
        fontFamily: 'Inter',
        textAlign: 'left',
        textColor: '#000000',
        highlightColor: 'transparent',
      }
    },
  });

  const { fields, append, remove } = useFieldArray({ control, name: "todos" });
  const textOptionsHook = useTextOptions(note?.textOptions);

  const currentTags = watch('tags');
  const noteContent = watch('content');
  const textOptions = watch('textOptions');

  useEffect(() => {
    if (isOpen) {
      if (note) {
        reset({ 
          title: note.title, 
          content: note.content, 
          tags: note.tags || [],
          todos: note.todos || [],
          textOptions: note.textOptions || textOptionsHook.options,
        });
        textOptionsHook.setOptions(note.textOptions || textOptionsHook.options);
      } else {
        reset({ title: '', content: '', tags: [], todos: [], textOptions: textOptionsHook.options });
        textOptionsHook.reset();
      }
    }
  }, [note, isOpen, reset]);

  useEffect(() => {
    setValue('textOptions', textOptionsHook.options);
  }, [textOptionsHook.options, setValue]);

  const handleSave = async (data: NoteFormData) => {
    if(data.content.trim() === '' && data.todos.length === 0) {
        toast({
            title: 'Empty Note',
            description: 'A note must have either content or a to-do list.',
            variant: 'destructive',
        });
        return;
    }
    
    // Immediately close the editor for a faster perceived experience
    onClose();
    const dataToSave = note ? { ...note, ...data } : data;
    await onSave(dataToSave);
  };

  const handleGenerateTags = async () => {
    if (!noteContent || noteContent.trim().length < 20) {
      toast({
        title: 'Content too short',
        description: 'Please write at least 20 characters to generate tags.',
        variant: 'destructive',
      });
      return;
    }

    setIsGeneratingTags(true);
    try {
      const result = await generateNoteTags({ noteContent });
      const newTags = Array.from(new Set([...currentTags, ...result.tags]));
      setValue('tags', newTags, { shouldValidate: true });
      toast({
        title: 'Tags Generated',
        description: 'AI has suggested some tags for your note.',
      });
    } catch (error) {
      console.error('Failed to generate tags:', error);
      toast({
        title: 'Error',
        description: 'Could not generate tags. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const textStyle = {
    fontFamily: textOptions?.fontFamily || 'inherit',
    textAlign: textOptions?.textAlign || 'left',
    color: textOptions?.textColor || 'inherit',
    backgroundColor: textOptions?.highlightColor || 'transparent',
  } as React.CSSProperties;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>{note ? 'Edit Note' : 'Create New Note'}</DialogTitle>
          <DialogDescription>
            {note ? 'Make changes to your note.' : 'Fill in the details for your new note.'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(handleSave)} className="flex-grow min-h-0 flex flex-col">
          <ScrollArea className="flex-grow pr-6">
            <div className="space-y-4 py-4">
              <div>
                <Controller
                  name="title"
                  control={control}
                  render={({ field }) => (
                    <Input placeholder="Note title..." {...field} className="text-lg font-semibold border-none focus-visible:ring-0 shadow-none" />
                  )}
                />
                {errors.title && <p className="text-destructive text-sm mt-1">{errors.title.message}</p>}
              </div>

              <div className="flex items-center gap-2 flex-wrap p-2 border-b">
                 <Select value={textOptionsHook.options.fontFamily} onValueChange={textOptionsHook.setFontFamily}>
                    <SelectTrigger className="w-[150px]">
                        <SelectValue placeholder="Font" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Inter">Inter</SelectItem>
                        <SelectItem value="Arial">Arial</SelectItem>
                        <SelectItem value="monospace">Monospace</SelectItem>
                        <SelectItem value="serif">Serif</SelectItem>
                    </SelectContent>
                </Select>
                <Select value={textOptionsHook.options.textAlign} onValueChange={(value) => textOptionsHook.setTextAlign(value as any)}>
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Align" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                        <SelectItem value="justify">Justify</SelectItem>
                    </SelectContent>
                </Select>
                <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon"><CaseSensitive /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <div className="flex gap-2">
                           <ColorButton color="#000000" onClick={textOptionsHook.setTextColor} active={textOptionsHook.options.textColor === '#000000'}/>
                           <ColorButton color="#ef4444" onClick={textOptionsHook.setTextColor} active={textOptionsHook.options.textColor === '#ef4444'}/>
                           <ColorButton color="#3b82f6" onClick={textOptionsHook.setTextColor} active={textOptionsHook.options.textColor === '#3b82f6'}/>
                           <ColorButton color="#22c55e" onClick={textOptionsHook.setTextColor} active={textOptionsHook.options.textColor === '#22c55e'}/>
                        </div>
                    </PopoverContent>
                </Popover>
                 <Popover>
                    <PopoverTrigger asChild>
                        <Button variant="outline" size="icon"><Baseline /></Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto">
                        <div className="flex gap-2">
                           <ColorButton color="transparent" onClick={textOptionsHook.setHighlightColor} active={textOptionsHook.options.highlightColor === 'transparent'}/>
                           <ColorButton color="#fef9c3" onClick={textOptionsHook.setHighlightColor} active={textOptionsHook.options.highlightColor === '#fef9c3'}/>
                           <ColorButton color="#dbeafe" onClick={textOptionsHook.setHighlightColor} active={textOptionsHook.options.highlightColor === '#dbeafe'}/>
                           <ColorButton color="#dcfce7" onClick={textOptionsHook.setHighlightColor} active={textOptionsHook.options.highlightColor === '#dcfce7'}/>
                        </div>
                    </PopoverContent>
                </Popover>
              </div>

              <div>
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <Textarea placeholder="Start writing..." {...field} className="min-h-[200px] resize-y border-none focus-visible:ring-0 shadow-none" style={textStyle} />
                  )}
                />
                {errors.content && <p className="text-destructive text-sm mt-1">{errors.content.message}</p>}
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-medium">To-do List</h3>
                {fields.map((field, index) => (
                  <div key={field.id} className="flex items-center gap-2">
                    <Controller name={`todos.${index}.completed`} control={control} render={({field: checkboxField}) => (
                        <Checkbox checked={checkboxField.value} onCheckedChange={checkboxField.onChange} />
                    )} />
                    <Controller name={`todos.${index}.text`} control={control} render={({field: inputField}) => (
                        <Input {...inputField} placeholder="New todo item..." className="flex-grow" />
                    )} />
                    <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                ))}
                <Button type="button" variant="outline" size="sm" onClick={() => append({id: new Date().toISOString() + Math.random(), text: '', completed: false })}>
                  <Plus className="mr-2 h-4 w-4"/> Add item
                </Button>
              </div>

              <div>
                 <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium">Tags</h3>
                     <Button type="button" variant="ghost" size="sm" onClick={handleGenerateTags} disabled={isGeneratingTags}>
                        {isGeneratingTags ? (
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        ) : (
                            <Wand2 className="mr-2 h-4 w-4" />
                        )}
                        Generate with AI
                    </Button>
                 </div>
                 <div className="flex flex-wrap gap-2">
                    {currentTags.map((tag, index) => (
                        <Badge key={index} variant="secondary" className="flex items-center gap-1">
                            <Tag className="h-3 w-3" />
                            {tag}
                            <button
                                type="button"
                                className="ml-1 rounded-full p-0.5 hover:bg-muted-foreground/20"
                                onClick={() => setValue('tags', currentTags.filter(t => t !== tag))}
                                aria-label={`Remove tag ${tag}`}
                            >
                                <X className="h-3 w-3" />
                            </button>
                        </Badge>
                    ))}
                 </div>
              </div>
            </div>
          </ScrollArea>
        
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>Cancel</Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Note
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
