const nodemailer = require('nodemailer');

// Create reusable transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    }
});

// Verify transporter configuration
const verifyTransporter = async () => {
    try {
        await transporter.verify();
        console.log('Email service is ready to send emails');
        return true;
    } catch (error) {
        console.error('Email service verification failed:', error);
        return false;
    }
};

const sendOTPEmail = async (to, otp) => {
    try {
        // Verify transporter first
        const isReady = await verifyTransporter();
        if (!isReady) {
            throw new Error('Email service is not properly configured');
        }

        console.log('Attempting to send OTP email to:', to);
        
        const mailOptions = {
            from: `"Tad System" <${process.env.EMAIL_USER}>`,
            to,
            subject: 'Your OTP for Tad System Registration',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                    <h2 style="color: #2c3e50;">Verify Your Email</h2>
                    <p>Your OTP code for Tad System registration is:</p>
                    <h1 style="color: #3498db; font-size: 36px; letter-spacing: 5px;">${otp}</h1>
                    <p>This code will expire in 10 minutes.</p>
                    <p style="color: #7f8c8d;">If you didn't request this code, please ignore this email.</p>
                </div>
            `
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('Email sent successfully. MessageId:', info.messageId);
        return true;
    } catch (error) {
        console.error('Email sending failed:', {
            error: error.message,
            stack: error.stack,
            to,
            emailUser: process.env.EMAIL_USER
        });
        throw error;
    }
};

const sendTaskAssignmentEmail = async (to, task, link) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `Task Assignment: ${task.name}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">New Task Assignment</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <h3 style="color: #3498db;">${task.name}</h3>
                    <p><strong>Description:</strong> ${task.description || 'No description provided'}</p>
                    <p><strong>Due Date:</strong> ${task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No due date set'}</p>
                    <p><strong>Priority:</strong> ${task.priority || 'Normal'}</p>
                </div>
                <div style="margin-top: 20px;">
                    <a href="${link}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

const sendSubtaskNotificationEmail = async (to, taskName, subtaskName, link) => {
    const mailOptions = {
        from: process.env.EMAIL_USER,
        to,
        subject: `New Subtask Added: ${taskName}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2 style="color: #2c3e50;">New Subtask Added</h2>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 5px;">
                    <p>A new subtask has been added to your assigned task:</p>
                    <h3 style="color: #3498db;">Task: ${taskName}</h3>
                    <p><strong>New Subtask:</strong> ${subtaskName}</p>
                </div>
                <div style="margin-top: 20px;">
                    <a href="${link}" style="background: #3498db; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">View Task</a>
                </div>
            </div>
        `
    };

    try {
        await transporter.sendMail(mailOptions);
        return true;
    } catch (error) {
        console.error('Email sending failed:', error);
        return false;
    }
};

// Export all email functions
module.exports = {
    sendOTPEmail,
    sendTaskAssignmentEmail,
    sendSubtaskNotificationEmail,
    verifyTransporter
};
