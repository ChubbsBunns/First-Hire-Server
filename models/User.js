const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema({
    email: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    password: {
        type: String,
        required: true,
    },
    tokens: [
        {
          token: {
            type: String,
            required: true,
          },
        },
    ],
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

UserSchema.methods.verifyPassword = async function(password) {
    const user = this;
    const isMatch = await bcrypt.compare(password, user.password);
    return isMatch
}

const User = mongoose.model("User", UserSchema);

module.exports = User;