const nodemailer = require("nodemailer");
const sendEmail = async(option)=>{
    // create transporter 
const transporter =nodemailer.createTransport({
    host:process.env.EMAIL_HOST,
    port:process.env.EMAIL_PORT,
    auth:{
        user:process.env.EMAIL_USER,
        pass:process.env.EMAIL_PASSWORD
    }
})
// define mail 
const mailOptions = {
    from: 'Booker support<support@booker.com>',
    to: option.email,
    subject:option.subject,
    text:option.message
}

await transporter.sendMail(mailOptions);
}
module.exports = sendEmail;