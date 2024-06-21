const mongoose = require("mongoose");

const FilteredJobSearchSchema = new mongoose.Schema({
    
  keyPhrases: [
    {
        keyPhrase: {
            type: String,
            required: true,
        },
        company: [
            {
                companyName: {
                    type: String,
                    required: true
                },
                matchingJobs: [String],
            }
        ]
    }
  ]
});

const FilteredJobSearch = mongoose.model("filteredJobSearch", FilteredJobSearchSchema);

module.exports = FilteredJobSearch;   