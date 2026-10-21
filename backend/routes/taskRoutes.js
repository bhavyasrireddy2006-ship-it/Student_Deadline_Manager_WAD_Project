const express = require("express");

const {
  createTask,
  getTasks,
  getTask,
  updateTask,
  deleteTask,
} = require("../controllers/taskController");

const authMiddleware = require("../middleware/authMiddleware");

const router = express.Router();

// Create a task
router.post("/", authMiddleware, createTask);

// Get all tasks
router.get("/", authMiddleware, getTasks);

// Get one task
router.get("/:id", authMiddleware, getTask);

// Update a task
router.put("/:id", authMiddleware, updateTask);

// Delete a task
router.delete("/:id", authMiddleware, deleteTask);

module.exports = router;