const nodemailer = require("nodemailer");
const pug = require("pug");
const htmlToText = require("html-to-text");

// WE WILL CREATE A MORE REBUST EMAIL SYSTEM
module.exports = class Email {
  constructor(user, url) {
    this.to = user.email;
    this.firstName = user.name.split(" ")[0];
    this.url = url;
    this.from = `Abanwa Chinaza <${process.env.EMAIL_FROM}>`;
  }

  newTransport() {
    if (process.env.NODE_ENV === "production") {
      // sendGrid
      return nodemailer.createTransport({
        service: 'SendGrid',
        auth: {
          user: process.env.SENDGRID_USERNAME,
          pass: process.env.SENDGRID_PASSWORD
        }
      })
    }

    // if we are in "development", this will be returned
    return nodemailer.createTransport({
      host: process.env.EMAIL_HOST,
      port: process.env.EMAIL_PORT,
      auth: {
        user: process.env.EMAIL_USERNAME,
        pass: process.env.EMAIL_PASSWORD
      }
    });
  }

  async send(template, subject) {
    // send the actual email
    // 1) Render the HTML for the email base on the pug template
    // this will take in a file and render the pug code into real HTML
    const html = pug.renderFile(`${__dirname}/../views/email/${template}.pug`, {
      firstName: this.firstName,
      url: this.url,
      subject
    });

    // 2) Define email options
    const mailOptions = {
      from: this.from,
      to: this.to,
      subject: subject,
      html,
      text: htmlToText.fromString(html)
    };

    // 3) Create a transport and send email
    await this.newTransport().sendMail(mailOptions);
  }

  async sendWelcome() {
    await this.send("Welcome", "Welcome to the Natours Family");
  }

  async sendPasswordReset() {
    await this.send(
      "passwordReset",
      "Your password reset token (valid for only 10 minutes"
    );
  }
};

/*
// we will create the function to send email to the user uisng nodemailer
const sendEmail = async (options) => {
  // We will follow three steps in order to send an email using nodemailer
  // the transport is actually a service that will send the email and not nodejs
  // Activate in gmail "less secure app" option if we are using gmail
  // 1) Create a transporter
  const transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST,
    port: process.env.EMAIL_PORT,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });

  // Here, we will specify where the email is coming from
  // 2) Define the email options
  const mailOptions = {
    from: "Abanwa Chinaza <abanwachinaza@gmail.com>",
    to: options.email,
    subject: options.subject,
    text: options.message
    // html:
  };

  // 3) Send the email. The is an asychronous function and it returns a promise. we do not want to store any result from the transport.sendMail() but we could
  await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;
*/
