const mongoose = require('mongoose');

const SubTaskSchema = new mongoose.Schema({
    name: String,
    isDone: { type: Boolean, default: false },
});

const TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isDone: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' , required: true },
    isImportant: { type: Boolean, default: false, required: true },
    dueDate: {type:Date, required: false},
    tags: [String],
    subTasks: [SubTaskSchema],
});

const SectionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    tasks: [TaskSchema],
});

// Export the model
module.exports = mongoose.model("Section", SectionSchema);