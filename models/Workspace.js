const mongoose = require('mongoose');

const WorkspaceSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: true 
    },
    userId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User', 
        required: true 
    },
    sections: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Section' 
    }],
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Make sure each user can only have one default workspace
WorkspaceSchema.pre('save', async function(next) {
    if (this.isDefault) {
        await this.constructor.updateMany(
            { userId: this.userId, _id: { $ne: this._id } },
            { isDefault: false }
        );
    }
    next();
});

module.exports = mongoose.model('Workspace', WorkspaceSchema);
