import React, { useState } from 'react';
import { useCreateTodo } from '../../hooks/useUserTodos';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Plus, X } from 'lucide-react';

export function TodoForm() {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [isOpen, setIsOpen] = useState(false);
  const createTodo = useCreateTodo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    try {
      await createTodo.mutateAsync({
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
      });

      setTitle('');
      setDescription('');
      setPriority('medium');
      setIsOpen(false);
    } catch (error) {
      console.error('Error creating todo:', error);
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="outline"
        size="sm"
        className="w-full relative"
        style={{
          boxShadow: '0 0 8px rgba(212, 215, 218, 0.3), 0 0 12px rgba(212, 215, 218, 0.2)',
        }}
      >
        <Plus className="h-4 w-4 mr-2" />
        Add Todo
      </Button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-3 p-3 rounded-lg card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-medium text-foreground">New Todo</h4>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setTitle('');
            setDescription('');
          }}
          className="text-muted-foreground hover:text-foreground"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
      
      <Input
        placeholder="Todo title..."
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        autoFocus
        style={{ 
          backgroundColor: '#1e2023',
          boxShadow: 'var(--shadow-neu-pressed)',
        }}
      />
      <Textarea
        placeholder="Description (optional)"
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        rows={2}
        style={{ 
          backgroundColor: '#1e2023',
          boxShadow: 'var(--shadow-neu-pressed)',
        }}
      />
      <div className="flex items-center gap-2">
        <Select value={priority} onValueChange={(v) => setPriority(v as any)}>
          <SelectTrigger className="flex-1">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="low">Low Priority</SelectItem>
            <SelectItem value="medium">Medium Priority</SelectItem>
            <SelectItem value="high">High Priority</SelectItem>
          </SelectContent>
        </Select>
        <Button 
          type="submit" 
          size="sm" 
          disabled={createTodo.isPending}
          style={{
            boxShadow: '0 0 8px rgba(212, 215, 218, 0.3), 0 0 12px rgba(212, 215, 218, 0.2)',
          }}
        >
          {createTodo.isPending ? 'Adding...' : 'Add'}
        </Button>
      </div>
    </form>
  );
}

