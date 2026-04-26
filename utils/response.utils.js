const sendSuccess = (res, data, message = "success", statusCode = 200) =>
  res.status(statusCode).json({ success: true, statusCode, message, data });

const sendError = (res, code, message, statusCode = 400) =>
  res.status(statusCode).json({ success: false, statusCode, error: { code, message } });

module.exports = { sendSuccess, sendError };
