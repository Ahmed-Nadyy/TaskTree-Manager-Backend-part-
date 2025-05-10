require('dotenv').config();
const { sendOTPEmail } = require('../utils/emailService');

const testEmail = async () => {
    try {
        const result = await sendOTPEmail('ahmedsabrymahmoud225@gmail.com', '123456');
        console.log('Email sent successfully:', result);
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

testEmail();
