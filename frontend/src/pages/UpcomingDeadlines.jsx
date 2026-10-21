import { useState, useEffect, useMemo } from "react";
import {
  Clock,
  AlertTriangle,
  Calendar,
  CheckCircle2,
  Plus,
  Loader2,
} from "lucide-react";
import API from "../services/api";
import TaskCard from "../components/TaskCard";
import TaskModal from "../components/TaskModal";
import DeleteConfirmModal from "../components/DeleteConfirmModal";

export default function UpcomingDeadlines() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [nowTimestamp] = useState(() => Date.now());

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
          setError(err.response?.data?.message || "Unable to load deadlines.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  // Categorize active (non-completed) deadlines
  const categorizedTasks = useMemo(() => {
    const active = tasks.filter((t) => t.status !== "Completed");
    const oneDay = 24 * 60 * 60 * 1000;
    const sevenDays = 7 * oneDay;

    const overdue = [];
    const dueToday = [];
    const dueThisWeek = [];
    const dueLater = [];

    active
      .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
      .forEach((task) => {
        const time = new Date(task.deadline).getTime();
        const diff = time - nowTimestamp;

        if (diff < 0) {
          overdue.push(task);
        } else if (diff <= oneDay) {
          dueToday.push(task);
        } else if (diff <= sevenDays) {
          dueThisWeek.push(task);
        } else {
          dueLater.push(task);
        }
      });

    return { overdue, dueToday, dueThisWeek, dueLater, totalActive: active.length };
  }, [tasks, nowTimestamp]);

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
      console.error("Failed to toggle status:", err.message);
    }
  };

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
      {/* Header */}
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
            Upcoming Deadlines & Schedule
          </h2>
          <p style={{ color: "var(--medium-gray)", fontSize: "14px" }}>
            Sorted chronologically by urgency to help prioritize your study sessions
          </p>
        </div>

        <button
          className="btn btn-primary"
          onClick={() => {
            setEditingTask(null);
            setIsTaskModalOpen(true);
          }}
        >
          <Plus size={18} />
          <span>New Deadline</span>
        </button>
      </div>

      {error && (
        <div className="auth-alert auth-alert-error" style={{ marginBottom: "20px" }}>
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div style={{ textAlign: "center", padding: "60px 0" }}>
          <Loader2
            size={36}
            style={{
              animation: "spin 1s linear infinite",
              color: "var(--primary-blue)",
              margin: "0 auto 12px",
            }}
          />
          <p style={{ color: "var(--medium-gray)", fontSize: "14px" }}>
            Loading deadlines...
          </p>
        </div>
      ) : categorizedTasks.totalActive === 0 ? (
        <div className="empty-state">
          <div className="empty-icon-box">
            <CheckCircle2 size={28} />
          </div>
          <h3 className="empty-title">No Pending Deadlines!</h3>
          <p className="empty-desc">
            You are completely caught up with all assignments, tests, and projects.
          </p>
          <button
            className="btn btn-primary"
            onClick={() => setIsTaskModalOpen(true)}
          >
            <Plus size={16} />
            <span>Schedule a Deadline</span>
          </button>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
          {/* Overdue Section */}
          {categorizedTasks.overdue.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                  color: "var(--status-red)",
                }}
              >
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--status-red)" }}>
                  Overdue Deadlines ({categorizedTasks.overdue.length})
                </h3>
              </div>
              <div className="task-grid">
                {categorizedTasks.overdue.map((task) => (
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
            </div>
          )}

          {/* Due Today */}
          {categorizedTasks.dueToday.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <Clock size={20} color="var(--status-amber)" />
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--black)" }}>
                  Due Today ({categorizedTasks.dueToday.length})
                </h3>
              </div>
              <div className="task-grid">
                {categorizedTasks.dueToday.map((task) => (
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
            </div>
          )}

          {/* Due This Week */}
          {categorizedTasks.dueThisWeek.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <Calendar size={20} color="var(--primary-blue)" />
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--black)" }}>
                  Due This Week ({categorizedTasks.dueThisWeek.length})
                </h3>
              </div>
              <div className="task-grid">
                {categorizedTasks.dueThisWeek.map((task) => (
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
            </div>
          )}

          {/* Due Later */}
          {categorizedTasks.dueLater.length > 0 && (
            <div>
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  marginBottom: "14px",
                }}
              >
                <Calendar size={20} color="var(--medium-gray)" />
                <h3 style={{ fontSize: "17px", fontWeight: "700", color: "var(--black)" }}>
                  Upcoming Later ({categorizedTasks.dueLater.length})
                </h3>
              </div>
              <div className="task-grid">
                {categorizedTasks.dueLater.map((task) => (
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
            </div>
          )}
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          key={editingTask ? editingTask._id : "new-deadline"}
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
