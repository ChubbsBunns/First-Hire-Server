const { By } = require("selenium-webdriver");
const helperFunctions = require("../helperFunctions/helperFunctions");
const { Scrapper } = require("./scrapper");

class Visa_Scrapper extends Scrapper {
  async createCompanyJobSearchQuery( jobSearchQueryObject) {
    let scrapper = new Scrapper();
    let driver = await scrapper.createDriver();
    try {
      await driver.get("https://www.visa.com.sg/en_sg/jobs/?cities=Singapore");
      let numberCurrentViewableResults = 0;

      try {
        let declineCookiesButton = await driver.findElement(
          By.className("wscrOk2")
        );
        await declineCookiesButton.click();
      } catch (err) {
        console.error("Cant find the cookie button");
      }
      let totalNumberOfSingaporeJobs = 0;
      try {
        let rawNumberOfJobsString = "";
        while (rawNumberOfJobsString == "") {
          rawNumberOfJobsString = await (
            await driver.findElement(By.css(`span[aria-atomic="true"]`))
          ).getText();
        }
        totalNumberOfSingaporeJobs = await this.getNumberOfJobs(
          rawNumberOfJobsString
        );
      } catch (err) {
        console.error(err);
      }

      let numberTimesClicked = 0;
      let currentViewableJobs = [];

      do {
        try {
          let loadMoreButton = await driver.findElement(
            By.className("vs-btn vs-btn-primary vs-px-4")
          );
          loadMoreButton.click();
          numberTimesClicked += 1;
        } catch (err) {
          console.error(err);
        }
        currentViewableJobs = await driver.findElements(
          By.className("vs-h3 vs-link-job vs-link-new-window")
        );
        numberCurrentViewableResults = currentViewableJobs.length;
      } while (numberCurrentViewableResults < totalNumberOfSingaporeJobs);

      let jobOpenings = [];
      for (let job of currentViewableJobs) {
        jobOpenings.push(await job.getText());
      }

      helperFunctions.saveCompanyResults(
        jobOpenings,
        jobSearchQueryObject,
        "Visa"
      )
    } catch (err) {
      console.error(err);
    } finally {
      await driver.quit();
    }
  }

  getNumberOfJobs(rawNumberOfJobsString) {
    let outputNumber = "";
    for (let i = 0; i < rawNumberOfJobsString.length; i++) {
      if (rawNumberOfJobsString[i] == " ") {
        break;
      }
      outputNumber = outputNumber + rawNumberOfJobsString[i];
    }
    return parseInt(outputNumber);
  }
}

module.exports = { Visa_Scrapper };
