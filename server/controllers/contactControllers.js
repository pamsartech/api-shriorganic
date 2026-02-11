import { sendContactUsEmail } from "../utils/sendEmail.js";

// to add the contact us button 
export const contactus = async (req, res) => {
    try {

        const { name, email, phone, message } = req.body;

        if (!name || !email || !message || !phone) {
            return res.status(400).json({
                success: false,
                message: "All fields are required"
            })
        }

        // send an email
        const subject = `New Contact Us Message from ${name}`;
        const text = `
            Name: ${name}
            Email: ${email}
            Phone: ${phone}
            Message: ${message}
        `;

        // Send to Admin
        await sendContactUsEmail(process.env.USER_EMAIL, subject, text);

        res.status(200).json({
            success: true,
            message: "Message sent successfully ! We will contact you soon."
        })
    } catch (error) {
        res.status(500).json({
            success: false,
            message: "Failed to send message",
            error: error.message
        })
    }
}