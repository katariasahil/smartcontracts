const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema(
{
    name:{
type: String,
required: true    
},
email:
{
    type:String,
    required: true,
    unique: true
},
password:
{
    type:String,
    required:true
},
question:
{
    type:String,
    required: true,
},
answer:
{
    type:String,
    required: true,
},
publickey:
{
    type:String,
    unique: true,
    required: true,
},
projects:
{
    type:[{ projectname: String,
    projecturl: String,}],
},
requests:
{
    type:[{ 
        pending: Boolean,
        addmember: Boolean,
        verify:Boolean,
        file:String,
        filehash:String,
        requestorusername: String,
        requestorname: String,
        projectname: String,
        projecturl: String}],
}
});


const User = new mongoose.model("User",userSchema);
module.exports = User;