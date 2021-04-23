const express = require("express");
const app = express();
const bodyParser = require('body-parser');
const path = require("path");
const hbs = require("express-handlebars");
const Register = require("./models/register");
const Project = require("./models/project");
const bcrypt = require("bcryptjs");
const upload = require("express-fileupload");
var fs = require("fs");
const { generateKeyPairSync, publicEncrypt, privateDecrypt } = require('crypto');
const User = require("./models/register");
const port =9000;
var crypto = require('crypto');
var Busboy = require('busboy');
require("./db/conn");

const static_path = path.join(__dirname, "../public");
const views_path = path.join(__dirname, "/views");



app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: false }));


var cookies = require("cookie-parser");
app.use(cookies());

app.use(express.static(static_path));

app.set('views', './views');
app.set("view engine", "hbs");
app.use(upload());
app.get("/", (req,res)=>{
   res.render("index"); 
});

app.get("/sign",(req,res)=>{
   res.render("sign"); 
});

app.get("/profile",async (req,res)=>{
   if(req.cookies['username']!=undefined)
{
   const user =  await Register.findOne({email:req.cookies['username']});
   res.render("profile",{name:user.name,username:user.email,publickey:user.publickey});
}
else
{
   res.render("sign");
}
});



app.get("/projects",async (req,res)=>{
   if(req.cookies['username']!=undefined)
{
   let pid = req.query.pid;
   const user =  await Register.findOne({email:req.cookies['username']});
   if(pid!=undefined)
   {
      const project =  await Project.findOne({projecturl:pid});
      res.render("projects",{links : user.projects,members : project.members,projectname:project.projectname,projecturl:project.projecturl,files:project.files});
     
   }
   else
   {
      res.render("projects",{links : user.projects,showimage: true});
      
   }
   
}
else
{
   res.render("sign");
}
});

app.get("/requests",async (req,res)=>{
   if(req.cookies['username']!=undefined)
{
   let task = req.query.task;
   let pname = req.query.projectname;
    let purl = req.query.projecturl;
    let furl = req.query.fileurl;
    
   

    const admin = await  Register.findOne({email:req.cookies['username']});
  
    if(furl!=undefined)
    { 
      let filename = req.cookies['file'];
        console.log(task);
        console.log(pname);
        console.log(purl);
        console.log(filename);
        let tempstring = furl.toString().replace(/ /g, "+");
        furl = tempstring;


      
       const user = await  Register.findOne({email:req.cookies['username']});
       const project = await  Project.findOne({projecturl: purl});

       if(task === "accept")
       {
       for(var k = 0;  k < project.files.length; k++) {
         if (project.files[k].filename === filename) {
          project.files[k].verified++;
          let value = project.files[k].verified;
          if(value == project.members.length)
          {
            project.files[k].pending=false;
          }
         //console.log(verified);
              const updatedfile =  await project.save();
              break;
          }}
         }
       
       for(var j = 0;  j < user.requests.length; j++) {
         if (user.requests[j].file === furl) {
               user.requests[j].pending=false;
               const updateduser =  await user.save();
              break;
          }
         }
         
         
       res.redirect("/requests");
      }


  else if(task === "accept" & furl === undefined)
   {
      
      const user = await  Register.findOneAndUpdate({email:req.cookies['username']},
{ $addToSet:
    { projects:
       { 
           projectname : pname,
           projecturl : purl,
         }
      }
   }, (error,data)=>{
      if(error)
      {
         console.log(error);
      }
      else
      {
         console.log(data);
      }
}
);

const project = await  Project.findOneAndUpdate({projectname: pname},
{ $addToSet:
    { members: 
      {
         membername:user.name,
       memberusername:req.cookies['username'],
       memberkey:user.publickey,
   }
    
      }
   }, (error,data)=>{
      if(error)
      {
         console.log(error);
      }
      else
      {
         console.log(data);
      }
}
);

for(var i = 0;  i < user.requests.length; i++) {
   if (user.requests[i].projecturl === purl) {
        user.requests[i].pending=false;
        const updateduser =  await user.save();
       break;
   }
}

      res.redirect("/projects");
      console.log(task);
   }
   
   else if(task === "reject" & furl === undefined)
   {
      const user =  await Register.findOne({email:req.cookies['username']});
      for(var i = 0;  i < user.requests.length; i++) {
    if (user.requests[i].projecturl === purl) {
         user.requests[i].pending=false;
         const updateduser =  await user.save();
         console.log(updateduser);
        break;
    }
}
for(var i = 0;  i < user.requests.length; i++) {
    if (user.requests[i].projecturl === purl) {
         user.requests[i].pending=false;
         const updateduser =  await user.save();
         
        break;
    }
}

      res.redirect("/requests");

   }
   else
   {
      const user =  await Register.findOne({email:req.cookies['username']});
      res.render("requests",{requests : user.requests});
   }
   
}
else
{
   res.render("sign");
}
 
});

