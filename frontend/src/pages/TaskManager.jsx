import { useState, useEffect, useMemo } from "react";
import {
  Plus,
  Search,
  CheckCircle2,
  Clock,
  AlertCircle,
  X,
  RotateCcw,
  Loader2,
} from "lucide-react";
import API from "../services/api";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { isTaskOverdue } from "../utils/dateUtils";

export default function TaskManager() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [feedbackMessage, setFeedbackMessage] = useState("");

  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [priorityFilter, setPriorityFilter] = useState("All");
  const [typeFilter, setTypeFilter] = useState("All");
  const [sortBy, setSortBy] = useState("deadline-asc");

  // Modals state
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  // Fetch tasks on mount
  useEffect(() => {
    let active = true;
    API.get("/tasks")
      .then((res) => {
        if (active) {
          setTasks(res.data.tasks || []);
          setError("");
        }
      })
      .catch((err) => {
        if (active) {
          setError(
            err.response?.data?.message ||
              "Failed to load tasks. Please verify your connection."
          );
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const showNotification = (msg) => {
    setFeedbackMessage(msg);
    setTimeout(() => {
      setFeedbackMessage("");
    }, 3500);
  };

  // Toggle Complete / Reopen
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      const response = await API.put(`/tasks/${task._id}`, {
        status: newStatus,
        progress: newStatus === "Completed" ? 100 : 0,
      });

      const updatedTask = response.data.task;
      setTasks((prev) =>
        prev.map((t) => (t._id === updatedTask._id ? updatedTask : t))
      );

      showNotification(
        newStatus === "Completed"
          ? `Marked "${task.title}" as completed!`
          : `Reopened "${task.title}".`
      );
    } catch {
      showNotification("Failed to update task status.");
    }
  };

  // Open Edit Modal
  const handleOpenEdit = (task) => {
    setEditingTask(task);
    setIsTaskModalOpen(true);
  };

  // Open Create Modal
  const handleOpenCreate = () => {
    setEditingTask(null);
    setIsTaskModalOpen(true);
  };

  // Handle task saved (create or edit)
  const handleTaskSaved = (savedTask) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t._id === savedTask._id ? savedTask : t))
      );
      showNotification(`Task "${savedTask.title}" updated successfully!`);
    } else {
      setTasks((prev) => [savedTask, ...prev]);
      showNotification(`Task "${savedTask.title}" created successfully!`);
    }
    setEditingTask(null);
  };

  // Handle delete confirmation
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      setDeleteLoading(true);
      await API.delete(`/tasks/${deletingTask._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      showNotification(`Task "${deletingTask.title}" deleted.`);
      setDeletingTask(null);
    } catch {
      showNotification("Failed to delete task.");
    } finally {
      setDeleteLoading(false);
    }
  };

  // Reset all filters
  const handleClearFilters = () => {
    setSearchQuery("");
    setStatusFilter("All");
    setPriorityFilter("All");
    setTypeFilter("All");
    setSortBy("deadline-asc");
  };

  // Filtered and Sorted Tasks
  const processedTasks = useMemo(() => {
    return tasks
      .filter((task) => {
        // Search by title, subject, description
        if (searchQuery.trim()) {
          const query = searchQuery.toLowerCase();
          const matchesTitle = task.title?.toLowerCase().includes(query);
          const matchesSubject = task.subject?.toLowerCase().includes(query);
          const matchesDesc = task.description?.toLowerCase().includes(query);
          if (!matchesTitle && !matchesSubject && !matchesDesc) return false;
        }

        // Status Filter
        if (statusFilter !== "All") {
          if (statusFilter === "Overdue") {
            if (!isTaskOverdue(task)) return false;
          } else if (task.status !== statusFilter) {
            return false;
          }
        }

        // Priority Filter
        if (priorityFilter !== "All" && task.priority !== priorityFilter) {
          return false;
        }

        // Type Filter
        if (typeFilter !== "All" && task.taskType !== typeFilter) {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === "deadline-asc") {
          return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
        }
        if (sortBy === "deadline-desc") {
          return new Date(b.deadline).getTime() - new Date(a.deadline).getTime();
        }
        if (sortBy === "priority") {
          const priorityWeight = { High: 3, Medium: 2, Low: 1 };
          return (
            (priorityWeight[b.priority] || 0) -
            (priorityWeight[a.priority] || 0)
          );
        }
        if (sortBy === "created-desc") {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        }
        return 0;
      });
  }, [tasks, searchQuery, statusFilter, priorityFilter, typeFilter, sortBy]);

  const hasActiveFilters =
    searchQuery.trim() !== "" ||
    statusFilter !== "All" ||
    priorityFilter !== "All" ||
    typeFilter !== "All" ||
    sortBy !== "deadline-asc";

  return (
    <div>
      {/* Page Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--black)" }}>
            Academic Tasks
          </h2>
          <p style={{ color: "var(--medium-gray)", fontSize: "14px" }}>
            Track, prioritize, and manage all your academic commitments
          </p>
        </div>

        <button className="btn btn-primary" onClick={handleOpenCreate}>
          <Plus size={18} />
          <span>Add New Task</span>
        </button>
      </div>

      {/* Feedback Toast */}
      {feedbackMessage && (
        <div
          className="auth-alert auth-alert-success"
          style={{ marginBottom: "20px" }}
        >
          <CheckCircle2 size={18} />
          <span>{feedbackMessage}</span>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="filter-toolbar">
        <div className="filter-group-left">
          <div className="search-input-box">
            <div className="input-with-icon">
              <Search className="input-icon-left" size={16} />
              <input
                type="text"
                className="form-input"
                placeholder="Search by title, subject, or notes..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searchQuery && (
                <button
                  className="password-toggle-btn"
                  onClick={() => setSearchQuery("")}
                  style={{ right: "10px" }}
                >
                  <X size={16} />
                </button>
              )}
            </div>
          </div>

          <select
            className="filter-select"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
            <option value="Overdue">Overdue Only</option>
          </select>

          <select
            className="filter-select"
            value={priorityFilter}
            onChange={(e) => setPriorityFilter(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="High">High Priority</option>
            <option value="Medium">Medium Priority</option>
            <option value="Low">Low Priority</option>
          </select>

          <select
            className="filter-select"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="All">All Task Types</option>
            <option value="Assignment">Assignment</option>
            <option value="Examination">Examination</option>
            <option value="Project">Project</option>
            <option value="Presentation">Presentation</option>
            <option value="Record submission">Record submission</option>
            <option value="Lab work">Lab work</option>
            <option value="Other">Other</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <select
            className="filter-select"
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
          >
            <option value="deadline-asc">Deadline (Soonest First)</option>
            <option value="deadline-desc">Deadline (Latest First)</option>
            <option value="priority">Priority (High to Low)</option>
            <option value="created-desc">Recently Created</option>
          </select>

          {hasActiveFilters && (
            <button
              className="btn btn-secondary btn-sm"
              onClick={handleClearFilters}
              title="Reset Filters"
            >
              <RotateCcw size={14} />
              <span>Clear</span>
            </button>
          )}
        </div>
      </div>

      {/* Task Content */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Loader2
            size={36}
            style={{ animation: "spin 1s linear infinite", color: "var(--primary-blue)", margin: "0 auto 12px" }}
          />
          <p style={{ color: "var(--medium-gray)", fontSize: "14px" }}>
            Loading your academic tasks...
          </p>
        </div>
      ) : error ? (
        <div className="auth-alert auth-alert-error">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      ) : processedTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <Clock size={28} />
          </div>
          <h3 className="empty-title">
            {hasActiveFilters
              ? "No tasks match your filters"
              : "No academic tasks yet"}
          </h3>
          <p className="empty-desc">
            {hasActiveFilters
              ? "Try adjusting your search criteria or resetting filters to see your tasks."
              : "Keep track of your coursework, assignments, and exams by adding your first task."}
          </p>
          {hasActiveFilters ? (
            <button
              className="btn btn-secondary"
              onClick={handleClearFilters}
            >
              Clear All Filters
            </button>
          ) : (
            <button className="btn btn-primary" onClick={handleOpenCreate}>
              <Plus size={18} />
              <span>Add Your First Task</span>
            </button>
          )}
        </div>
      ) : (
        <div className="task-grid">
          {processedTasks.map((task) => (
            <TaskCard
              key={task._id}
              task={task}
              onEdit={handleOpenEdit}
              onDelete={(t) => setDeletingTask(t)}
              onToggleStatus={handleToggleStatus}
            />
          ))}
        </div>
      )}

      {/* Task Modal (Create & Edit) */}
      {isTaskModalOpen && (
        <TaskModal
          key={editingTask ? editingTask._id : "new-task"}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onTaskSaved={handleTaskSaved}
          initialTask={editingTask}
        />
      )}

      {/* Delete Confirmation Modal */}
      <DeleteConfirmModal
        isOpen={Boolean(deletingTask)}
        onClose={() => setDeletingTask(null)}
        onConfirm={handleConfirmDelete}
        taskTitle={deletingTask?.title || ""}
        loading={deleteLoading}
      />
    </div>
  );
}