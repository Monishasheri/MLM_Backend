const mongoose=require("mongoose")
const adminschema=new mongoose.Schema({
    amount:{type:Number}
})
const Admin=mongoose.model("admin",adminschema)
module.exports=Admin;