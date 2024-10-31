const JobSearchQuery = require("../../models/JobSearchQuery");
const { Shopback_Scrapper } = require("../../scrapers/Shopback_Scrapper");
const { Visa_Scrapper } = require("../../scrapers/Visa_Scrapper");
const { Cloudflare_Scrapper } = require("../../scrapers/Cloudflare_Scrapper");
const helperFunctions = require("../../helperFunctions/helperFunctions");
const dotenv = require("dotenv")

const User = require("../../models/User")

const {getJobLinkDictionary} = require("../../helperFunctions/helperFunctions")

dotenv.config();

//This function cleans up user data (if theres any changes to their settings)
//Then it filters for jobs that are specific to a specific user
//Then it updates the saved jobs to a user
//Then it only sends the new jobs via email to the user
async function dailyEmailJob() {

  try {
      const users = await User.find({});
      const usersWithKeywordsAndCompanies = users.filter(user => {
        const keyPhrases = user.keywordSettings.jobPhrases;
        const selectedCompanies = user.keywordSettings.selectedCompanies;
        return keyPhrases.length > 0 && selectedCompanies.length > 0;
      });

      usersWithKeywordsAndCompanies.map( async user => {
        await cleanUserData(user);
        const userSavedDataJobList = new Map();
        for (const sentDataItem of user.sentData) {
          const {companyName, sentJobs} = sentDataItem;
          const jobSet = new Set(sentJobs);
          userSavedDataJobList.set(companyName, jobSet);
        }
        
        let keyPhrases = user.keywordSettings.jobPhrases;
        let negativePhrases = user.keywordSettings.negativePhrases;
        let selectedCompanies = user.keywordSettings.selectedCompanies;

        const currDate = helperFunctions.getCurrentParsedDate();

        let currentJobSearchObject = await helperFunctions.getSpecificJobSearchObject();
        const companyList = currentJobSearchObject.companyResults;
        let filteredCompanyJobList = await getFilteredCompanyJobList(keyPhrases, negativePhrases, selectedCompanies, companyList);

        //Compare filteredCompanyJobList with sentDataMap
        const newlyAddedJobData = {};

        // for each of the current user saved entires, 
        // if it doesnt exist in filtered jobs, that means the job is obsolete
        // and should be removed
        for (const [companyName, sentJobs] of userSavedDataJobList.entries()) {
          if (filteredCompanyJobList.has (companyName)) {
            const filteredJobs = filteredCompanyJobList.get(companyName)
            
            //Removes jobs from user saved data that do not exist anymore
            const updatedJobs = new Set([...sentJobs].filter(job => filteredJobs.has(job)));
            userSavedDataJobList.set(companyName, updatedJobs);
          }
        }
        
        
        // For each of the companies in filteredCompnayJobList
        // if there are any new jobs, update usersaveddatajoblist
        for (const[companyName, companyJoblist] of filteredCompanyJobList.entries()) {
          if (userSavedDataJobList.has(companyName)) {
            const correspondingUserSavedCompanyData = userSavedDataJobList.get(companyName);
            const newJobs = new Set([...companyJoblist].filter(job => !correspondingUserSavedCompanyData.has(job)));
            userSavedDataJobList.set(companyName, new Set([...correspondingUserSavedCompanyData, ...newJobs]));
            newlyAddedJobData[companyName] = newJobs;
            // The user saved data has an entry for filtered company job list
            // Check for new jobs
            // append these new jobs into the newlyadded job data.
            // add these new jobs into the userSavedDataJoblist corresponding company element
          } else {
            const newJobs = new Set(companyJoblist);
            userSavedDataJobList.set(companyName, newJobs);
            newlyAddedJobData[companyName] = newJobs;
            // this means that none of the jobs from this company have been sent to the user.
            // create a new entry in the usersaveddatajoblist and append ALL the jobs there.
            // appendall the jobs into newlyAddedJobData
            // Save the data in to the user data thereafter.
          }
          user.sentData = Array.from(userSavedDataJobList.entries()).map(([companyName, jobs]) => ({
            companyName,
            sentJobs: Array.from(jobs),
          }));
          await user.save();
        }

        let emailHtmlString = parseNewJobDataIntoEmailHtmlString(newlyAddedJobData);
        let emailTextString = parseNewJobDataIntoEmailTextString(newlyAddedJobData);
        await helperFunctions.sendEmail(user.email, user.name, emailHtmlString, emailTextString);
    })
  } catch (err) {
    console.error(err);
    throw new Error(err);
  }
    res.json({"Yay it works": "It workerinos"});
}

