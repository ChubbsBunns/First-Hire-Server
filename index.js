//Core modules
const express = require("express");
const mongoose = require("mongoose");
var cors = require("cors");
const dotenv = require('dotenv');
dotenv.config()
//Schemas
const JobSearchObject = require("./models/JobSearchAction.js")

//CRUD
const {createJobSearchQueryObject, getLatestJobSearchQueryDate} = require("./backend_requests/createJobSearchQuery.js")
const {updateUser} = require("./backend_requests/CRUD/userDetails.js")
const {createUser, getUser} = require("./backend_requests/CRUD/userDetails.js")
const {getUserMatchingJobSearchObjects, getAllCurrentJobData} = require("./helperFunctions/helperFunctions.js")

//Helpers
const {getCompanyList, getCompanyListNames} = require("./helperFunctions/helperFunctions.js")
//Scheduler
const scheduledJobScrape = require("./scheduledJobs/createNewJob")
const {dailyEmailJob} = require("./backend_requests/EmailRequests/emailHelper.js")

//Auth
const { auth } = require('express-oauth2-jwt-bearer');
const authRoutes = require("./Routes/AuthRoutes")


const app = express();
app.use(cors());
app.use(express.json());

app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:5173"];
      if (allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS" + " origin is " + origin));
      }
    },
    credentials: true,
  })
);

/* mongoose.connect('mongodb+srv://troskproductions:1loveMongoDBAtlas!@firsthirecluster.vqb0rbx.mongodb.net/?retryWrites=true&w=majority&appName=firstHireCluster&ssl=true',   
  {useNewUrlParser: true,
  useUnifiedTopology: true,}) */
mongoose.connect("mongodb://127.0.0.1:27017/database-test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

scheduledJobScrape.initScheduledJobs();


//Test routes
// This route doesn't need authentication
app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

// This route needs authentication
app.get('/api/private', function(req, res) {
  res.json({
    message: 'Hello from a private endpoint! You need to be authenticated to see this.'
  });
});

app.all("/*", function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "X-Requested-With");
  next();
});

//Authentication

app.get("/submitWebScrappingQuery", createJobSearchQueryObject);
app.get("/user/getUser", getUser)
app.post("/user/updateJobParameters", updateUser)

app.get("/user/getUserMatchingJobs", getUserMatchingJobSearchObjects)
app.get("/getAllCurrentJobData", getAllCurrentJobData)
app.get("/getUserDetails/:id", function(req, res) {
  const id = req.params.id;
  console.log(id);
  res.send(200)
})

app.get("/getLatestJobSearchQueryDate", getLatestJobSearchQueryDate);

/* app.get("/something", testFunction); */

app.get("/jobSearchQueries", async (req, res) => {
  try {
    const data = await JobSearchObject.find();
    res.json(data);
  } catch (err) {
    console.error("Error retrieving data:", err);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/companyList", getCompanyList)
app.get("/companyListNames", getCompanyListNames)

app.use("/api/auth", authRoutes)

app.listen(3001, () => {
  console.log("server is running on port 3001");
});