const User = require("../../models/User")
var http = require("http")

async function createUser(req, res) {
    try {
        const email = req.query.email
        const newUser = new User({email});
        newUser.save().then(() => console.log("New user successfully saved"));
        res.json(req.body)
    } catch(error) {
        console.log(error)
        res.json(error)
    }
}


async function getUser(req, res) {
    try {        
        const emailToFind = req.query.email;
        const user = await User.findOne({
            "email": emailToFind
        })
        if (user == null) {
            //Create a user with this email
            const newUser = new User({"email": emailToFind});
            newUser.save().then(() => console.log("New user successfully saved 1"));
            console.log("I am actually here");
            const newUpdatedUser = await User.findOne({
                "email": emailToFind
            })
            res.send(newUpdatedUser);
        } else {
            res.send(user)
        }

    } catch (error) {
        res.send(error)
        console.log(error)
        res.sendStatus(400)
    }
}


async function updateUser(req, res) {
    try {
        const jobPhrases = req.body.jobPhrases;
        const negativePhrases = req.body.negativePhrases;
        const selectedCompanies = req.body.selectedCompanies;
        const userEmail = req.body.userEmail
        let data = {
            keywordSettings: {
                jobPhrases: jobPhrases,
                negativePhrases: negativePhrases,
                selectedCompanies: selectedCompanies
            }
        }
        const user = await User.findOneAndUpdate({
            "email": userEmail,
        }, data, {new: true});
        await user.save();
        res.json(user)
    } catch (error) {
        console.log(error)
        res.json(error)
    }
}



module.exports = {createUser, getUser, updateUser}