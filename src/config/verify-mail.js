import nodeMailer from "nodemailer";

export const sendEmail = async (email) => {
  //!Step1 CREATE A TRANSPORT
  const transport = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_USER,
      pass: process.env.AUTH_PASS,
    },
  });

  //?Step2: CONFIGURE A MAIL
  const mailConfiguration = {
    from: process.env.AUTH_USER,
    to: email,
    //?Subject Of the email
    subject: "Welcome Email",
    html: `
     <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937;"> <h1 style="color: #0f3d5e;"> Welcome to Bank Transactra 👋 </h1> <p> We're delighted to have you with us. </p> <p> Your account is now ready, giving you access to a faster, smarter, and more secure digital banking experience. </p> <p> With Bank Transactra, you can manage your banking activities and transactions through a seamless and customer-focused platform. </p> <p style="margin-top: 24px;"> <strong>Secure banking. Seamless transactions. Better experiences.</strong> </p> <p style="color: #6b7280;"> Welcome aboard,<br /> <strong>Team Bank Transactra</strong> </p> </div>
    `,
  };

  //~Step3: SEND A MAIL
  transport.sendMail(mailConfiguration, (err, info) => {
    if (err) {
      throw new Error(err);
    }

    console.log("Email sent successfully", info);
  });
};
