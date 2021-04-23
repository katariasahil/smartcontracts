const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const projectSchema = new mongoose.Schema(
{
    projectname:{
type: String,
required: true,  
},
projecturl:
{
    type: String,
    required: true,
},
admin:{
    type: String,
    required: true    
    },
members:
{
    type:[{ membername: String,
        memberusername: String,
        memberkey: String,
    }],
    required: true,
},
memberspublickey:
{
    type:String,
},
files:
{
    type:[{
        filename:String,
        fileurl:String,
        filehash:String,
        pending:Boolean,
        verified:Number,
    }],
}
});



const Project = new mongoose.model("Projects",projectSchema);
module.exports = Project;