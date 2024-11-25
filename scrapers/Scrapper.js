const { Builder } = require("selenium-webdriver");
const Chrome = require("selenium-webdriver/chrome");
const options = new Chrome.Options();

class Scrapper {
  async createDriver() {
    let driver = await new Builder()
      .forBrowser("chrome")
      .build();
    await driver.manage().setTimeouts({ implicit: 20000 });
    return driver;
  }
}

module.exports = { Scrapper };
