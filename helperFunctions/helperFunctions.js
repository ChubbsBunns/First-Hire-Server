const FilteredJobSearch = require("../models/FilteredJobSearch");
const JobSearchObject = require("../models/JobSearchAction")
const User = require("../models/User")

const databaseCompanyDataList = require("../static/CompanyList.json")
const latestJobUpdateFilePath = "./latestJobUpdateDate.json"

const fs = require('fs').promises;

const dotenv = require('dotenv');
const AWS = require('aws-sdk');
const { ConsoleLogEntry } = require("selenium-webdriver/bidi/logEntries");
dotenv.config()

const SES_CONFIG = {
  accessKeyId: process.env.AWS_ACCESS_KEY,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  region: process.env.AWS_SES_REGION,
}

const AWS_SES = new AWS.SES(SES_CONFIG)

function parseKeyWords(keywordsRaw) {
  return keywordsRaw.split(",").map((phrase) => phrase.trim().toLowerCase());
}

async function testEmail(req, res) {
  await sendEmail("firsthireofficial@gmail.com", "firstHire");
  res.status(200).send("Email request sent!");
}

async function sendEmail(recipientEmail, recipientName, htmlString, textString) {
  let params = {
    Source: process.env.AWS_SES_SENDER,
    Destination: {
      ToAddresses: [
        recipientEmail
      ],
    },
    ReplyToAddresses: [],
    Message: {
      Body: {
        Html: {
          Charset:'UTF-8',
          Data: htmlString
          /* Data: '<h1>This is an email body (Html body)</h1>' */
        },
        Text: {
          Charset: 'UTF-8',
          Data: textString
/*           Data: "This is the text section of the email (Text)" */
        } 
      },
      Subject: {
        Charset: 'UTF-8',
        Data: `Hello ${recipientName}!`
      }
    },
  }
  
  try {
    const res = await AWS_SES.sendEmail(params).promise();
    console.log("Email sent to " + recipientEmail)
    console.log(res);
  } catch (err) {
    console.error(err)
  }
}

function getJobLinkDictionary() {
  let jobLinkLookup = new Map();
  for (const companyObject of databaseCompanyDataList.companyDetails) {
    jobLinkLookup.set()
    const companyName = Object.keys(companyObject)[0];
    const companyURL = companyObject[companyName];

    // Set the key-value pair in the map
    jobLinkLookup.set(companyName, companyURL);
  }
  return jobLinkLookup;
}

function getMatchingJobsDataForWebpage(keyPhrases, negativePhrases, selectedCompanies, companiesToSearchData) {
  let jobDataList = [];
  let jobLinkDictionary = getJobLinkDictionary();
  let id = 0;
  for (let companyIndex = 0; companyIndex < companiesToSearchData.length; companyIndex++) {
    const specificCompanyData = companiesToSearchData[companyIndex];
    if (!selectedCompanies.includes(specificCompanyData.companyName)) {
      continue;
    }
    const companySpecificJobs = new Map();
    for (let keyPhraseIndex = 0; keyPhraseIndex < keyPhrases.length; keyPhraseIndex++) {
      const keyPhrase = keyPhrases[keyPhraseIndex];
      const filteredCompanyJobList = getFilteredList(keyPhrase, negativePhrases, specificCompanyData.results);
      if (filteredCompanyJobList.length == 0) {
        continue;
      }
      for (let jobIndex = 0; jobIndex < filteredCompanyJobList.length; jobIndex ++) {
        companySpecificJobs.set(filteredCompanyJobList[jobIndex], specificCompanyData.companyName);
      }
    }

    for (let [jobName, companyName] of companySpecificJobs) {
      jobDataList.push({id : id, jobName: jobName, companyName: companyName, companyCareerPageLink: jobLinkDictionary.get(companyName)});
      id += 1;
    }
  }
  return jobDataList;
}

function getMatchingJobsFromSpecifiedCompanyList(keyPhrases, negativePhrases, companiesToSearch) {
  const newJobSearch = new FilteredJobSearch();
  for (let i = 0; i < keyPhrases.length; i++) {
     for (let companyIndex = 0; companyIndex < companiesToSearch.length; companyIndex++) {
      const filteredCompanyJobList = getFilteredList(keyPhrases[i], negativePhrases, companiesToSearch[companyIndex].results)
      if (filteredCompanyJobList.length >= 1) {
        newJobSearch.keyPhrases.push({
          keyPhrase: keyPhrases[i],
          company: [
            {
              companyName: companiesToSearch[companyIndex].companyName,
              matchingJobs: filteredCompanyJobList
            }
          ]
        })
      } else {
        console.log("None")
      }
    }
  }
  return newJobSearch;
}

