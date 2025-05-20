const Workspace = require('../models/Workspace');
const Section = require('../models/Sections');

exports.createWorkspace = async (req, res) => {
    const { name, userId } = req.body;
    
    try {
        // Check if this is the user's first workspace
        const workspaceCount = await Workspace.countDocuments({ userId });
        const isDefault = workspaceCount === 0;

        if (isDefault) {
            // Create default "Home" workspace for new users
            const homeWorkspace = new Workspace({
                name: "Home",
                userId,
                isDefault: true
            });
            
            // Find any existing sections without a workspace
            const orphanedSections = await Section.find({ userId, workspace: null });
            
            // Add sections to the home workspace
            homeWorkspace.sections = orphanedSections.map(section => section._id);
            await homeWorkspace.save();
            
            // Update the sections to point to the home workspace
            await Section.updateMany(
                { _id: { $in: orphanedSections.map(s => s._id) } },
                { workspace: homeWorkspace._id }
            );

            // If the request was specifically for creating the home workspace, return it
            if (name === "Home") {
                return res.status(201).json(homeWorkspace);
            }
        }

        // Create the requested workspace (if not home)
        const workspace = new Workspace({
            name,
            userId,
            isDefault: false
        });

        await workspace.save();
        res.status(201).json(workspace);
    } catch (error) {
        res.status(500).json({ message: "Failed to create workspace", error: error.message });
    }
};

exports.getWorkspaces = async (req, res) => {
    try {
        const { userId } = req.params;
        
        // Check if user has a default workspace
        let workspaces = await Workspace.find({ userId }).populate('sections');
        
        if (workspaces.length === 0) {
            // Create default "Home" workspace if none exist
            const homeWorkspace = new Workspace({
                name: "Home",
                userId,
                isDefault: true
            });
            
            // Find any existing sections without a workspace
            const orphanedSections = await Section.find({ userId, workspace: null });
            homeWorkspace.sections = orphanedSections.map(section => section._id);
            await homeWorkspace.save();
            
            // Update the sections to point to the home workspace
            await Section.updateMany(
                { _id: { $in: orphanedSections.map(s => s._id) } },
                { workspace: homeWorkspace._id }
            );
            
            workspaces = [await homeWorkspace.populate('sections')];
        } else if (!workspaces.find(w => w.isDefault)) {
            // If no default workspace exists but there are workspaces, set the first one as default
            const firstWorkspace = workspaces[0];
            firstWorkspace.isDefault = true;
            await firstWorkspace.save();
        }
        
        res.status(200).json(workspaces);
    } catch (error) {
        res.status(500).json({ message: "Error fetching workspaces", error: error.message });
    }
};

exports.updateWorkspace = async (req, res) => {
    const { name } = req.body;
    try {
        const workspace = await Workspace.findByIdAndUpdate(
            req.params.id,
            { name },
            { new: true }
        );
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.status(200).json(workspace);
    } catch (error) {
        res.status(500).json({ message: "Error updating workspace", error: error.message });
    }
};

exports.deleteWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Don't allow deletion of the default workspace
        if (workspace.isDefault) {
            return res.status(400).json({ message: "Cannot delete the default workspace" });
        }

        // Move all sections to the default workspace
        const defaultWorkspace = await Workspace.findOne({ 
            userId: workspace.userId,
            isDefault: true
        });

        if (defaultWorkspace) {
            defaultWorkspace.sections.push(...workspace.sections);
            await defaultWorkspace.save();
        }

        await workspace.remove();
        res.status(200).json({ message: "Workspace deleted" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting workspace", error: error.message });
    }
};

exports.setDefaultWorkspace = async (req, res) => {
    try {
        const workspace = await Workspace.findById(req.params.id);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }

        // Set all other workspaces as non-default
        await Workspace.updateMany(
            { userId: workspace.userId },
            { isDefault: false }
        );

        // Set this workspace as default
        workspace.isDefault = true;
        await workspace.save();

        res.status(200).json(workspace);
    } catch (error) {
        res.status(500).json({ message: "Error setting default workspace", error: error.message });
    }
};

exports.addSectionToWorkspace = async (req, res) => {
    try {
        const { workspaceId, sectionId } = req.params;
        
        const workspace = await Workspace.findById(workspaceId);
        const section = await Section.findById(sectionId);

        if (!workspace || !section) {
            return res.status(404).json({ message: "Workspace or section not found" });
        }

        if (!workspace.sections.includes(sectionId)) {
            workspace.sections.push(sectionId);
            await workspace.save();
        }

        res.status(200).json(workspace);
    } catch (error) {
        res.status(500).json({ message: "Error adding section to workspace", error: error.message });
    }
};
