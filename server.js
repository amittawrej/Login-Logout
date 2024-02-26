import express from "express";
import path from 'path';
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from 'bcrypt';

mongoose.connect("mongodb://localhost:27017/backend", {
    useNewUrlParser: true,
    useUnifiedTopology: true
}).then(() => console.log('Database Connected'))
  .catch((e) => console.log(e));

const app = express();
const port = 3000;

// MongoDB schema
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password:String
});

// MongoDB model
const Users = mongoose.model('Users', userSchema);

app.use(cookieParser());
app.use(express.static(path.join(path.resolve(), 'public')));
app.set("view engine", "ejs");
app.use(express.urlencoded({ extended: true }));

const isAuth=async(req,res,next)=>{
    const {token}=req.cookies;
   
    if(token){
        const decoded=jwt.verify(token,"amittawrej")
       
       req.user=await Users.findById(decoded._id); 

        next()
    }
    else{
        res.redirect("/login");
    }
} 

app.get('/',isAuth,(req,res)=>{
    console.log(req.user);
    res.render("logout",{email: req.user.name});
   
})
app.get('/register',(req,res)=>{
    // console.log(req.user);
    res.render("register");
   
})
app.get('/login',(req,res)=>{
    res.render('login');
})
app.post("/login",async(req,res)=>{
    const {email,password}=req.body;
    let user=await Users.findOne({email});
    if(!user) return res.redirect("/register");

    const isMatch=await bcrypt.compare(password,user.password);
    if(!isMatch) {return res.render('login',{email, massage:'Incorrect Password'});}
    const token=jwt.sign({_id:user._id},"amittawrej")


    res.cookie('token', token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect('/');
})

app.post('/register',async(req,res)=>{
    const {name, email,password}=req.body;
    let user=await Users.findOne({email});
    
    if(user){
        res.redirect('/login');
    }

   const hashedPassword= await bcrypt.hash(password, 10) ;
    user=await Users.create({
        name,
        email,
        password :hashedPassword
    });


    const token=jwt.sign({_id:user._id},"amittawrej")


    res.cookie('token', token,{
        httpOnly:true,
        expires:new Date(Date.now()+60*1000)
    })
    res.redirect('/');
})
app.get('/logout',(req,res)=>{
    res.clearCookie('token');
    res.redirect('/');
})



app.listen(port, () => {
    console.log(`Server is started on ${port}`);
});
