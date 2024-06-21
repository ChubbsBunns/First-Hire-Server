const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true
    },
    keywordSettings:{
        jobPhrases: [String],
        negativePhrases: [String],
        selectedCompanies: [String],
    },
    sentData: [
        {
            companyName: {
                type: String,
                required: true,
            },
            sentJobs: [
                {
                    type: String,
                    required: true
                }
            ]
        }
    ]
})

const User = mongoose.model("User", UserSchema);

module.exports = User;