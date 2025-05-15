const mongoose = require('mongoose');

const SubTaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    isDone: { type: Boolean, default: false },
    status: { type: String, enum: ['pending', 'in progress', 'done'], default: 'pending' }, // Added status
    assignedTo: [
        {
            email: { type: String }, // Email of the assigned user
            status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' } // Assignment status
        }
    ],
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }, // New field to store creator's ID
    description: { type: String, default: '' }, // New field
    deadline: { type: Date }, // New field
    priority: { type: String, enum: ['Low', 'Medium', 'High'], default: 'Medium' } // New field
}, { timestamps: true });

const TaskSchema = new mongoose.Schema({
    name: { type: String, required: true },
    description: String,
    isDone: { type: Boolean, default: false },
    priority: { type: String, enum: ['low', 'medium', 'high'], default: 'low' , required: true },
    isImportant: { type: Boolean, default: false, required: true },
    dueDate: {type:Date, required: false},
    tags: [String],
    subTasks: [SubTaskSchema],
    assignedTo: [{
        email: { type: String },
        status: { type: String, enum: ['pending', 'accepted', 'declined'], default: 'pending' }
    }],
    creator: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    lastNotified: { type: Date }
});

const SectionSchema = new mongoose.Schema({
    userId: mongoose.Schema.Types.ObjectId,
    name: String,
    tasks: [TaskSchema],
    isPublic: { type: Boolean, default: false },
    shareToken: { type: String, unique: true, sparse: true },
    isPubliclyViewable: { type: Boolean, default: false },
    sharedWith: [{
        email: { type: String },
        accessLevel: { type: String, enum: ['read', 'write'], default: 'read' }
    }]
});

// Export the model
module.exports = mongoose.model("Section", SectionSchema);