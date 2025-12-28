import express from "express";
import { 
  requireSupabaseAuth,
  SupabaseAuthenticatedRequest
} from "../supabase-auth";
import { userTodosStorage } from "../user-todos-storage";

const router = express.Router();

// ============================================================================
// USER TODOS ROUTES
// ============================================================================

// GET /api/user-todos - Get all todos for current user
router.get("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { completed, priority } = req.query;

    const filters: any = {};
    if (completed !== undefined) {
      filters.completed = completed === 'true';
    }
    if (priority) {
      filters.priority = priority as string;
    }

    const todos = await userTodosStorage.getUserTodos(userId, filters);
    res.json(todos);
  } catch (error: any) {
    console.error("Error fetching todos:", error);
    res.status(500).json({ message: "Failed to fetch todos", error: error.message });
  }
});

// GET /api/user-todos/:id - Get single todo
router.get("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;

    const todo = await userTodosStorage.getTodoById(todoId, userId);
    res.json(todo);
  } catch (error: any) {
    console.error("Error fetching todo:", error);
    res.status(404).json({ message: "Todo not found", error: error.message });
  }
});

// POST /api/user-todos - Create todo
router.post("/", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { title, description, priority, due_date } = req.body;

    if (!title || title.trim() === '') {
      return res.status(400).json({ message: "Title is required" });
    }

    const todo = await userTodosStorage.createTodo(userId, {
      title: title.trim(),
      description: description?.trim() || undefined,
      priority: priority || 'medium',
      due_date: due_date || undefined,
    });

    res.status(201).json(todo);
  } catch (error: any) {
    console.error("Error creating todo:", error);
    res.status(500).json({ message: "Failed to create todo", error: error.message });
  }
});

// PATCH /api/user-todos/:id - Update todo
router.patch("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;
    const updates = req.body;

    const todo = await userTodosStorage.updateTodo(todoId, userId, updates);
    res.json(todo);
  } catch (error: any) {
    console.error("Error updating todo:", error);
    res.status(500).json({ message: "Failed to update todo", error: error.message });
  }
});

// DELETE /api/user-todos/:id - Delete todo
router.delete("/:id", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const todoId = req.params.id;

    await userTodosStorage.deleteTodo(todoId, userId);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error deleting todo:", error);
    res.status(500).json({ message: "Failed to delete todo", error: error.message });
  }
});

// POST /api/user-todos/reorder - Reorder todos
router.post("/reorder", requireSupabaseAuth, async (req: SupabaseAuthenticatedRequest, res) => {
  try {
    const userId = req.user!.userId;
    const { todoIds } = req.body;

    if (!Array.isArray(todoIds)) {
      return res.status(400).json({ message: "todoIds must be an array" });
    }

    await userTodosStorage.reorderTodos(userId, todoIds);
    res.json({ success: true });
  } catch (error: any) {
    console.error("Error reordering todos:", error);
    res.status(500).json({ message: "Failed to reorder todos", error: error.message });
  }
});

export default router;

