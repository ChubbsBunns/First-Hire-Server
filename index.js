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
const {dailyJobScrapeCronJob} = require("./scheduledJobs/createNewJob2.js")
//Auth
const { auth } = require('express-oauth2-jwt-bearer');
const authRoutes = require("./Routes/AuthRoutes")


const app = express();
/* app.use(cors({
  origin: "https://first-hire-client.vercel.app",
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'], // Allowed methods
  allowedHeaders: ['Content-Type', 'Authorization'],    // Allowed headers
  credentials: true                                     // If you need to allow credentials
})); */

app.use(function (req, res, next) {

    // Website you wish to allow to connect
    res.setHeader('Access-Control-Allow-Origin', 'http://localhost:8888');

    // Request methods you wish to allow
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, PUT, PATCH, DELETE');

    // Request headers you wish to allow
    res.setHeader('Access-Control-Allow-Headers', 'X-Requested-With,content-type');

    // Set to true if you need the website to include cookies in the requests sent
    // to the API (e.g. in case you use sessions)
    res.setHeader('Access-Control-Allow-Credentials', true);

    // Pass to next layer of middleware
    next();
});

// Handle preflight requests
app.options('*', cors()); // Enable pre-flight for all routes
app.use(express.json());

/* mongoose.connect(process.env.MONGODB_ATLAS_CLUSTER_URL)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas", error);
  }); */

  mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log("Connected to MongoDB Atlas");
  })
  .catch((error) => {
    console.error("Error connecting to MongoDB Atlas", error);
  });

scheduledJobScrape.initScheduledJobs();

/* app.use(
  cors({
    origin: function (origin, callback) {
      const allowedOrigins = ["http://localhost:5173, https://first-hire-client.vercel.app"];
      if (allowedOrigins.includes(origin)) {
        console.log("Allowed origin")
      } else {
        console.log("Origin not allowed by CORS")
      }
      if (allowedOrigins.includes(origin) || !origin || allowedOrigins.indexOf(origin) !== -1) {
        callback(null, true);
      } else {
        callback(new Error("Not allowed by CORS" + " origin is " + origin));
      }
    },
    credentials: true,
  })
); */

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
app.get("/", (req, res) => {
  res.json("First Hire backend is up and running")
})
app.post("/user/updateJobParameters", updateUser)

app.get("/user/getUserMatchingJobs", getUserMatchingJobSearchObjects)
app.get("/getAllCurrentJobData", getAllCurrentJobData)
app.get("/getUserDetails/:id", function(req, res) {
  const id = req.params.id;
  console.log(id);
  res.send(200)
})



app.get("/getLatestJobSearchQueryDate", getLatestJobSearchQueryDate);

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

//Daily cronjob
app.get("/getDailyData", dailyJobScrapeCronJob)

app.listen(3001, () => {
  console.log("server is running on port 3001");
});