const { TestWebsite_Scrapper } = require("../scrapers/TestWebsite_Scrapper");
const { Shopback_Scrapper } = require("../scrapers/Shopback_Scrapper");
const { Visa_Scrapper } = require("../scrapers/Visa_Scrapper");
const { Cloudflare_Scrapper } = require("../scrapers/Cloudflare_Scrapper");
const helperFunctions = require("../helperFunctions/helperFunctions");

const fs = require('fs').promises;

const latestJobUpdateFilePath = "latestJobUpdateDate.json"
const databaseCompanyDataList = require("../static/CompanyList.json")
const JobSearchObject = require("../models/JobSearchAction")

//Get hard coded company names from CompanyList.json
async function getLatestJobSearchQueryDate(req, res) {
  try {
    let data = await fs.readFile(latestJobUpdateFilePath, 'utf8'); 
    const latestDate =  JSON.parse(data).latestJobUpdateDate
    return res.json(latestDate)
  } catch(err) {
    console.log(err)
  }
}

async function startJobScrappingJob() {
    try {
        const companyNames = databaseCompanyDataList.companyDetails.map(companyDetail => Object.keys(companyDetail)[0]);
        let jobSearchObject = new JobSearchObject();
        jobSearchObject.date = helperFunctions.getCurrentParsedDate();
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
    } catch (err) {
        console.log(err);
        res.json(err);
    }
}

async function createJobSearchQueryObject(req, res) {
    try {
      console.log("Job Search query object being created")
        const companyNames = databaseCompanyDataList.companyDetails.map(companyDetail => Object.keys(companyDetail)[0]);
        let jobSearchObject = new JobSearchObject();
        jobSearchObject.date = helperFunctions.getCurrentParsedDate();
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
        res.json(jobSearchObject)

    } catch (err) {
        console.log(err);
        res.json(err);
    }
}
module.exports = {
    createJobSearchQueryObject, getLatestJobSearchQueryDate, startJobScrappingJob
};