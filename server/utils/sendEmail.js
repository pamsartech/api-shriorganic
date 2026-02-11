import nodemailer from "nodemailer";



let transporter = null;


const getTransporter = () => {
    if (!transporter) {
        transporter = nodemailer.createTransport({
            host: "smtp.gmail.com",
            port: 587,
            secure: false,
            auth: {
                user: process.env.USER_EMAIL,
                pass: process.env.EMAIL_PASSWORD
            }
        });
    }
    return transporter;
};

// 1) send the signin mail
export const sendSigninEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}


// 2)register mail
export const sendRegisterEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}

// 3)log out mail
export const sendLogoutEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}

// 4)password change mail
export const sendPasswordChangeEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}

// 5)order upadate mail
export const sendOrderUpdateEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}

// 7)profile update mail
export const sendProfileUpdateEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}


// 6) contact us mail
export const sendContactUsEmail = async (to, subject, text) => {
    try {
        const mailOptions = {
            from: process.env.USER_EMAIL,
            to,
            subject,
            text
        };

        await getTransporter().sendMail(mailOptions);
        console.log("Email sent successfully");
    } catch (error) {
        console.log(error);
    }
}