app.get("/dashboard",async (req,res)=>{
if(req.cookies['username']!=undefined)
{
   res.render("dashboard");
}
else
{
   res.render("sign");
}
});

app.get("/privatekey",async (req,res)=>{

   res.render("privatekey");
});

app.get("/signin",async (req,res)=>{
   fs.unlink('key.pem', function (err) {
      if (err) throw err;
      console.log('File deleted!');
    });
   res.render("sign");
});


app.get("/privatekeydownload",async (req,res)=>{
    res.download('key.pem');
});

app.get("/download",async (req,res)=>{
try{
   const file= req.query.filen;
   res.download('\\SmartContracts\\src\\uploads\\'+file);
}catch(err)
{console.log(err);
}

});

app.get("/file",async (req,res)=>{
   try{
      const filehash= req.query.hash;
      console.log(filehash);
      const user = await  Register.findOne({email:req.cookies['username']});
      for(var i = 0;  i < user.requests.length; i++) {
         if (user.requests[i].filehash === filehash) {
            console.log(user.name);
            const project = await  Project.findOne({projecturl: user.requests[i].projecturl});
            console.log(project.projectname);
            for(var k = 0;  k < project.files.length; k++) {
               if (project.files[k].filehash === filehash) {
                  console.log(project.files[k].filename);
                  filetod = `${__dirname}/uploads/${project.files[k].filename}`;
                  res.download(filetod);
                  break;
                }}
break;
            
              
         }
     }
     //res.status(400).send("File Not Found");

//      res.download('\\SmartContracts\\src\\uploads\\'+file);
   }catch(err)
   {console.log(err);
   }
   
   });

app.post("/download",async (req,res)=>{
   try{
      let projectname = req.body.projectname;
      let projecturl = req.body.projecturl;
      let fileurl = req.body.fileurl;
      let downloadPath;
      try{
         console.log(req.file);
      if(req.files)
      {
      console.log("reached");
      let file = req.files.file;
      let privateKey = file.data.toString();
            let encrypted =  fileurl;
            var decryptBuffer = Buffer.from(encrypted.toString("base64"), "base64");
    var decrypted = privateDecrypt(privateKey,decryptBuffer);
    
    //print out the decrypted text
    console.log("decripted Text:");
    console.log(decrypted.toString());
//     downloadPath = path.join(__dirname, decrypted.toString());
// let uploadp = path.join(__dirname, '/uploads/');
// downloadPath = path.join(uploadp, decrypted.toString());
//console.log(downloadPath);
filetod = `${__dirname}/uploads/${decrypted.toString()}`;
res.cookie('file',decrypted.toString(), { expires: new Date(Date.now() + 3600000), httpOnly: true })
res.download(filetod); // Set disposition and send it.
    
      }
      else
      {
         console.log("not reached");
      }
         
      }      catch(error)
      {
            res.status(400).send(error);     
         console.log(error);
         }
   
        }catch(error)
        {
              res.status(400).send(error);     
           console.log(error);
           }});




app.post("/addmember",async (req,res)=>{
   try{
            
      const memberusername = req.body.memberusername;
      const projectname = req.body.projectname;
      const projecturl = req.body.projecturl;
      const admin = await Register.findOne({email:req.cookies['username']});
   const member = await  Register.findOneAndUpdate({email:memberusername},
   { $addToSet:
       { requests:
          { 
            pending:true,
            addmember: true,
            verify:false,
            file:undefined,
        requestorusername: req.cookies['username'],
        requestorname: admin.name,
            projectname: projectname, 
            projecturl: projecturl,
            }
         }
      }, (error,data)=>{
         if(error)
         {
            console.log(error);
         }
         else
         {
            console.log(data);
         }
   }
   );
         res.status(201).render("projects");
         res.redirect("/projects");
         
      }
      catch(error)
      {
            res.status(400).send(error);     
         console.log(error);
         }
   
        });


        


        app.post("/upload",async (req,res)=>{
         try{
            try{
               //console.log(req.file);
            if(req.files)
            {
            console.log("reached");
            var file = req.files.file;
            var fname = file.name;
            try{
               uploadPath = __dirname + '/uploads/'+ fname;

               file.mv(uploadPath, async function(err) {
                  if (err)
                    return res.status(500).send(err);
                  else
                  {
                     let fhash = crypto.createHash('sha1').update(fname+''+uploadPath).digest('hex');
const project = await  Project.findOneAndUpdate({projecturl:req.body.projecturl},
   { $addToSet:
       { files: 
         {
            filename:fname,
            fileurl:uploadPath,
            filehash:fhash,
            pending:true,
            verified:0,
      }
       
         }
      }, (error,data)=>{
         if(error)
         {
            console.log(error);
         }
         else
         {
           // console.log(data);
         }
   }
   );
                     
                     let members = project.members;
                     
                     let i=0;
                     for( i = 0; i<members.length;i++)
                     {
                        
                        var toEncrypt = fname;
    var encryptBuffer = Buffer.from(toEncrypt);
    var encrypted = publicEncrypt(members[i].memberkey,encryptBuffer);
    console.log(encrypted.toString("base64"));
    const admin = await Register.findOne({email:req.cookies['username']});
    try{
    const member = await  Register.findOneAndUpdate({email:members[i].memberusername},
      { $addToSet:
          { requests:
             { 
               pending:true,
               addmember: false,
               verify:true,
               file:encrypted.toString("base64"),
               filehash: fhash,
           requestorusername: req.cookies['username'],
           requestorname: admin.name,
               projectname: req.body.projectname, 
               projecturl: req.body.projecturl,
               }
            }
         }, (error,data)=>{
            if(error)
            {
               console.log(error);
            }
            else
            {
               console.log(data);
            }
      }
      );
   }catch(err)
   {
      console.log(err);
   }
                     }
                  }
                  
                });
  
           
         }catch(err)
         {
            console.log(err);
         }}
         else
         {
            console.log("not reached");
         }}catch(error)
         {
            console.log(error);
         }

         
      
         res.status(201).render("requests");
}catch(error)
         {
            res.status(400).send(error);
            console.log(error);
      
         }});










