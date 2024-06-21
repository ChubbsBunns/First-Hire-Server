const mongoose = require("mongoose");

const UserMatchingJobSchema = new mongoose.Schema({
    companies: [ 
    {
        companyName: {
            type: String,
            required: true,
        },
        keyPhrasesAndJobLists: [
            {
                keyPhrase: {
                    type: String,
                    required: true
                },
                matchingJobs: [String]
            }
        ]
    }],
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

const UserMatchingJobQuery = mongoose.model("UserMatchingJobQuery", UserMatchingJobSchema);

module.exports = UserMatchingJobQuery;