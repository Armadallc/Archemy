import React from "react";
import Widget from "./Widget";
import { TodoList } from "../todos/TodoList";
import { TodoForm } from "../todos/TodoForm";
import { useUserTodos } from "../../hooks/useUserTodos";

interface TaskManagementWidgetProps {
  className?: string;
  shadow?: 'sm' | 'xl';
}

export default function TaskManagementWidget({ className, shadow }: TaskManagementWidgetProps) {
  const { data: todos = [], isLoading } = useUserTodos();

  const incompleteCount = todos.filter(t => !t.is_completed).length;
  const completedCount = todos.filter(t => t.is_completed).length;

  return (
    <Widget
      title="TASKS"
      size="medium"
      className={className}
      shadow={shadow}
      loading={isLoading}
      titleStyle={{ fontSize: '42px' }}
    >
      <div className="space-y-4" style={{ padding: '8px', margin: '-4px' }}>
        {/* Todo Summary */}
        <div className="grid grid-cols-2 gap-4">
          <div className="text-center p-3 rounded-lg card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="text-2xl font-bold text-foreground">{incompleteCount}</div>
            <div className="text-xs text-foreground-secondary">Active</div>
          </div>
          <div className="text-center p-3 rounded-lg card-neu-pressed" style={{ backgroundColor: 'var(--background)', border: 'none' }}>
            <div className="text-2xl font-bold text-foreground">{completedCount}</div>
            <div className="text-xs text-foreground-secondary">Completed</div>
          </div>
        </div>

        {/* Todo Form */}
        <TodoForm />

        {/* Todo List */}
        <TodoList />
      </div>
    </Widget>
  );
}
