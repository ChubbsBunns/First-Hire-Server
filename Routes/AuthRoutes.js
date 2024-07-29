const express = require("express");
const jwt = require("jsonwebtoken");
const User = require("../models/User");
const router = express.Router();
const bcrypt = require("bcrypt");

router.post("/login", async(req, res) => {
    try {
        const {email, password} = req.body;
        const user = await User.findOne({email});
        if (!user) return res.status(400).send("Invalid username or password.");
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword)
            return res.status(400).send("Invalid username or password.");
        var token = ""
        try {
            token = jwt.sign({ userId: user.id }, process.env.JWT_SECRET);  
          } catch(err) {
            console.log("The error occurs in the inability to sign the JWT SECRET")
            console.error(err)
          }
          console.log("I HAVE DONE IT")
          console.log("THE TOKEN IS " + token);
          res.send({ token });
    } catch(err){
        console.error(err)
    }
})

router.post("/register", async(req, res) => {
    try {
        const {email, password} = req.body;
        const existingUser = await User.findOne({email})
        if (existingUser) {
            return res.status(400).json({error: "Account with this email already exists."})
        }
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt)
        const user = new User({
            email: email,
            password: hashedPassword
        });
        const savedUser = await user.save();
        res.json({
            message: "User registered successfully",
            userId: savedUser._id,
        });
    } catch(error) {
        console.error(error);
        res.status(500).json({error: "Internal server error: " + error});
    }
})

router.get("/testRoute", async(req,res) => {
    res.json({
        message: "Test check is done well",
    })
})

module.exports = router;