const mongoose = require('mongoose');

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

// Export the model
module.exports = mongoose.model("Section", SectionSchema);