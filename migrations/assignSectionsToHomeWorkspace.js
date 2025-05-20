const mongoose = require('mongoose');
const Section = require('../models/Sections');
const Workspace = require('../models/Workspace');
const db = require('../config/db');

async function migrateExistingSections() {
    try {
        await db(); // Connect to database
        console.log('Connected to database');

        // Get all sections without a workspace
        const sectionsWithoutWorkspace = await Section.find({ workspace: null });
        console.log(`Found ${sectionsWithoutWorkspace.length} sections without workspace`);

        // Group sections by userId
        const sectionsByUser = sectionsWithoutWorkspace.reduce((acc, section) => {
            if (!acc[section.userId]) {
                acc[section.userId] = [];
            }
            acc[section.userId].push(section);
            return acc;
        }, {});

        // For each user
        for (const userId of Object.keys(sectionsByUser)) {
            // Check if user has a default workspace
            let homeWorkspace = await Workspace.findOne({ userId: userId, isDefault: true });

            // If no default workspace exists, create one
            if (!homeWorkspace) {
                homeWorkspace = new Workspace({
                    name: "Home",
                    userId: userId,
                    isDefault: true
                });
                await homeWorkspace.save();
                console.log(`Created Home workspace for user ${userId}`);
            }

            // Update all sections for this user to point to the home workspace
            const sections = sectionsByUser[userId];
            const sectionIds = sections.map(s => s._id);

            await Section.updateMany(
                { _id: { $in: sectionIds } },
                { workspace: homeWorkspace._id }
            );

            // Add section references to the workspace
            await Workspace.findByIdAndUpdate(
                homeWorkspace._id,
                { $addToSet: { sections: { $each: sectionIds } } }
            );

            console.log(`Updated ${sections.length} sections for user ${userId}`);
        }

        console.log('Migration completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Migration failed:', error);
        process.exit(1);
    }
}

migrateExistingSections();
