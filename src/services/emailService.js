const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const path = require('path');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
    }
});

// Configure Handlebars
const handlebarOptions = {
    viewEngine: {
        extName: '.hbs',
        partialsDir: path.resolve(__dirname, '../views/emails'),
        defaultLayout: false,
    },
    viewPath: path.resolve(__dirname, '../views/emails'),
    extName: '.hbs',
};

transporter.use('compile', hbs(handlebarOptions));

const sendEmail = async (to, subject, template, context) => {
    try {
        const mailOptions = {
            from: process.env.SMTP_USER,
            to,
            subject,
            template, // Name of the template file (without extension)
            context   // Data to pass to the template
        };

        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to} (Template: ${template})`);
    } catch (error) {
        console.error('❌ Email send error:', error);
    }
};

module.exports = sendEmail;
