import React from "react";
import { CheckSquare, Clock, AlertTriangle, Plus, Filter } from "lucide-react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import Widget from "./Widget";
import { useTaskData } from "../../hooks/useRealtimeData";

interface TaskManagementWidgetProps {
  className?: string;
}

export default function TaskManagementWidget({ className }: TaskManagementWidgetProps) {
  const { data: tasks, isLoading, error } = useTaskData();

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600 bg-red-100 dark:bg-red-900/20';
      case 'medium': return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/20';
      case 'low': return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high': return <AlertTriangle className="h-3 w-3" />;
      case 'medium': return <Clock className="h-3 w-3" />;
      case 'low': return <CheckSquare className="h-3 w-3" />;
      default: return <Clock className="h-3 w-3" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending': return <Badge variant="destructive">Pending</Badge>;
      case 'in_progress': return <Badge variant="secondary">In Progress</Badge>;
      case 'completed': return <Badge variant="outline">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'review': return <CheckSquare className="h-4 w-4" />;
      case 'approval': return <AlertTriangle className="h-4 w-4" />;
      case 'maintenance': return <Clock className="h-4 w-4" />;
      case 'billing': return <CheckSquare className="h-4 w-4" />;
      case 'training': return <CheckSquare className="h-4 w-4" />;
      default: return <CheckSquare className="h-4 w-4" />;
    }
  };

  const pendingTasks = tasks?.filter(task => task.status === 'pending') || [];
  const inProgressTasks = tasks?.filter(task => task.status === 'in_progress') || [];
  const completedTasks = tasks?.filter(task => task.status === 'completed') || [];

  return (
    <Widget
      title="Task Management"
      icon={<CheckSquare className="h-5 w-5" />}
      size="medium"
      className={className}
      loading={isLoading}
      error={error ? 'Failed to load task data' : undefined}
      actions={
        <div className="flex items-center space-x-1">
          <Button variant="outline" size="sm">
            <Filter className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      }
    >
      <div className="space-y-4">
        {/* Task Summary */}
        <div className="grid grid-cols-3 gap-4">
          <div className="text-center p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">{pendingTasks.length}</div>
            <div className="text-xs text-muted-foreground">Pending</div>
          </div>
          <div className="text-center p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">{inProgressTasks.length}</div>
            <div className="text-xs text-muted-foreground">In Progress</div>
          </div>
          <div className="text-center p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">{completedTasks.length}</div>
            <div className="text-xs text-muted-foreground">Completed</div>
          </div>
        </div>

        {/* Task List */}
        <div className="space-y-2">
          {tasks && tasks.length > 0 ? tasks.slice(0, 4).map((task) => (
            <div key={task.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center space-x-2">
                  {getTypeIcon(task.type)}
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{task.title}</span>
                </div>
                <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${getPriorityColor(task.priority)}`}>
                  {getPriorityIcon(task.priority)}
                  <span className="capitalize">{task.priority}</span>
                </div>
              </div>
              
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                  <Clock className="h-3 w-3" />
                  <span>Due in {task.due}</span>
                </div>
                {getStatusBadge(task.status)}
              </div>
            </div>
          )) : (
            <div className="text-center text-gray-500 dark:text-gray-400 py-4">
              <CheckSquare className="h-8 w-8 mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-900 dark:text-gray-100">No tasks available</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="pt-4 border-t">
          <h4 className="text-sm font-medium text-muted-foreground mb-3">Quick Actions</h4>
          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" className="justify-start">
              <CheckSquare className="h-4 w-4 mr-2" />
              Mark Complete
            </Button>
            <Button variant="outline" size="sm" className="justify-start">
              <Clock className="h-4 w-4 mr-2" />
              Set Reminder
            </Button>
          </div>
        </div>
      </div>
    </Widget>
  );
}
