import twilio from "twilio";

const client = twilio(`${process.env.TWILIO_ACCOUNT_SID}`, `${process.env.TWILIO_AUTH_TOKEN}`);

// 1) send the sms

export const sendSms = async (to, subject, text) => {
    try {
        const messageBody = subject ? `${subject}: ${text}` : text;
        const message = await client.messages.create({
            body: messageBody,
            from: "+13608612411",
            to: to
        });
        console.log(`SMS sent successfully: ${message.sid}`);
    } catch (error) {
        console.log("Error sending SMS:", error.message);
    }
}


