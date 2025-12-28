import React from 'react';
import { useUserTodos } from '../../hooks/useUserTodos';
import { useToggleTodo, useDeleteTodo } from '../../hooks/useUserTodos';
import { CheckSquare, Square, Trash2 } from 'lucide-react';
import { UserTodo } from '../../types/todos';

export function TodoList() {
  const { data: todos = [], isLoading } = useUserTodos();
  const toggleTodo = useToggleTodo();
  const deleteTodo = useDeleteTodo();

  const incompleteTodos = todos.filter(t => !t.is_completed);
  const completedTodos = todos.filter(t => t.is_completed);

  if (isLoading) {
    return <div className="text-center py-4 text-muted-foreground">Loading...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Incomplete Todos */}
      <div className="space-y-2">
        {incompleteTodos.map((todo) => (
          <TodoItem
            key={todo.id}
            todo={todo}
            onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
            onDelete={() => deleteTodo.mutate(todo.id)}
          />
        ))}
      </div>

      {/* Completed Todos */}
      {completedTodos.length > 0 && (
        <div className="space-y-2 pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-2">Completed</h4>
          {completedTodos.map((todo) => (
            <TodoItem
              key={todo.id}
              todo={todo}
              onToggle={() => toggleTodo.mutate({ id: todo.id, is_completed: !todo.is_completed })}
              onDelete={() => deleteTodo.mutate(todo.id)}
            />
          ))}
        </div>
      )}

      {todos.length === 0 && (
        <div className="text-center py-8 text-muted-foreground">
          <CheckSquare className="h-12 w-12 mx-auto mb-2 opacity-50" />
          <p>No todos yet. Create one to get started!</p>
        </div>
      )}
    </div>
  );
}

function TodoItem({ todo, onToggle, onDelete }: {
  todo: UserTodo;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const getPriorityBadge = (priority: string) => {
    const priorityConfig = {
      high: {
        color: 'var(--color-cloud)',
        backgroundColor: 'var(--priority-high)',
        boxShadow: '0 0 8px var(--priority-high-glow), 0 0 12px var(--priority-high-glow)',
        label: 'High'
      },
      medium: {
        color: 'var(--color-charcoal)',
        backgroundColor: 'var(--priority-medium)',
        boxShadow: '0 0 8px var(--priority-medium-glow), 0 0 12px var(--priority-medium-glow)',
        label: 'Medium'
      },
      low: {
        color: 'var(--color-charcoal)',
        backgroundColor: 'var(--priority-low)',
        boxShadow: '0 0 6px var(--priority-low-glow), 0 0 10px var(--priority-low-glow)',
        label: 'Low'
      },
    };

    const config = priorityConfig[priority as keyof typeof priorityConfig] || priorityConfig.low;

    return (
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-medium"
        style={{
          color: config.color,
          backgroundColor: config.backgroundColor,
          boxShadow: config.boxShadow,
        }}
      >
        {config.label}
      </span>
    );
  };

  return (
    <div className={`flex items-center gap-3 p-3 rounded-lg card-neu-pressed ${
      todo.is_completed ? 'opacity-60' : ''
    }`} style={{ backgroundColor: 'var(--background)', border: 'none' }}>
      {/* Checkbox */}
      <button
        onClick={onToggle}
        className="flex-shrink-0"
        aria-label={todo.is_completed ? 'Mark incomplete' : 'Mark complete'}
      >
        {todo.is_completed ? (
          <CheckSquare className="h-5 w-5 text-status-success" />
        ) : (
          <Square className="h-5 w-5 text-muted-foreground" />
        )}
      </button>
      
      {/* Task Title */}
      <p className={`text-sm flex-shrink-0 font-bold ${todo.is_completed ? 'line-through text-muted-foreground' : 'text-foreground'}`} style={{ fontWeight: 700 }}>
        {todo.title}
      </p>

      {/* Optional Description */}
      {todo.description && (
        <p className="text-xs text-muted-foreground flex-1 min-w-0">
          {todo.description}
        </p>
      )}

      {/* Priority Badge */}
      {getPriorityBadge(todo.priority)}

      {/* Delete Icon */}
      <button
        onClick={onDelete}
        className="flex-shrink-0 text-muted-foreground hover:text-destructive transition-colors"
        aria-label="Delete todo"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