app.post("/dashboard",async (req,res)=>{
   try{

      const email = req.body.email;
      let password = req.body.password;
      const user =  await Register.findOne({email:email});
      let match = false;
      if(crypto.createHash('sha1').update( password.concat(user.answer)).digest('hex') === user.password)
      {
         match = true;
      }
      if(match)
      {
         res.cookie('username',user.email, { expires: new Date(Date.now() + 3600000), httpOnly: true })

         res.status(201).render("dashboard");
      }
      else{
         res.send("Invalid  Password");
      
      }
   }catch(error)
   {
      res.status(400).send("invalid email");
      console.log(error);

   }});

   app.post("/newproject",async (req,res)=>{
try{
   const admin = await  Register.findOne({email:req.cookies['username']});
      const createProject = new Project({
         projectname: req.body.projectname,
         projecturl: crypto.createHash('sha1').update(req.body.projectname+''+req.cookies['username']).digest('hex'),
         admin: req.cookies['username'],
         members: { membername: admin.name, memberusername: req.cookies['username'], memberkey:admin.publickey},
          });

const created= await createProject.save();
const pname = created.projectname;
const phash = created.projecturl;
 const adminnew = await  Register.findOneAndUpdate({email:req.cookies['username']},
{ $addToSet:
    { projects:
       { 
           projectname : pname,
           projecturl : phash,
         }
      }
   }, (error,data)=>{
      if(error)
      {
         console.log(error);
      }
      else
      {
         //console.log(data);
      }
}
);
      
      res.redirect("/projects");
      
      
   }catch(error)
   {
         res.status(400).send(error);     
     // console.log(error);
      }

     });

app.post("/register",async (req,res)=>{
   try{
      const { publicKey, privateKey } = generateKeyPairSync('rsa', {
         modulusLength: 4096,
         publicKeyEncoding: {
           type: 'spki',
           format: 'pem',
         },
         privateKeyEncoding: {
           type: 'pkcs8',
           format: 'pem',
         }
       });
      // console.log(`PublicKey: ${publicKey}`);
    //console.log(`PrivateKey: ${privateKey}`);
    
    //message to be encrypted
    var toEncrypt = "my secret text to be encrypted";
    var encryptBuffer = Buffer.from(toEncrypt);
    
    //encrypt using public key
    var encrypted = publicEncrypt(publicKey,encryptBuffer);
    
    //print out the text and cyphertext
    console.log("Text to be encrypted:");
    console.log(toEncrypt);
    console.log("cipherText:");
    console.log(encrypted.toString());
    
    //decrypt the cyphertext using the private key
    var decryptBuffer = Buffer.from(encrypted.toString("base64"), "base64");
    var decrypted = privateDecrypt(privateKey,decryptBuffer);
    
    //print out the decrypted text
    console.log("decripted Text:");
    console.log(decrypted.toString());

       fs.writeFile("key.pem", privateKey, (err) => {
         if (err) {
   
         }console.log(err);
         console.log("Key File Saved");
       });
      
      
      const registerUser = new Register({
         name: req.body.name,
         email: req.body.email,
         password: crypto.createHash('sha1').update(req.body.password.concat(req.body.answer)).digest('hex'), 
         question: req.body.question,
         answer: req.body.answer,
         publickey: publicKey,
         
      });
const registered= await registerUser.save();

      res.status(201).render("privatekey");
      
   }catch(error)
   {
         res.status(400).send(error);     
      console.log(error);
      }

  
});





app.listen(port, ()=>{
console.log('Server is running at port no.', port);


});