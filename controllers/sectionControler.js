const Section = require('../models/Sections');
const { v4: uuidv4 } = require('uuid');
const { sendTaskAssignmentEmail } = require('../utils/emailService');

exports.addSection = async (req, res) => {
    const { userId, name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Section name is required and must be a non-empty string." });
    }
    try {
        const section = new Section({ userId, name: name.trim(), tasks: [] });
        await section.save();
        res.status(201).json(section);
    } catch (error) {
        //console.error("Error creating section:", error); 
        res.status(500).json({ message: "Failed to create section.", error: error.message });
    }
};

exports.getSection = async (req, res) => {
    try {
        const sections = await Section.find({ userId: req.params.userId });
        res.status(200).json(sections);
    } catch (error) {
        res.status(500).json({ message: "Error fetching sections", error });
    }
};

exports.updateSection = async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Section name is required and must be a non-empty string for update." });
    }
    try {
        const section = await Section.findByIdAndUpdate(
            req.params.id,
            { name: name.trim() },
            { new: true, runValidators: true } // Added runValidators
        );
        if (!section) {
            return res.status(404).json({ message: "Section not found for update." });
        }
        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ message: "Failed to update section.", error: error.message });
    }
};

exports.deleteSection = async (req, res) => {
    try {
        await Section.findByIdAndDelete(req.params.id);
        res.status(200).json({ message: "Section deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting section", error });
    }
};

exports.addTask = async (req, res) => {    const { name, description, priority, isImportant, dueDate, tags, assignedTo } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Task name is required and must be a non-empty string." });
    }
    try {
        const section = await Section.findById(req.params.id);
        if (!section) {
            return res.status(404).json({ message: "Section not found when trying to add task." });
        }

        const newTask = {
            name: name.trim(),
            description,
            isDone: false,
            priority: priority || 'low',
            isImportant: isImportant || false,
            dueDate: dueDate || null,
            tags: tags || [],
            assignedTo: assignedTo || [],
            subTasks: []
        };

        section.tasks.push(newTask);
        await section.save();

        // Return just the newly added task
        const addedTask = section.tasks[section.tasks.length - 1];
        res.status(201).json({
            message: "Task added successfully",
            task: addedTask
        });
    } catch (error) {
        console.error("Error adding task:", error);
        res.status(500).json({ message: "Error adding task", error: error.message });
    }
};

exports.updateTask = async (req, res) => {
    const { name, description, isDone, priority, isImportant, dueDate, tags } = req.body;

    try {
        // Find section by ID
        const section = await Section.findById(req.params.sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        // Find task inside the section
        const task = section.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        // Update task properties only if values are provided
        if (name !== undefined) task.name = name;
        if (description !== undefined) task.description = description;
        if (isDone !== undefined) {
            task.isDone = isDone;
            // If marking task as done, check if it has subtasks
            if (isDone && task.subTasks && task.subTasks.length > 0) {
                // Mark all subtasks as done
                task.subTasks.forEach(subtask => {
                    subtask.isDone = true;
                });
            }
        }
        if (priority !== undefined) task.priority = priority;
        if (isImportant !== undefined) task.isImportant = isImportant;
        if (dueDate !== undefined) task.dueDate = dueDate;
        if (tags !== undefined) task.tags = tags;

        // Mark as modified to ensure Mongoose detects the changes
        section.markModified("tasks");

        await section.save();

        res.status(200).json({ 
            message: "Task updated successfully", 
            task,
            success: true
        });
    } catch (error) {
        console.error("Error updating task:", error);
        res.status(500).json({ 
            message: "Error updating task", 
            error: error.message,
            success: false
        });
    }
};

exports.deleteTask = async (req, res) => {
    try {
        const { sectionId, taskId } = req.params;
        
        // Check if the section exists
        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        // Check if the task exists in the section
        const task = section.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found in this section" });
        }

        // Remove the task from the section
        task.deleteOne(); // Properly removes the task

        // Save the updated section
        await section.save();

        res.status(200).json({ message: "Task deleted successfully", section });
    } catch (error) {
        console.error("Error deleting task:", error);
        res.status(500).json({ message: "Error deleting task", error });
    }
};

