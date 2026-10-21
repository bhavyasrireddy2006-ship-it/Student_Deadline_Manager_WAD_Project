const Task = require("../models/Task");

// CREATE TASK
const createTask = async (req, res) => {
  try {
    const {
      title,
      subject,
      description,
      taskType,
      deadline,
      priority,
      estimatedHours,
      progress,
      status,
    } = req.body;

    if (!title || !subject || !deadline) {
      return res.status(400).json({
        message: "Please fill all required fields: title, subject, and deadline",
      });
    }

    const task = await Task.create({
      user: req.user.userId,
      title: title.trim(),
      subject: subject.trim(),
      description: description || "",
      taskType: taskType || "Assignment",
      deadline,
      priority: priority || "Medium",
      estimatedHours:
        estimatedHours !== undefined && estimatedHours !== ""
          ? Number(estimatedHours)
          : 1,
      progress:
        progress !== undefined && progress !== "" ? Number(progress) : 0,
      status: status || "Pending",
    });

    res.status(201).json({
      message: "Task created successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to create task",
      error: error.message,
    });
  }
};

// GET ALL TASKS
const getTasks = async (req, res) => {
  try {
    const tasks = await Task.find({
      user: req.user.userId,
    }).sort({ deadline: 1 });

    res.json({
      tasks,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch tasks",
      error: error.message,
    });
  }
};

// GET SINGLE TASK
const getTask = async (req, res) => {
  try {
    const task = await Task.findOne({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to fetch task",
      error: error.message,
    });
  }
};

// UPDATE TASK
const updateTask = async (req, res) => {
  try {
    const updates = { ...req.body };
    delete updates.user;

    const task = await Task.findOneAndUpdate(
      {
        _id: req.params.id,
        user: req.user.userId,
      },
      updates,
      {
        returnDocument: "after",
        runValidators: true,
      }
    );

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task updated successfully",
      task,
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to update task",
      error: error.message,
    });
  }
};

// DELETE TASK
const deleteTask = async (req, res) => {
  try {
    const task = await Task.findOneAndDelete({
      _id: req.params.id,
      user: req.user.userId,
    });

    if (!task) {
      return res.status(404).json({
        message: "Task not found",
      });
    }

    res.json({
      message: "Task deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      message: "Failed to delete task",
      error: error.message,
    });
  }
};

module.exports = {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
};