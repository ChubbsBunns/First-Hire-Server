const { By } = require("selenium-webdriver");
const helperFunctions = require("../helperFunctions/helperFunctions");
const { Scrapper } = require("./Scrapper.js");

class Cloudflare_Scrapper extends Scrapper {
  async createCompanyJobSearchQuery(jobSearchQueryObject) {
    let scrapper = new Scrapper();
    let driver = await scrapper.createDriver();

    try {
      await driver.get(
        "https://www.cloudflare.com/careers/jobs/?location=Singapore"
      );
      let currentViewableJobs = await driver.findElements(
        By.className("inline-link-style f4 fw7 lh-title")
      );
      let jobOpenings = [];
      for (let job of currentViewableJobs) {
        jobOpenings.push(await job.getText());
      }
      helperFunctions.saveCompanyResults(
        jobOpenings,
        jobSearchQueryObject,
        "Cloudflare"
      )
    } catch (err) {
      console.error(err);
    }
    finally {
      await driver.quit();
    }
  }
}

module.exports = { Cloudflare_Scrapper };