exports.markTaskAsDone = async (req, res) => {
    try {
        const { sectionId, taskId } = req.params;

        // --- CHANGE: Check if isDone is explicitly provided in the body ---
        if (req.body.isDone === undefined || typeof req.body.isDone !== 'boolean') {
            return res.status(400).json({
                message: "Request body must contain an 'isDone' property with a boolean value (true or false).",
                success: false
            });
        }
        const isDone = req.body.isDone; // Get the boolean value directly from the body
        // --- END CHANGE ---

        console.log(`Attempting to mark task ${taskId} in section ${sectionId} as: ${isDone}`);

        // Find the section containing the task
        const section = await Section.findById(sectionId);
        if (!section) {
            console.log(`Section not found: ${sectionId}`);
            return res.status(404).json({ message: "Section not found", success: false });
        }

        // Find the task within the section's tasks array
        const task = section.tasks.id(taskId);
        if (!task) {
            console.log(`Task not found: ${taskId} in section ${sectionId}`);
            return res.status(404).json({ message: "Task not found", success: false });
        }

        // --- Update the task's status ---
        task.isDone = isDone;
        // --- End Update ---

        // --- Logic related to subtasks when marking the PARENT task ---
        // If marking parent task as DONE, mark all its subtasks as DONE.
        if (isDone && task.subTasks && task.subTasks.length > 0) {
            console.log(`Marking all subtasks as done for task ${taskId}`);
            task.subTasks.forEach(subtask => {
                subtask.isDone = true;
            });
        }
        // If marking parent task as NOT DONE, you might want to ensure at least one subtask is also not done,
        // but typically unchecking the parent implies the overall task isn't finished, regardless of subtasks.
        // No automatic change to subtasks is usually needed when setting parent task.isDone = false.

        // Mark the `tasks` array as modified to ensure Mongoose detects the change in the nested document
        section.markModified("tasks");

        // Save the section with the updated task
        await section.save();
        console.log(`Task ${taskId} status updated successfully to ${isDone}`);

        // Return the updated task data
        res.status(200).json({
            message: isDone ? "Task marked as done" : "Task marked as incomplete",
            task: task, // Send back the updated task object
            success: true
        });

    } catch (error) {
        console.error("Error marking task status:", error);
        res.status(500).json({
            message: "Error marking task status",
            error: error.message,
            success: false
        });
    }
};

exports.addSubTask = async (req, res) => {
    const { name } = req.body;
    if (!name || typeof name !== 'string' || name.trim() === '') {
        return res.status(400).json({ message: "Subtask name is required and must be a non-empty string." });
    }
    try {
        const section = await Section.findById(req.params.sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found when trying to add subtask." });
        }
        const task = section.tasks.id(req.params.taskId);
        if (task) {
            // Push the new subtask
            task.subTasks.push({ name: name.trim(), isDone: false });
            // When a new subtask is added, make sure the task is marked as not done
            task.isDone = false;
            // Save changes to the section (which includes tasks and subtasks)
            await section.save();
            // Optionally you can return the newly added subtask instead of the whole section
            const addedSubTask = task.subTasks[task.subTasks.length - 1];
            // Send email notifications to assigned users if any
            if (task.assignedTo && Array.isArray(task.assignedTo) && task.assignedTo.length > 0) {
                const { sendSubtaskNotificationEmail } = require('../utils/emailService');
                const taskName = task.name;
                const subtaskName = addedSubTask.name;
                const taskLink = `${process.env.CLIENT_URL}/task/${section.userId}/${section._id}/${task._id}`;
                for (const assignee of task.assignedTo) {
                    if (assignee.email) {
                        await sendSubtaskNotificationEmail(assignee.email, taskName, subtaskName, taskLink);
                    }
                }
            }
            res.status(201).json({
                message: "SubTask added successfully",
                subTask: addedSubTask,
                taskDone: task.isDone
            });
        } else {
            res.status(404).json({ message: "Task not found" });
        }
    } catch (error) {
        console.error("Error adding subtask:", error);
        res.status(500).json({ message: "Failed to add subtask.", error: error.message });
    }
};

