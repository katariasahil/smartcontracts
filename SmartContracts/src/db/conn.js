const mongoose = require("mongoose");
mongoose.connect("mongodb://localhost:27017/project",{
    useNewUrlParser:true,
    useUnifiedTopology:true,
    useCreateIndex:true
}).then(() =>{
    console.log('Database connection Successful');
}
).catch((e) =>{
    console.log('Connection Failed!');
})