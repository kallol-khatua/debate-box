const nodemailer = require("nodemailer");

const mailSender = async (name, user, pass, email, otp) => {
    try {
        // Configure Nodemailer
        let transporter = nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: `${user}`,
              pass: `${pass}`,
            }
        });

        // mail option setup
        const mailOptions = {
            from: `${name} <${user}`,
            to: `${email}`,
            subject: `Verify your Email`,
            html: `
            <div style="font-family: Helvetica,Arial,sans-serif;min-width:1000px;overflow:auto;line-height:2">
              <div style="margin:50px auto;width:70%;padding:20px 0">
                <div style="border-bottom:1px solid #eee">
                  <a href="invito.onrender.com" style="font-size:1.4em;color: #00466a;text-decoration:none;font-weight:600">Invito</a>
                </div>
                <p style="font-size:1.1em">Hi,</p>
                <p>Thank you for choosing Invito. Use the following OTP to verify your email.</p>
                <h2 style="background: #00466a;margin: 0 auto;width: max-content;padding: 0 10px;color: #fff;border-radius: 4px;">${otp}</h2>
                <p style="font-size:0.9em;">Regards,<br />Invito</p>
                <hr style="border:none;border-top:1px solid #eee" />
                <div style="float:right;padding:8px 0;color:#aaa;font-size:0.8em;line-height:1;font-weight:300">
                  <p>Invito Pvt. Ltd.</p>
                  <P>India</p>
                </div>
              </div>
            </div>`
        };

        let info = await transporter.sendMail(mailOptions);

        // console.log("info: ",info);
        return info;
    } catch (e) {
        console.log("error is happening in sending mail during transporter creating", e);
    }
};

module.exports = mailSender;