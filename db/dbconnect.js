const mongoose = require("mongoose");
mongoose
  .connect("mongodb://localhost:27017/MLM")
  .then(() => {
    console.log("Db Connected");
  })
  .catch((err) => {
    console.log("not connected");
  });