exports.updateSubTask = async (req, res) => {
    const { name, isDone } = req.body;
    // Validate name if provided
    if (name !== undefined && (typeof name !== 'string' || name.trim() === '')) {
        return res.status(400).json({ message: "Subtask name must be a non-empty string if provided." });
    }
    // Validate isDone if provided
    if (isDone !== undefined && typeof isDone !== 'boolean'){
        return res.status(400).json({ message: "isDone must be a boolean value if provided." });
    }

    try {
        const section = await Section.findById(req.params.sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found for subtask update." });
        }
        const task = section.tasks.id(req.params.taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found for subtask update." });
        }
        const subTask = task.subTasks.id(req.params.subTaskId);
        if (!subTask) {
            return res.status(404).json({ message: "Subtask not found for update." });
        }
        
        if (name !== undefined) subTask.name = name.trim();
        if (isDone !== undefined) subTask.isDone = isDone;
        
        await section.save();
        res.status(200).json({ 
            message: "Subtask updated successfully", 
            subTask 
        });
    } catch (error) {
        res.status(500).json({ message: "Failed to update subtask.", error: error.message });
    }
};

exports.deleteSubTask = async (req, res) => {
    try {
        const section = await Section.findById(req.params.sectionId);
        const task = section.tasks.id(req.params.taskId);
        task.subTasks.id(req.params.subTaskId).remove();
        await section.save();
        res.status(200).json(section);
    } catch (error) {
        res.status(500).json({ message: "Error deleting subtask", error });
    }
};

exports.markSubTaskAsDone = async (req, res) => {
    try {
        const { sectionId, taskId, subTaskId } = req.params;

        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ message: "Section not found" });
        }

        const task = section.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ message: "Task not found" });
        }

        const subTask = task.subTasks.id(subTaskId);
        if (!subTask) {
            return res.status(404).json({ message: "SubTask not found" });
        }

        // Mark the subtask as done
        subTask.isDone = true;

        // Check if all subtasks are done
        const allSubTasksDone = task.subTasks.every(sub => sub.isDone);

        // If all subtasks are done, mark the task as done
        if (allSubTasksDone) {
            task.isDone = true;
        }

        await section.save();

        res.status(200).json({ 
            message: "SubTask marked as done",
            subTask,
            taskDone: task.isDone
        });
        
    } catch (error) {
        console.error("Error marking subtask as done:", error);
        res.status(500).json({ message: "Error marking subtask as done", error: error.message });
    }
};

exports.shareSection = async (req, res) => {
    try {
        const section = await Section.findById(req.params.sectionId);
        
        if (!section) {
            return res.status(404).json({ error: "Section not found" });
        }

        // Generate share token if it doesn't exist
        if (!section.shareToken) {
            section.shareToken = uuidv4();
            section.isPublic = true;
            await section.save();
        }

        res.json({ 
            shareToken: section.shareToken,
            message: "Section shared successfully" 
        });
    } catch (error) {
        console.error('Share section error:', error);
        res.status(500).json({ 
            error: "Failed to share section",
            details: error.message 
        });
    }
};

exports.getSharedSection = async (req, res) => {
    try {
        const section = await Section.findOne({ 
            shareToken: req.params.token,
            isPublic: true 
        });

        if (!section) {
            return res.status(404).json({ error: "Shared section not found or no longer public" });
        }

        res.json(section);
    } catch (error) {
        console.error('Get shared section error:', error);
        res.status(500).json({ 
            error: "Failed to get shared section",
            details: error.message 
        });
    }
};

exports.assignTask = async (req, res) => {
    try {
        const { taskId, sectionId } = req.params;
        const { emails } = req.body;

        const section = await Section.findById(sectionId);
        if (!section) {
            return res.status(404).json({ error: "Section not found" });
        }

        const task = section.tasks.id(taskId);
        if (!task) {
            return res.status(404).json({ error: "Task not found" });
        }

        // Update task assignees
        task.assignedTo = emails.map(email => ({ email }));
        await section.save();

        // Send email notifications
        const taskLink = `${process.env.CLIENT_URL}/task/${section.userId}/${sectionId}/${taskId}`;
        console.log('Assigning task, sending emails to:', emails);
        for (const email of emails) {
            try {
                const result = await sendTaskAssignmentEmail(email, task, taskLink);
                console.log(`Email sent to ${email}:`, result);
            } catch (err) {
                console.error(`Failed to send email to ${email}:`, err.message);
            }
        }

        res.json({ 
            message: "Task assigned successfully",
            task 
        });
    } catch (error) {
        console.error('Assign task error:', error);
        res.status(500).json({ 
            error: "Failed to assign task",
            details: error.message 
        });
    }
};
