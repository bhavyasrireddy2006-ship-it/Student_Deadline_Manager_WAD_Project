import { useState } from "react";
import { X, AlertCircle, Loader2 } from "lucide-react";
import API from "../services/api";

const TASK_TYPES = [
  "Assignment",
  "Examination",
  "Project",
  "Presentation",
  "Record submission",
  "Lab work",
  "Other",
];

const PRIORITIES = ["Low", "Medium", "High"];
const STATUSES = ["Pending", "In Progress", "Completed"];

const getInitialFormData = (task) => {
  if (task) {
    let formattedDeadline = "";
    if (task.deadline) {
      const date = new Date(task.deadline);
      const pad = (n) => String(n).padStart(2, "0");
      formattedDeadline = `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
    }

    return {
      title: task.title || "",
      subject: task.subject || "",
      taskType: task.taskType || "Assignment",
      description: task.description || "",
      deadline: formattedDeadline,
      priority: task.priority || "Medium",
      estimatedHours: task.estimatedHours || 1,
      status: task.status || "Pending",
    };
  }

  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  tomorrow.setHours(23, 59, 0, 0);
  const pad = (n) => String(n).padStart(2, "0");
  const defaultDeadline = `${tomorrow.getFullYear()}-${pad(tomorrow.getMonth() + 1)}-${pad(tomorrow.getDate())}T23:59`;

  return {
    title: "",
    subject: "",
    taskType: "Assignment",
    description: "",
    deadline: defaultDeadline,
    priority: "Medium",
    estimatedHours: 1,
    status: "Pending",
  };
};

export default function TaskModal({ isOpen, onClose, onTaskSaved, initialTask = null }) {
  const isEditing = Boolean(initialTask && initialTask._id);
  const [formData, setFormData] = useState(() => getInitialFormData(initialTask));
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    if (error) setError("");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (!formData.title.trim()) {
      setError("Please enter a task title.");
      return;
    }
    if (!formData.subject.trim()) {
      setError("Please specify the course or subject.");
      return;
    }
    if (!formData.deadline) {
      setError("Please select a due date and time.");
      return;
    }

    try {
      setSubmitting(true);
      const payload = {
        ...formData,
        title: formData.title.trim(),
        subject: formData.subject.trim(),
        estimatedHours: Number(formData.estimatedHours) || 1,
      };

      let response;
      if (isEditing) {
        response = await API.put(`/tasks/${initialTask._id}`, payload);
      } else {
        response = await API.post("/tasks", payload);
      }

      onTaskSaved(response.data.task || response.data);
      onClose();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to ${isEditing ? "update" : "create"} task. Please check your connection.`
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-dialog" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">
            {isEditing ? "Edit Academic Task" : "Add New Academic Task"}
          </h2>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close dialog"
            style={{ border: "none" }}
          >
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            {error && (
              <div
                className="auth-alert auth-alert-error"
                style={{ marginBottom: "16px" }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0 }} />
                <span>{error}</span>
              </div>
            )}

            <div className="form-group">
              <label className="form-label" htmlFor="task-title">
                Task Title *
              </label>
              <input
                id="task-title"
                name="title"
                type="text"
                className="form-input"
                placeholder="e.g. Distributed Systems Lab 3 Submission"
                value={formData.title}
                onChange={handleChange}
                required
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-subject">
                  Subject / Course *
                </label>
                <input
                  id="task-subject"
                  name="subject"
                  type="text"
                  className="form-input"
                  placeholder="e.g. CS 402 or Mathematics"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-type">
                  Task Type
                </label>
                <select
                  id="task-type"
                  name="taskType"
                  className="form-select"
                  value={formData.taskType}
                  onChange={handleChange}
                >
                  {TASK_TYPES.map((type) => (
                    <option key={type} value={type}>
                      {type}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="task-description">
                Description / Notes
              </label>
              <textarea
                id="task-description"
                name="description"
                className="form-textarea"
                rows="3"
                placeholder="Key requirements, rubric notes, submission link, etc."
                value={formData.description}
                onChange={handleChange}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-deadline">
                  Due Date & Time *
                </label>
                <input
                  id="task-deadline"
                  name="deadline"
                  type="datetime-local"
                  className="form-input"
                  value={formData.deadline}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="task-priority">
                  Priority
                </label>
                <select
                  id="task-priority"
                  name="priority"
                  className="form-select"
                  value={formData.priority}
                  onChange={handleChange}
                >
                  {PRIORITIES.map((priority) => (
                    <option key={priority} value={priority}>
                      {priority}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label className="form-label" htmlFor="task-hours">
                  Estimated Effort (Hours)
                </label>
                <input
                  id="task-hours"
                  name="estimatedHours"
                  type="number"
                  step="0.5"
                  min="0.5"
                  className="form-input"
                  value={formData.estimatedHours}
                  onChange={handleChange}
                />
              </div>

              {isEditing && (
                <div className="form-group">
                  <label className="form-label" htmlFor="task-status">
                    Status
                  </label>
                  <select
                    id="task-status"
                    name="status"
                    className="form-select"
                    value={formData.status}
                    onChange={handleChange}
                  >
                    {STATUSES.map((status) => (
                      <option key={status} value={status}>
                        {status}
                      </option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="btn btn-secondary"
              onClick={onClose}
              disabled={submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary"
              disabled={submitting}
            >
              {submitting ? (
                <>
                  <Loader2
                    size={16}
                    style={{ animation: "spin 1s linear infinite" }}
                  />
                  Saving Task...
                </>
              ) : isEditing ? (
                "Save Changes"
              ) : (
                "Create Task"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
