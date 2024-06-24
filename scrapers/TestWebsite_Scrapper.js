const { By, until } = require("selenium-webdriver");
const helperFunctions = require("../helperFunctions/helperFunctions");
const { Scrapper } = require("./Scrapper.js");

class TestWebsite_Scrapper extends Scrapper {
    async createCompanyJobSearchQuery(jobSearchQueryObject) {
        try {
            let scrapper = new Scrapper();
            let driver = await scrapper.createDriver();
            try {
                await driver.get("https://test-first-hire-job-portal.vercel.app/");
                let jobOpenings = [];
                const jobs = await driver.findElements(By.id('jobTitle'));
                for (const job of jobs) {
                    jobOpenings.push(await job.getText());
                }
                helperFunctions.saveCompanyResults(
                    jobOpenings,
                    jobSearchQueryObject,
                    "TestWebsite"
                )
            } catch(err) {
                console.error(err);
            } finally {
                await driver.quit();
            }
        } catch( err) {
            console.error(err);
        }
    }
}

module.exports = { TestWebsite_Scrapper };