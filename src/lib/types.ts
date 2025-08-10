export interface Todo {
  id: string;
  text: string;
  completed: boolean;
}

export interface TextOptions {
    fontFamily?: string;
    textAlign?: 'left' | 'center' | 'right' | 'justify';
    textColor?: string;
    highlightColor?: string;
}

export interface SharedUser {
    uid: string;
    email: string;
    role: 'editor' | 'viewer';
}

export interface Note {
  id: string;
  title: string;
  content: string;
  tags: string[];
  todos: Todo[];
  textOptions?: TextOptions;
  createdAt: string;
  updatedAt: string;
  userId: string; // To associate note with a user
  sharedWith: SharedUser[];
  sharedWithUids: string[]; // Array of user UIDs with whom the note is shared
  isOwner: boolean;
}
