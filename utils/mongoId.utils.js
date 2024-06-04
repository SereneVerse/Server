const mongoose = require("mongoose");
const ForbiddenRequestError = require("../exceptions/forbidden.exception");

const validateDbId = async(...idArr) => {
  idArr.forEach((id) => {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw new ForbiddenRequestError("Invalid MongoDb Id");
    }
  });
};

module.exports = { validateDbId };