//This is for html
function parseNewJobDataIntoEmailHtmlString(newlyAddedJobData) {
  let jobLinkDictionary = getJobLinkDictionary();
  let emailHtmlString = "<h2><b>Here is your First Hire update! Here are the latest jobs that match your parameters:</b></h2>";
  for (const[companyName, newJobs] of Object.entries(newlyAddedJobData))  {
    if (newJobs.size == 0) {
      continue;
    }
    const companyTitleAndButton = `<h3><p>${companyName} <a href="${jobLinkDictionary.get(companyName)}" target="_blank"><button>Head to Job Portal</button></a> </p></h3>`;
    emailHtmlString += companyTitleAndButton;

    let jobListHtml = "";
    for (const newJob of newJobs) {
      const jobDivTag = `<div>${newJob}</div>`
      jobListHtml += jobDivTag;
    }
    emailHtmlString += jobListHtml;
  }
  return emailHtmlString;
}

//This is for text
function parseNewJobDataIntoEmailTextString(newlyAddedJobData) {
  let jobLinkDictionary = getJobLinkDictionary();
  let emailTextString = `Here is your First Hire update! Here are the latest jobs that match your parameters: \n`;
  for (const[companyName, newJobs] of Object.entries(newlyAddedJobData))  {
    const companyTitleAndButton = `Company: ${companyName}, Job Link: ${jobLinkDictionary.get(companyName)}" \n`;
    emailTextString += companyTitleAndButton;

    let jobListHtml = "";
    for (const newJob of newJobs) {
      const jobDivTag = `${newJob}]\n`
      jobListHtml += jobDivTag;
    }
    emailTextString += jobListHtml;
  }
  return emailTextString;
}

//This is coright
async function cleanUserData(user) {
    user.sentData = user.sentData.filter(sentDataEntry =>
        user.keywordSettings.selectedCompanies.includes(sentDataEntry.companyName)
      );
    await user.save()
}

async function getFilteredCompanyJobList(keyPhrases, negativePhrases, selectedCompanies, companiesData) {
  let filteredCompanyJobList = new Map();
  //Foreach company in the job search query
  for (let companyIndex = 0; companyIndex < companiesData.length; companyIndex++) {
    const specificCompanyData = companiesData[companyIndex];

    //If the company is not within the user's specifications, skip it
    if (!selectedCompanies.includes(specificCompanyData.companyName)) {
      continue;
    }

    //This will help keep track of all the jobs specific to the user
    const companyFilteredJobs = new Set();

    //For each key phrase, filter for jobs
    for (let keyPhraseIndex = 0; keyPhraseIndex < keyPhrases.length; keyPhraseIndex++) {
      const keyPhrase = keyPhrases[keyPhraseIndex];
      const filteredCompanyJobList = helperFunctions.getFilteredList(keyPhrase, negativePhrases, specificCompanyData.results);
      //If the current filtered list is 0, that means that there are no
      //jobs that match the current phrase, skip this phrase
      if (filteredCompanyJobList.length == 0) {
        continue;
      }

      //Add all the current jobs to the set
      for (let filteredJobIndex = 0; filteredJobIndex < filteredCompanyJobList.length; filteredJobIndex++) {
        companyFilteredJobs.add(filteredCompanyJobList[filteredJobIndex]);
      }
    }

    //For this company, there are no jobs that the user has that match this company
    if (companyFilteredJobs.size == 0) {
      continue;
    }
    //Set the filtered jobs for the current company
    filteredCompanyJobList.set(specificCompanyData.companyName, companyFilteredJobs);
  }
  return filteredCompanyJobList;
}

async function removeNonMatchingSentJobs(user, jobSearchObject) {
    for (const sentDataItem of user.sentData) {
      const matchingCompany = jobSearchObject.companyResults.find(
        companyResult => companyResult.companyName === sentDataItem.companyName
      );
      if (matchingCompany) {
        sentDataItem.sentJobs = sentDataItem.sentJobs.filter(sentJob =>
          matchingCompany.results.includes(sentJob)
        );
      }
    }
    await user.save();
  }

  module.exports = {dailyEmailJob}