import { AlertTriangle, Trash2, X } from "lucide-react";

export default function DeleteConfirmModal({
  isOpen,
  onClose,
  onConfirm,
  taskTitle,
  loading,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div
        className="modal-dialog"
        style={{ maxWidth: "420px" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="modal-header">
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <div
              style={{
                width: "32px",
                height: "32px",
                borderRadius: "50%",
                backgroundColor: "var(--status-red-light)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                color: "var(--status-red)",
              }}
            >
              <AlertTriangle size={18} />
            </div>
            <h2 className="modal-title" style={{ fontSize: "16px" }}>
              Delete Task
            </h2>
          </div>
          <button
            className="btn-icon"
            onClick={onClose}
            aria-label="Close"
            style={{ border: "none" }}
          >
            <X size={18} />
          </button>
        </div>

        <div className="modal-body" style={{ padding: "20px 24px" }}>
          <p style={{ fontSize: "14px", color: "var(--dark-gray)", lineHeight: "1.5" }}>
            Are you sure you want to permanently delete{" "}
            <strong>"{taskTitle}"</strong>? This action cannot be undone.
          </p>
        </div>

        <div className="modal-footer">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={onClose}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="button"
            className="btn btn-danger"
            onClick={onConfirm}
            disabled={loading}
          >
            <Trash2 size={15} />
            {loading ? "Deleting..." : "Delete Permanently"}
          </button>
        </div>
      </div>
    </div>
  );
}
