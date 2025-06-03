const mongoose = require("mongoose");
const sideschema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String, required: true },
    number: { type: Number, required: true },
    refName: { type: String },
    paid: { type: Number },
    withdrawl:{type:Number},
    referrals: { type: Object, default: {} },
  },
  
);
const Side = mongoose.model("side", sideschema);
module.exports = Side;
