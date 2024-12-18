//Scheduler module
const CronJob = require("node-cron");

//Scrapper objects
const {TestWebsite_Scrapper} = require("../scrapers/TestWebsite_Scrapper.js");
const {Shopback_Scrapper} = require("../scrapers/Shopback_Scrapper.js");
const {Visa_Scrapper} = require("../scrapers/Visa_Scrapper.js");
const {Cloudflare_Scrapper} = require("../scrapers/Cloudflare_Scrapper.js");

//Other components
const helperFunctions = require("../helperFunctions/helperFunctions.js")
const {dailyEmailJob} = require("../backend_requests/EmailRequests/emailHelper.js")

//Dependencies
const fs = require('fs').promises;

//Files to update
const latestJobUpdateFilePath = "latestJobUpdateDate.json"
const databaseCompanyDataList = require("../static/CompanyList.json")

//MongoDB Schema
const JobSearchObject = require("../models/JobSearchAction.js")

/* "0 18 * * 1-5" */

/* module.exports = async (req, res) => {
  console.log("Cron job is starting...");
  try {
    console.log("Job about to start");
    const result = await startJobScrappingJob();
    res.send({
      status: 200,
      message: "Cronjob Operation completed successfully!",
      data: result,
    });
  } catch (error) {
    console.log("Error found in cronjob main")
    // Handle any errors that occur during the async operation
    res.status(500).send({
      status: 500,
      message: "An error occurred in cronjob",
      error: error.message,
    });
  }
}; */

async function dailyJobScrapeCronJob(req, res) {
  console.log("Cron job is starting...");
  try {
    console.log("Job about to start");
    const result = await startJobScrappingJob();
    console.log("Jobs scrapped successfully, sending emails now");
    await dailyEmailJob();
    res.send({
      status: 200,
      message: "Cronjob Operation completed successfully!",
      data: result,
    });
  } catch (error) {
    console.log("Error found in cronjob main")
    // Handle any errors that occur during the async operation
    res.status(500).send({
      status: 500,
      message: "An error occurred in cronjob",
      error: error.message,
    });
  }
};

  async function startJobScrappingJob() {
    try {
        const companyNames = databaseCompanyDataList.companyDetails.map(companyDetail => Object.keys(companyDetail)[0]);
        let jobSearchObject = new JobSearchObject();
        jobSearchObject.date = helperFunctions.getCurrentParsedDate();
        console.log(jobSearchObject.date)
        for (const companyName of companyNames) {
            switch (companyName) {
                case "Shopback":
                  let shopbackScrapper = new Shopback_Scrapper();
                  await shopbackScrapper.createCompanyJobSearchQuery(
                    jobSearchObject
                  );
                  break;
                case "Cloudflare":
                  let cloudflareScrapper = new Cloudflare_Scrapper();
                  await cloudflareScrapper.createCompanyJobSearchQuery(
                    jobSearchObject
                  );
                  break;
                case "Visa":
                  let visaScrapper = new Visa_Scrapper();
                  await visaScrapper.createCompanyJobSearchQuery(
                    jobSearchObject
                  );
                  break;
                case "TestWebsite":
                  let testWebsiteScraapper = new TestWebsite_Scrapper();
                  await testWebsiteScraapper.createCompanyJobSearchQuery(
                    jobSearchObject
                  );
                  break;
                default:
                  console.error(
                    "For some reason a company who's scrapper has not been implemented was sent to the backend"
                  );
              }
        }
        jobSearchObject.save().then(() => console.log("Job search new query updated successfully!")).catch((error) => console.error(error))
        await updateJobSearchQueryJSONDate();
    } catch (err) {
      console.log("Error thrown")
      console.log(err.message)
      throw new Error(err)
    }
    return "Cronjob executed successfully!"
}

async function updateJobSearchQueryJSONDate() {
    const currDate = helperFunctions.getCurrentParsedDate();
    let data = await fs.readFile(latestJobUpdateFilePath, 'utf8');
    data = JSON.parse(data);
    data.latestJobUpdateDate = currDate;
    const updatedData = JSON.stringify(data, null, 2);
    fs.writeFile(latestJobUpdateFilePath, updatedData);
}

module.exports = {dailyJobScrapeCronJob};