function getFilteredList(keyPhrase, negativePhrases, companyJobList) {
  let filteredCompanyJobList = []
  for (let i = 0; i < companyJobList.length; i++) {
    if (companyJobList[i].toLowerCase().includes(keyPhrase.toLowerCase())) {
      filteredCompanyJobList.push(companyJobList[i])
    }
  }
  const finalCompanyJobList = filteredCompanyJobList.filter(jobTitle => {
    return !negativePhrases.some(phrase => jobTitle.toLowerCase().includes(phrase))
  })
  return filteredCompanyJobList
}

function getFilteredJobs(keyPhrase, jobList) {
  let filteredJobList = [];
  for (let job of jobList) {
    if (job.toLowerCase().includes(keyPhrase.toLowerCase())) {
      filteredJobList.push(job);
    }
  }
  return filteredJobList;
}

function getCurrentParsedDate() {
  const currDate = new Date();
  return (currDate.getDate() + '/' + (currDate.getMonth() + 1) + '/' + currDate.getFullYear());
}

function saveCompanyResults(  jobOpenings,
  jobSearchQueryObject,
  companyName) {
    jobSearchQueryObject.companyResults.push({
      companyName: companyName,
      results: jobOpenings,
    })
  }

async function getSpecificJobSearchObject(targetDate) {
  console.log(targetDate)
  return JobSearchObject.findOne({ date: targetDate })
}

async function getCompanyList(req, res) {
  return res.json(databaseCompanyDataList)
}

async function getCompanyListNames(req, res) {
  const companyNames = databaseCompanyDataList.companyDetails.map(companyDetail => Object.keys(companyDetail)[0]);
  res.json(companyNames)
}

async function getAllCurrentJobData(req, res) {
  const data = await fs.readFile(latestJobUpdateFilePath, 'utf8');
  const currDate = JSON.parse(data).latestJobUpdateDate;
  let allJobDataObject = await getSpecificJobSearchObject(currDate)
  if (allJobDataObject == null) {
    res.status(404).send("The Job Data object is empty");
  } else {
    const companyList = allJobDataObject.companyResults;
    let id = 0;
    let jobLinkDictionary = getJobLinkDictionary();
    let jobDataList = [];
    for (let companyIndex = 0; companyIndex < companyList.length; companyIndex++) {
      const specificCompanyData = companyList[companyIndex];
      for (let jobIndex = 0; jobIndex < specificCompanyData.results.length; jobIndex++ ) {
        jobDataList.push({id : id, jobName: specificCompanyData.results[jobIndex], companyName: specificCompanyData.companyName, companyCareerPageLink: jobLinkDictionary.get(specificCompanyData.companyName)});
        id += 1;
      }
    }
    res.json({
      jobDataList
    })
  }

}

async function getUserMatchingJobSearchObjects(req, res) {
  try {
    const userEmail = req.query.email;
    console.log("user email is " + userEmail)
    const currentUser = await User.findOne({
      "email": req.query.email
    })
    console.log("The current user is ")
    console.log(currentUser)
    if (currentUser.keywordSettings == null || currentUser.keywordSettings == undefined) {
      res.json({
        
      })
    }
    else {
      let keyPhrases = currentUser.keywordSettings.jobPhrases;
      let negativePhrases = currentUser.keywordSettings.negativePhrases;
      let selectedCompanies = currentUser.keywordSettings.selectedCompanies;  
      const data = await fs.readFile(latestJobUpdateFilePath, 'utf8');
      const currDate = JSON.parse(data).latestJobUpdateDate;
    
      let currentJobSearchObject = await getSpecificJobSearchObject(currDate)
      if (currentJobSearchObject == null || undefined) {
        console.log("The current job search object is null or undefined")
        res.status(404).send("The Job Data object is empty");
      } 
      else {
        console.log("The current job search object is not null or undefined")
        const companyList = currentJobSearchObject.companyResults;
        if (companyList == undefined || companyList == null) {
          console.log("Company list is undefined")
          res.status(404).send("The Job Data object is empty");
        } else {
          //Filter company list to only have the user's specific companies
          const newJobSearch = getMatchingJobsDataForWebpage(keyPhrases, negativePhrases, selectedCompanies, companyList)
          console.log("Returned the response")
          res.json({
            newJobSearch
          })
        }
    }  
    }


    } catch(err) {
      console.log("1")
      console.log(err.message)
      console.log("2")
      console.log("There was an error caught in the backend")
      res.json({message: "Something went wrong"})
    }

}

module.exports = { parseKeyWords, parseFilteredJobSearchObject: getMatchingJobsFromSpecifiedCompanyList, sendEmail, getSpecificJobSearchObject, getCurrentParsedDate, getFilteredJobs, saveCompanyResults, getCompanyList, getCompanyListNames, getUserMatchingJobSearchObjects, getAllCurrentJobData, getJobLinkDictionary, getFilteredList, testEmail };
