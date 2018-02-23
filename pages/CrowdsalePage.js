const Logger= require('../entity/Logger.js');
const logger=Logger.logger;
const tempOutputPath=Logger.tempOutputPath;

const page=require('./Page.js');
const webdriver = require('selenium-webdriver'),
    chrome = require('selenium-webdriver/chrome'),
    firefox = require('selenium-webdriver/firefox'),
    by = require('selenium-webdriver/lib/by');
const By=by.By;
//const buttonInvest=By.xpath('//*[@id="root"]/div/section/div[3]/a');
const buttonInvest=By.className("button button_fill");

class CrowdsalePage extends page.Page{

    constructor(driver){
        super(driver);
        this.URL;
        this.name="Crowdsale page :";

    }

   async  clickButtonInvest(){
        logger.info(this.name+"button Invest :");
        await super.clickWithWait(buttonInvest);

    }

}
module.exports={
    CrowdsalePage:CrowdsalePage
    }
