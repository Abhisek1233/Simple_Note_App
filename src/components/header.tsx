'use client';

import { Upload, Download, Search, StickyNote, Plus, LogOut, LogIn } from 'lucide-react';
import { type ChangeEvent, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ThemeToggle } from '@/components/theme-toggle';
import { useFirebaseAuth } from '@/hooks/use-firebase-auth';
import { signInWithGoogle, signOut } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';

interface HeaderProps {
  onSearch: (query: string) => void;
  onAddNew: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
}

export function Header({ onSearch, onAddNew, onImport, onExport }: HeaderProps) {
  const { user } = useFirebaseAuth();
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleImportClick = () => {
    importInputRef.current?.click();
  };

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      onImport(file);
      event.target.value = '';
    }
  };

  const UserMenu = () => {
    if (!user) {
      return (
        <Button onClick={signInWithGoogle}>
          <LogIn className="mr-2 h-4 w-4" />
          Login
        </Button>
      );
    }

    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="relative h-8 w-8 rounded-full">
            <Avatar className="h-9 w-9">
              <AvatarImage src={user.photoURL!} alt={user.displayName || 'User'} />
              <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-56" align="end" forceMount>
          <DropdownMenuLabel className="font-normal">
            <div className="flex flex-col space-y-1">
              <p className="text-sm font-medium leading-none">{user.displayName}</p>
              <p className="text-xs leading-none text-muted-foreground">{user.email}</p>
            </div>
          </DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => signOut()}>
            <LogOut className="mr-2 h-4 w-4" />
            <span>Log out</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    )
  }

  return (
    <header className="sticky top-0 z-30 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between gap-4">
        <div className="flex items-center gap-2 mr-4">
          <StickyNote className="h-7 w-7 text-primary" />
          <h1 className="text-xl md:text-2xl font-bold tracking-tight text-primary whitespace-nowrap">
            Simple Note
          </h1>
        </div>
        <div className="flex flex-1 items-center justify-end gap-2 md:justify-center">
          <div className="relative w-full max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Search notes..."
              className="pl-10"
              onChange={(e) => onSearch(e.target.value)}
              aria-label="Search notes"
            />
          </div>
        </div>
        <div className="flex items-center gap-2 ml-4">
          <div className="hidden md:flex items-center gap-2">
            <Button onClick={onAddNew}>
              <Plus className="h-4 w-4" />
              <span className="hidden lg:inline ml-2">New Note</span>
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                 <Button variant="ghost" size="sm">
                    File
                 </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={handleImportClick}>
                  <Upload className="mr-2 h-4 w-4" />
                  Import
                </DropdownMenuItem>
                 <DropdownMenuItem onClick={onExport}>
                  <Download className="mr-2 h-4 w-4" />
                  Export
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
             <input
                type="file"
                ref={importInputRef}
                onChange={handleFileChange}
                className="hidden"
                accept=".json"
              />
          </div>
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  );
}
