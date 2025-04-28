const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Section = require('./models/Sections');

dotenv.config();

const migrateSections = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB Connected for migration...');

        // Get all sections
        const sections = await Section.find({});
        console.log(`Found ${sections.length} sections to migrate`);

        for (const section of sections) {
            // Update tasks in each section
            if (section.tasks && section.tasks.length > 0) {
                section.tasks = section.tasks.map(task => ({
                    ...task,
                    priority: task.priority || 'low',
                    isImportant: typeof task.isImportant === 'boolean' ? task.isImportant : false,
                    dueDate: task.dueDate || null,
                    tags: task.tags || '',
                    subTasks: (task.subTasks || []).map(subtask => ({
                        ...subtask,
                        isDone: typeof subtask.isDone === 'boolean' ? subtask.isDone : false
                    }))
                }));
            }

            await section.save();
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
};

migrateSections();