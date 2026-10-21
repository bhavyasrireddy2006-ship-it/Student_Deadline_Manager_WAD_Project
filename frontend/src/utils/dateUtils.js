export const isTaskOverdue = (task) => {
  if (!task || task.status === "Completed") return false;
  const deadline = new Date(task.deadline);
  return deadline.getTime() < Date.now();
};

export const formatFullDateTime = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    hour12: true,
  });
};

export const formatShortDate = (dateString) => {
  if (!dateString) return "";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
  });
};

export const getDeadlineRelativeInfo = (deadlineString, status) => {
  if (status === "Completed") {
    return { text: "Completed", isOverdue: false, isUrgent: false };
  }

  const deadline = new Date(deadlineString).getTime();
  const now = Date.now();
  const diffMs = deadline - now;
  const diffHours = diffMs / (1000 * 60 * 60);
  const diffDays = Math.ceil(diffHours / 24);

  if (diffMs < 0) {
    const overdueDays = Math.abs(diffDays) || 1;
    return {
      text: overdueDays === 1 ? "Overdue (yesterday)" : `Overdue by ${overdueDays}d`,
      isOverdue: true,
      isUrgent: true,
    };
  }

  if (diffHours <= 24) {
    return {
      text: diffHours < 1 ? "Due in less than 1 hour!" : `Due in ${Math.round(diffHours)}h`,
      isOverdue: false,
      isUrgent: true,
    };
  }

  if (diffDays === 1) {
    return { text: "Due Tomorrow", isOverdue: false, isUrgent: true };
  }

  if (diffDays <= 3) {
    return { text: `Due in ${diffDays} days`, isOverdue: false, isUrgent: true };
  }

  return {
    text: `Due in ${diffDays} days`,
    isOverdue: false,
    isUrgent: false,
  };
};
