const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const app = express();

// Middleware
app.use(bodyParser.json());

// MongoDB connection
mongoose.connect('mongodb://localhost:27017/notes_tasks', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'MongoDB connection error:'));
db.once('open', () => {
    console.log('Connected to MongoDB');
});

// Models
const SubTaskSchema = new mongoose.Schema({
    name: String,
    isDone: Boolean,
});

const TaskSchema = new mongoose.Schema({
    name: String,
    description: String,
    isDone: Boolean,
    subTasks: [SubTaskSchema],
});

const SectionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    tasks: [TaskSchema],
});

const UserSchema = new mongoose.Schema({
    email: String,
    password: String,
});

const User = mongoose.model('User', UserSchema);
const Section = mongoose.model('Section', SectionSchema);

// Routes

// User routes
app.post('/api/register', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = new User({ email, password });
        await user.save();
        res.status(201).send('User registered successfully');
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/api/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        const user = await User.findOne({ email, password });
        if (!user) return res.status(401).send('Invalid credentials');
        res.status(200).send({ userId: user._id });
    } catch (error) {
        res.status(400).send(error);
    }
});

// Section routes
app.get('/api/sections/:userId', async (req, res) => {
    const { userId } = req.params;
    try {
        const sections = await Section.find({ userId });
        res.status(200).send(sections);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.post('/api/sections', async (req, res) => {
    const { userId, name } = req.body;
    try {
        const section = new Section({ userId, name, tasks: [] });
        await section.save();
        res.status(201).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.put('/api/sections/:id', async (req, res) => {
    const { id } = req.params;
    const { name } = req.body;
    try {
        const section = await Section.findByIdAndUpdate(id, { name }, { new: true });
        res.status(200).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/api/sections/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Section.findByIdAndDelete(id);
        res.status(200).send('Section deleted');
    } catch (error) {
        res.status(400).send(error);
    }
});

// Task routes
app.post('/api/sections/:sectionId/tasks', async (req, res) => {
    const { sectionId } = req.params;
    const { name, description } = req.body;
    try {
        const section = await Section.findById(sectionId);
        section.tasks.push({ name, description, isDone: false, subTasks: [] });
        await section.save();
        res.status(201).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.put('/api/tasks/:sectionId/:taskId', async (req, res) => {
    const { sectionId, taskId } = req.params;
    const { name, description, isDone } = req.body;
    try {
        const section = await Section.findById(sectionId);
        const task = section.tasks.id(taskId);
        Object.assign(task, { name, description, isDone });
        await section.save();
        res.status(200).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/api/tasks/:sectionId/:taskId', async (req, res) => {
    const { sectionId, taskId } = req.params;
    try {
        const section = await Section.findById(sectionId);
        section.tasks.id(taskId).remove();
        await section.save();
        res.status(200).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Subtask routes
app.post('/api/tasks/:sectionId/:taskId/subtasks', async (req, res) => {
    const { sectionId, taskId } = req.params;
    const { name } = req.body;
    try {
        const section = await Section.findById(sectionId);
        const task = section.tasks.id(taskId);
        task.subTasks.push({ name, isDone: false });
        await section.save();
        res.status(201).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.put('/api/subtasks/:sectionId/:taskId/:subTaskId', async (req, res) => {
    const { sectionId, taskId, subTaskId } = req.params;
    const { name, isDone } = req.body;
    try {
        const section = await Section.findById(sectionId);
        const task = section.tasks.id(taskId);
        const subTask = task.subTasks.id(subTaskId);
        Object.assign(subTask, { name, isDone });
        await section.save();
        res.status(200).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

app.delete('/api/subtasks/:sectionId/:taskId/:subTaskId', async (req, res) => {
    const { sectionId, taskId, subTaskId } = req.params;
    try {
        const section = await Section.findById(sectionId);
        const task = section.tasks.id(taskId);
        task.subTasks.id(subTaskId).remove();
        await section.save();
        res.status(200).send(section);
    } catch (error) {
        res.status(400).send(error);
    }
});

// Start the server
const PORT = 5000;
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});

