const mongoose = require('mongoose');

// SubTask Schema
const SubTaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'in progress', 'done'], default: 'pending' },
    assignedTo: [
        {
            email: { type: String },
            status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
        }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    description: { type: String, default: '' },
    deadline: { type: Date },
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' }
}, { timestamps: true });

// Task Schema
const TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isDone: { type: Boolean, default: false },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // Use only this
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low', required: true },
    isImportant: { type: Boolean, default: false, required: true },
    dueDate: { type: Date },
    tags: [String],
    subTasks: [SubTaskSchema],
    assignedTo: [{
        email: { type: String },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
    }],
    lastNotified: { type: Date }
}, { timestamps: true }); // Optional but helpful

// Section Schema
const SectionSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    name: String,
    tasks: [TaskSchema],
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    isPubliclyViewable: { type: Boolean, default: false },
    sharedWith: [{
        email: { type: String },
        accessLevel: { type: String, enum: ['read', 'write'], default: 'read' }
    }]
}, { timestamps: true });

// Export the model
module.exports = mongoose.model("Section", SectionSchema);
