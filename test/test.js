// Import required modules
const express = require("express");
const mongoose = require("mongoose");
const bodyParser = require("body-parser");
const cors = require("cors");

// Initialize the app
const app = express();
app.use(bodyParser.json());
app.use(cors());

// Connect to MongoDB
mongoose.connect("mongodb://localhost:27017/notesTasks", {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on("error", console.error.bind(console, "connection error:"));
db.once("open", () => {
    console.log("Connected to MongoDB");
});

// Define Schemas and Models
const SubTaskSchema = new mongoose.Schema({
    name: String,
    isDone: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema({
    name: String,
    description: String,
    isDone: { type: Boolean, default: false },
    subTasks: [SubTaskSchema],
});

const SectionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    tasks: [TaskSchema],
});

const Section = mongoose.model("Section", SectionSchema);

// Routes

// Create a new section
app.post("/sections", async (req, res) => {
    const { userId, name } = req.body;
    try {
        const section = new Section({ userId, name, tasks: [] });
        await section.save();
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error creating section", error });
    }
});

// Get all sections for a user
app.get("/sections/:userId", async (req, res) => {
    try {
        const sections = await Section.find({ userId: req.params.userId });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sections", error });
    }
});

// Update a section
app.put("/sections/:id", async (req, res) => {
    const { name } = req.body;
    try {
        const section = await Section.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error updating section", error });
    }
});

// Delete a section
app.delete("/sections/:id", async (req, res) => {
    try {
        await Section.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Section deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting section", error });
    }
});

// Add a task to a section
app.post("/sections/:id/tasks", async (req, res) => {
    const { name, description } = req.body;
    try {
        const section = await Section.findById(req.params.id);
        section.tasks.push({ name, description, isDone: false, subTasks: [] });
        await section.save();
        res.status(201).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error adding task", error });
    }
});

// Update a task
app.put("/sections/:sectionId/tasks/:taskId", async (req, res) => {
    const { name, description, isDone } = req.body;
    try {
        const section = await Section.findById(req.params.sectionId);
        const task = section.tasks.id(req.params.taskId);
        if (task) {
            task.name = name;
            task.description = description;
            task.isDone = isDone;
            await section.save();
            res.status(200).json(section);
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating task", error });
    }
});

// Delete a task
app.delete("/sections/:sectionId/tasks/:taskId", async (req, res) => {
    try {
        const section = await Section.findById(req.params.sectionId);
        section.tasks.id(req.params.taskId).remove();
        await section.save();
        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error deleting task", error });
    }
});

// Add a subtask to a task
app.post("/sections/:sectionId/tasks/:taskId/subtasks", async (req, res) => {
    const { name } = req.body;
    try {
        const section = await Section.findById(req.params.sectionId);
        const task = section.tasks.id(req.params.taskId);
        if (task) {
            task.subTasks.push({ name, isDone: false });
            await section.save();
            res.status(201).json(section);
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error adding subtask", error });
    }
});

// Update a subtask
app.put("/sections/:sectionId/tasks/:taskId/subtasks/:subTaskId", async (req, res) => {
    const { name, isDone } = req.body;
    try {
        const section = await Section.findById(req.params.sectionId);
        const task = section.tasks.id(req.params.taskId);
        const subTask = task.subTasks.id(req.params.subTaskId);
        if (subTask) {
            subTask.name = name;
            subTask.isDone = isDone;
            await section.save();
            res.status(200).json(section);
        } else {
            res.status(404).json({ message: "Subtask not found" });
        }
    } catch (error) {
        res.status(500).json({ message: "Error updating subtask", error });
    }
});

// Delete a subtask
app.delete("/sections/:sectionId/tasks/:taskId/subtasks/:subTaskId", async (req, res) => {
    try {
        const section = await Section.findById(req.params.sectionId);
        const task = section.tasks.id(req.params.taskId);
        task.subTasks.id(req.params.subTaskId).remove();
        await section.save();
        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error deleting subtask", error });
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
