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

//mongoose.connect('mongodb+srv://troskproductions:1loveMongoDBAtlas!@firsthirecluster.vqb0rbx.mongodb.net/?retryWrites=true&w=majority&appName=firstHireCluster')
mongoose.connect("mongodb://127.0.0.1:27017/database-test", {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

scheduledJobScrape.initScheduledJobs();

const checkJwt = auth({
  audience: "https://dev-dwtvfqfln7z0evht.us.auth0.com/api/v2/",
  issuerBaseURL: `https://dev-dwtvfqfln7z0evht.us.auth0.com/`,
});


//Test routes
// This route doesn't need authentication
app.get('/api/public', function(req, res) {
  res.json({
    message: 'Hello from a public endpoint! You don\'t need to be authenticated to see this.'
  });
});

// This route needs authentication
app.get('/api/private', checkJwt, function(req, res) {
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

app.post("/user/createUser", checkJwt, createUser)
app.get("/user/getUser", checkJwt, getUser)
app.post("/user/updateJobParameters", checkJwt, updateUser)

app.get("/user/getUserMatchingJobs", checkJwt, getUserMatchingJobSearchObjects)
app.get("/getAllCurrentJobData", checkJwt, getAllCurrentJobData)
app.get("/getUserDetails/:id", function(req, res) {
  const id = req.params.id;
  console.log(id);
  res.send(200)
})

app.get("/getLatestJobSearchQueryDate", checkJwt, getLatestJobSearchQueryDate);

/* app.get("/something", testFunction); */

app.get("/jobSearchQueries",checkJwt, async (req, res) => {
  try {
    const data = await JobSearchObject.find();
    res.json(data);
  } catch (err) {
    console.error("Error retrieving data:", err);
    res.status(500).send("Error retrieving data");
  }
});

app.get("/companyList", checkJwt, getCompanyList)
app.get("/companyListNames", checkJwt, getCompanyListNames)

app.use("/api/auth", authRoutes)

app.listen(3001, () => {
  console.log("server is running on port 3001");
});