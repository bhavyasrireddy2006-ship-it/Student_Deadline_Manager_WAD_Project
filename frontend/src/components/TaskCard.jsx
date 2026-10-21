import {
  Clock,
  Edit2,
  Trash2,
  CheckCircle2,
  Circle,
  AlertTriangle,
} from "lucide-react";
import {
  isTaskOverdue,
  formatFullDateTime,
  getDeadlineRelativeInfo,
} from "../utils/dateUtils";

export default function TaskCard({ task, onEdit, onDelete, onToggleStatus }) {
  const isOverdue = isTaskOverdue(task);
  const isCompleted = task.status === "Completed";
  const deadlineInfo = getDeadlineRelativeInfo(task.deadline, task.status);

  const getPriorityBadgeClass = (priority) => {
    switch (priority) {
      case "High":
        return "badge-priority-high";
      case "Low":
        return "badge-priority-low";
      case "Medium":
      default:
        return "badge-priority-medium";
    }
  };

  const getStatusBadge = () => {
    if (isCompleted) {
      return <span className="badge badge-status-completed">Completed</span>;
    }
    if (isOverdue) {
      return (
        <span className="badge badge-status-overdue">
          <AlertTriangle size={12} />
          Overdue
        </span>
      );
    }
    if (task.status === "In Progress") {
      return (
        <span className="badge badge-status-in-progress">In Progress</span>
      );
    }
    return <span className="badge badge-status-pending">Pending</span>;
  };

  return (
    <div
      className={`task-item-card ${isCompleted ? "is-completed" : ""} ${
        isOverdue ? "is-overdue" : ""
      }`}
    >
      <div>
        <div className="task-header-row">
          <div style={{ display: "flex", alignItems: "flex-start", gap: "10px" }}>
            <button
              className="btn-icon"
              style={{
                padding: "2px",
                border: "none",
                background: "transparent",
                color: isCompleted ? "var(--status-green)" : "var(--medium-gray)",
                marginTop: "2px",
              }}
              title={isCompleted ? "Mark as Pending" : "Mark as Completed"}
              onClick={() => onToggleStatus(task)}
              aria-label={
                isCompleted ? "Mark task pending" : "Mark task completed"
              }
            >
              {isCompleted ? (
                <CheckCircle2 size={20} color="var(--status-green)" />
              ) : (
                <Circle size={20} />
              )}
            </button>
            <h3
              className={`task-card-title ${
                isCompleted ? "completed-title" : ""
              }`}
            >
              {task.title}
            </h3>
          </div>
        </div>

        <div className="task-meta-row">
          <span className="badge badge-type">{task.subject}</span>
          <span className="badge badge-type">{task.taskType || "Task"}</span>
          <span className={`badge ${getPriorityBadgeClass(task.priority)}`}>
            {task.priority} Priority
          </span>
          {getStatusBadge()}
        </div>

        {task.description && (
          <p className="task-card-desc">{task.description}</p>
        )}
      </div>

      <div className="task-footer-row">
        <div
          className={`task-due-info ${
            deadlineInfo.isUrgent ? "due-urgent" : ""
          }`}
          title={`Due: ${formatFullDateTime(task.deadline)}`}
        >
          <Clock size={14} />
          <span>{deadlineInfo.text}</span>
          <span style={{ color: "var(--light-gray)", fontSize: "11px" }}>
            ({formatFullDateTime(task.deadline).split(",")[0]})
          </span>
        </div>

        <div className="task-actions">
          <button
            className="btn-icon"
            onClick={() => onEdit(task)}
            title="Edit Task"
            aria-label="Edit task"
          >
            <Edit2 size={15} />
          </button>
          <button
            className="btn-icon"
            onClick={() => onDelete(task)}
            title="Delete Task"
            aria-label="Delete task"
            style={{ color: "var(--status-red)" }}
          >
            <Trash2 size={15} />
          </button>
        </div>
      </div>
    </div>
  );
}
