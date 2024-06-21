const mongoose = require("mongoose");

const JobSearchObjectSchema = new mongoose.Schema({
  //Date format shall be DD/MM/YYYY
  date: {
      type: String,
      required: true
  },
  companyResults: [
    {
      companyName: {
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
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const JobSearchObject = mongoose.model("JobSearchObject", JobSearchObjectSchema);

module.exports = JobSearchObject;
