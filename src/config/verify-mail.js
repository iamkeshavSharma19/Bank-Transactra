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

//?Creating a separate async function for the sending email for the successful Transaction as well.
export const sendTransactionEmail = async (email, name, amount, toAccount) => {
  //!Step1 CREATE A TRANSPORT
  const transport = nodeMailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.AUTH_USER,
      pass: process.env.AUTH_PASS,
    },
  });
  //? Step2 CONFIGURE A MAIL

  const mailConfiguration = {
    from: process.env.AUTH_USER,
    to: email,

    //? Subject Of the Email
    subject: "Transaction Successful - Bank Transactra",

    html: `
    <div style="font-family: Arial, sans-serif; line-height: 1.6; color: #1f2937; max-width: 600px; margin: 0 auto; padding: 20px;">
      
      <h1 style="color: #0f3d5e; margin-bottom: 10px;">
        Transaction Successful ✅
      </h1>

      <p>Hello <strong>${name}</strong>,</p>

      <p>
        Your transaction has been successfully processed. The amount has been
        securely transferred to the specified account.
      </p>

      <div style="
        background: #f3f7fa;
        border: 1px solid #d1d9df;
        border-radius: 8px;
        padding: 18px;
        margin: 20px 0;
      ">
        <h2 style="color: #0f3d5e; margin-top: 0; font-size: 18px;">
          Transaction Details
        </h2>

        <p style="margin: 8px 0;">
          <strong>Amount Transferred:</strong> ₹${amount}
        </p>

        <p style="margin: 8px 0;">
          <strong>Transferred To:</strong> ${toAccount}
        </p>

        <p style="margin: 8px 0;">
          <strong>Status:</strong> Successfully Completed
        </p>
      </div>

      <p>
        You can continue to manage your transactions securely and conveniently
        with Bank Transactra.
      </p>

      <p style="
        margin-top: 25px;
        padding-top: 15px;
        border-top: 1px solid #e5e7eb;
        color: #6b7280;
      ">
        Thank you for banking with us.<br />
        <strong style="color: #0f3d5e;">Team Bank Transactra</strong>
      </p>

    </div>
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
