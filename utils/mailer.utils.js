const { mailUser } = require("../config/constants.config");
const { transporter } = require("../config/mail.config");

const sendMail = async (email, subject, template, otp, fullName) => {
  try {
    let mailOption = {
      from: mailUser,
      to: email,
      subject,
      template,
      context: {
        otp,
        fullName
      },
    };
    let info = await transporter.sendMail(mailOption);
    return info.response;
  } catch (error) {
    throw new Error(error);
  }
};

const sendConsultantMail = async (email, subject, template, link, fullName) => {
  try {
    let mailOption = {
      from: mailUser,
      to: email,
      subject,
      template,
      context: {
        link,
        fullName
      },
    };
    let info = await transporter.sendMail(mailOption);
    return info.response;
  } catch (error) {
    throw new Error(error);
  }
};

module.exports = {
  sendMail,
  sendConsultantMail
};
