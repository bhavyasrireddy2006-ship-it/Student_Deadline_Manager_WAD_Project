import { useState, useEffect, useMemo } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Plus,
  Loader2,
} from "lucide-react";
import API from "../services/api";
import TaskModal from "../components/TaskModal";
import { isTaskOverdue } from "../utils/dateUtils";

export default function CalendarView() {
  const [currentDate, setCurrentDate] = useState(new Date());
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState(null);

  useEffect(() => {
    let active = true;
    API.get("/tasks")
      .then((res) => {
        if (active) setTasks(res.data.tasks || []);
      })
      .catch((err) => {
        console.error("Failed to load tasks for calendar:", err.message);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const monthNames = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  // Build grid days for the month
  const calendarDays = useMemo(() => {
    const firstDayIndex = new Date(year, month, 1).getDay(); // 0 is Sunday
    const totalDaysInMonth = new Date(year, month + 1, 0).getDate();
    const prevMonthDaysCount = new Date(year, month, 0).getDate();

    const days = [];

    // Prev month padding
    for (let i = firstDayIndex - 1; i >= 0; i--) {
      days.push({
        date: new Date(year, month - 1, prevMonthDaysCount - i),
        isCurrentMonth: false,
      });
    }

    // Current month days
    for (let d = 1; d <= totalDaysInMonth; d++) {
      days.push({
        date: new Date(year, month, d),
        isCurrentMonth: true,
      });
    }

    // Next month padding to complete 35 or 42 cells
    const remaining = 7 - (days.length % 7);
    if (remaining < 7) {
      for (let j = 1; j <= remaining; j++) {
        days.push({
          date: new Date(year, month + 1, j),
          isCurrentMonth: false,
        });
      }
    }

    return days;
  }, [year, month]);

  // Map tasks to dates (YYYY-MM-DD)
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach((task) => {
      const d = new Date(task.deadline);
      const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
      if (!map[key]) map[key] = [];
      map[key].push(task);
    });
    return map;
  }, [tasks]);

  const today = new Date();
  const isDateToday = (d) =>
    d.getDate() === today.getDate() &&
    d.getMonth() === today.getMonth() &&
    d.getFullYear() === today.getFullYear();

  const handleTaskClick = (task, e) => {
    e.stopPropagation();
    setEditingTask(task);
    setIsTaskModalOpen(true);
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
          marginBottom: "20px",
          flexWrap: "wrap",
          gap: "14px",
        }}
      >
        <div>
          <h2 style={{ fontSize: "24px", fontWeight: "700", color: "var(--black)" }}>
            Academic Calendar
          </h2>
          <p style={{ color: "var(--medium-gray)", fontSize: "14px" }}>
            Monthly visual schedule of assignments, tests, and deliverables
          </p>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <button className="btn btn-secondary btn-sm" onClick={handleToday}>
            Today
          </button>
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <button
              className="btn-icon"
              onClick={handlePrevMonth}
              title="Previous Month"
            >
              <ChevronLeft size={18} />
            </button>
            <span
              style={{
                fontSize: "16px",
                fontWeight: "700",
                minWidth: "150px",
                textAlign: "center",
                color: "var(--black)",
              }}
            >
              {monthNames[month]} {year}
            </span>
            <button
              className="btn-icon"
              onClick={handleNextMonth}
              title="Next Month"
            >
              <ChevronRight size={18} />
            </button>
          </div>
          <button
            className="btn btn-primary"
            onClick={() => {
              setEditingTask(null);
              setIsTaskModalOpen(true);
            }}
          >
            <Plus size={16} />
            <span>Add Task</span>
          </button>
        </div>
      </div>

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
            Loading calendar events...
          </p>
        </div>
      ) : (
        <div className="calendar-container">
          <div className="calendar-grid-header">
            <div>Sun</div>
            <div>Mon</div>
            <div>Tue</div>
            <div>Wed</div>
            <div>Thu</div>
            <div>Fri</div>
            <div>Sat</div>
          </div>

          <div className="calendar-grid-days">
            {calendarDays.map((cell, idx) => {
              const key = `${cell.date.getFullYear()}-${cell.date.getMonth()}-${cell.date.getDate()}`;
              const dayTasks = tasksByDate[key] || [];
              const todayClass = isDateToday(cell.date) ? "is-today" : "";
              const monthClass = cell.isCurrentMonth ? "" : "other-month";

              return (
                <div
                  key={idx}
                  className={`calendar-day-cell ${todayClass} ${monthClass}`}
                >
                  <span className="calendar-day-num">
                    {cell.date.getDate()}
                  </span>

                  <div className="calendar-tasks-list">
                    {dayTasks.map((t) => {
                      const isCompleted = t.status === "Completed";
                      const isOverdue = isTaskOverdue(t);

                      let borderColor = "var(--border)";
                      let textColor = "var(--dark-gray)";

                      if (isCompleted) {
                        borderColor = "var(--status-green)";
                        textColor = "var(--status-green-dark)";
                      } else if (isOverdue) {
                        borderColor = "var(--status-red)";
                        textColor = "var(--status-red)";
                      } else if (t.priority === "High") {
                        borderColor = "var(--status-amber)";
                        textColor = "var(--status-amber-dark)";
                      }

                      return (
                        <div
                          key={t._id}
                          className="calendar-task-chip"
                          onClick={(e) => handleTaskClick(t, e)}
                          title={`${t.title} (${t.subject}) - ${t.status}`}
                          style={{
                            borderLeft: `3px solid ${borderColor}`,
                            color: textColor,
                          }}
                        >
                          {t.title}
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Task Modal */}
      {isTaskModalOpen && (
        <TaskModal
          key={editingTask ? editingTask._id : "new-calendar-task"}
          isOpen={isTaskModalOpen}
          onClose={() => {
            setIsTaskModalOpen(false);
            setEditingTask(null);
          }}
          onTaskSaved={handleTaskSaved}
          initialTask={editingTask}
        />
      )}
    </div>
  );
}
