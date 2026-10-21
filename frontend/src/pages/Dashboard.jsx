import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  ListTodo,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Plus,
  ArrowRight,
  Calendar,
  Sparkles,
  TrendingUp,
} from "lucide-react";
import API from "../services/api";
import { useAuth } from "../context/useAuth";
import TaskModal from "../components/TaskModal";
import TaskCard from "../components/TaskCard";
import DeleteConfirmModal from "../components/DeleteConfirmModal";
import { isTaskOverdue } from "../utils/dateUtils";

export default function Dashboard() {
  const { user } = useAuth();

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Modals
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);
  const [deletingTask, setDeletingTask] = useState(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

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
          setError(err.response?.data?.message || "Unable to load tasks for dashboard.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Calculate dynamic stats
  const stats = useMemo(() => {
    const total = tasks.length;
    let completed = 0;
    let overdue = 0;
    let inProgress = 0;
    let pending = 0;

    tasks.forEach((t) => {
      if (t.status === "Completed") {
        completed++;
      } else if (isTaskOverdue(t)) {
        overdue++;
      } else if (t.status === "In Progress") {
        inProgress++;
      } else {
        pending++;
      }
    });

    const completionRate =
      total > 0 ? Math.round((completed / total) * 100) : 0;

    return {
      total,
      completed,
      overdue,
      pending: pending + inProgress,
      completionRate,
    };
  }, [tasks]);

  // Upcoming Deadlines: nearest non-completed deadlines, sorted ascending
  const upcomingDeadlines = useMemo(() => {
    return tasks
      .filter((t) => t.status !== "Completed")
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .slice(0, 5);
  }, [tasks]);

  // Toggle status
  const handleToggleStatus = async (task) => {
    const newStatus = task.status === "Completed" ? "Pending" : "Completed";
    try {
      const response = await API.put(`/tasks/${task._id}`, {
        status: newStatus,
        progress: newStatus === "Completed" ? 100 : 0,
      });
      const updated = response.data.task;
      setTasks((prev) => prev.map((t) => (t._id === updated._id ? updated : t)));
    } catch (err) {
      console.error("Failed to update status:", err.message);
    }
  };

  // Delete task
  const handleConfirmDelete = async () => {
    if (!deletingTask) return;
    try {
      setDeleteLoading(true);
      await API.delete(`/tasks/${deletingTask._id}`);
      setTasks((prev) => prev.filter((t) => t._id !== deletingTask._id));
      setDeletingTask(null);
    } catch (err) {
      console.error("Failed to delete task:", err.message);
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleTaskSaved = (savedTask) => {
    if (editingTask) {
      setTasks((prev) =>
        prev.map((t) => (t._id === savedTask._id ? savedTask : t))
      );
    } else {
      setTasks((prev) => [savedTask, ...prev]);
    }
    setEditingTask(null);
  };

  return (
    <div>
      {/* Personalized Welcome Banner */}
      <div className="welcome-banner">
        <div className="welcome-text">
          <h1>Welcome back, {user?.name || "Student"}! 👋</h1>
          <p>
            Stay ahead of your coursework. You have{" "}
            <strong style={{ color: "var(--primary-blue)" }}>
              {stats.pending} pending tasks
            </strong>{" "}
            and{" "}
            <strong
              style={{
                color: stats.overdue > 0 ? "var(--status-red)" : "inherit",
              }}
            >
              {stats.overdue} overdue
            </strong>
            .
          </p>
        </div>

        <div className="welcome-actions">
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus size={18} />
            <span>Add New Task</span>
          </button>
          <Link to="/tasks" className="btn btn-secondary">
            <span>View All Tasks</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: "20px" }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Dynamic Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-blue">
            <ListTodo size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Total Tasks</span>
            <span className="stat-value">{stats.total}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-amber">
            <Clock size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Pending / Active</span>
            <span className="stat-value">{stats.pending}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-green">
            <CheckCircle2 size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Completed</span>
            <span className="stat-value">{stats.completed}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon-wrapper stat-icon-red">
            <AlertTriangle size={24} />
          </div>
          <div className="stat-info">
            <span className="stat-label">Overdue</span>
            <span className="stat-value">{stats.overdue}</span>
          </div>
        </div>
      </div>

      {/* Main Grid: Upcoming Deadlines & Productivity Overview */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "2fr 1fr",
          gap: "24px",
          alignItems: "start",
        }}
      >
        {/* Left Column: Upcoming Deadlines */}
        <div className="card">
          <div className="card-header">
            <div>
              <h2 className="card-title">Priority Upcoming Deadlines</h2>
              <p style={{ fontSize: "12px", color: "var(--medium-gray)", marginTop: "2px" }}>
                Chronologically ordered assignments and tests
              </p>
            </div>
            <Link
              to="/upcoming"
              className="btn btn-secondary btn-sm"
              style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
            >
              <span>View All</span>
              <ArrowRight size={14} />
            </Link>
          </div>

          <div className="card-body" style={{ padding: "16px 20px" }}>
            {loading ? (
              <p style={{ textAlign: "center", color: "var(--medium-gray)", padding: "20px 0" }}>
                Loading upcoming deadlines...
              </p>
            ) : upcomingDeadlines.length === 0 ? (
              <div className="empty-state" style={{ padding: "32px 16px" }}>
                <CheckCircle2
                  size={32}
                  style={{ color: "var(--status-green)", margin: "0 auto 10px", display: "block" }}
                />
                <h4 className="empty-title">All Caught Up!</h4>
                <p className="empty-desc">
                  You have no pending deadlines right now. Great job keeping your schedule clean!
                </p>
                <button
                  className="btn btn-primary btn-sm"
                  onClick={() => setIsTaskModalOpen(true)}
                >
                  <Plus size={15} />
                  <span>Create a Task</span>
                </button>
              </div>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {upcomingDeadlines.map((task) => (
                  <TaskCard
                    key={task._id}
                    task={task}
                    onEdit={(t) => {
                      setEditingTask(t);
                      setIsTaskModalOpen(true);
                    }}
                    onDelete={(t) => setDeletingTask(t)}
                    onToggleStatus={handleToggleStatus}
                  />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Productivity & Quick Actions */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          {/* Progress Overview Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Completion Rate</h2>
              <TrendingUp size={18} color="var(--primary-blue)" />
            </div>
            <div className="card-body">
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  marginBottom: "10px",
                }}
              >
                <span style={{ fontSize: "14px", fontWeight: "600", color: "var(--dark-gray)" }}>
                  Task Progress
                </span>
                <span
                  style={{
                    fontSize: "20px",
                    fontWeight: "800",
                    color: "var(--primary-blue)",
                  }}
                >
                  {stats.completionRate}%
                </span>
              </div>

              {/* Progress Bar */}
              <div
                style={{
                  width: "100%",
                  height: "10px",
                  backgroundColor: "var(--bg-light)",
                  borderRadius: "999px",
                  overflow: "hidden",
                  border: "1px solid var(--border)",
                  marginBottom: "16px",
                }}
              >
                <div
                  style={{
                    width: `${stats.completionRate}%`,
                    height: "100%",
                    backgroundColor:
                      stats.completionRate === 100
                        ? "var(--status-green)"
                        : "var(--primary-blue)",
                    borderRadius: "999px",
                    transition: "width 0.4s ease",
                  }}
                />
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "10px",
                  fontSize: "12px",
                  color: "var(--medium-gray)",
                }}
              >
                <div>
                  Completed: <strong>{stats.completed}</strong>
                </div>
                <div>
                  Remaining: <strong>{stats.pending + stats.overdue}</strong>
                </div>
              </div>
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="card">
            <div className="card-header">
              <h2 className="card-title">Quick Actions</h2>
              <Sparkles size={18} color="var(--status-amber)" />
            </div>
            <div className="card-body" style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <button
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "flex-start" }}
                onClick={() => {
                  setEditingTask(null);
                  setIsTaskModalOpen(true);
                }}
              >
                <Plus size={16} />
                <span>Create New Task</span>
              </button>

              <Link
                to="/calendar"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                <Calendar size={16} />
                <span>Open Calendar View</span>
              </Link>

              <Link
                to="/upcoming"
                className="btn btn-secondary"
                style={{ width: "100%", justifyContent: "flex-start" }}
              >
                <Clock size={16} />
                <span>View All Upcoming</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Task Modal */}
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
