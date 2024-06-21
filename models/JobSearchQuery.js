const mongoose = require("mongoose");

const JobSearchQuerySchema = new mongoose.Schema({
  companyResults: [
    {
      companyName: {
        type: String,
        required: true,
      },
      keywordResults: [
        {
          keyword: {
            type: String,
            required: true,
          },
          results: [
            {
              type: String,
            },
          ],
        },
      ],
    },
  ],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JobSearchQuery = mongoose.model("JobSearchQuery", JobSearchQuerySchema);

module.exports = JobSearchQuery;
