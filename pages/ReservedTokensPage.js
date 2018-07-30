const logger = require('../entity/Logger.js').logger;
const Page = require('./Page.js').Page;
const By = require('selenium-webdriver/lib/by').By;
const Utils = require('../utils/Utils.js').Utils;
const ReservedTokensContainer = By.className("reserved-tokens-item-container-inner");
const buttonAdd = By.className("button button_fill button_no_icon");//("button button_fill button_no_icon");
const itemsRemove = By.className("item-remove");
const buttonClearAll = By.className("fa fa-trash");
const buttonYesAlert = By.className("swal2-confirm swal2-styled");
const buttonNoAlert = By.className("swal2-cancel swal2-styled");
const buttonOK = By.className("swal2-confirm swal2-styled");

class ReservedTokensPage extends Page {

	constructor(driver) {
		super(driver);
		this.URL;
		this.fieldAddress;
		this.fieldValue;
		this.name = "Reserved tokens :"
		this.itemsRemove = [];
	}

	async initWarnings() {
		logger.info(this.name + "initWarnings ");
		try {
			const locator = By.xpath("//p[@style='color: red; font-weight: bold; font-size: 12px; width: 100%; height: 10px;']");
			let array = await super.findWithWait(locator);
			if (array === null) return null;
			this.warningAddress = array[3];
			this.warningValue = array[4];
			return array;
		}
		catch (err) {
			logger.info("Error: " + err);
			return null;
		}
	}

	async initItemsRemove() {
		logger.info(this.name + "initItemsRemove ");
		try {
			logger.info(this.name + "initItemsRemove ");
			let array = await super.findWithWait(itemsRemove);
			if (array === null) return null;
			for (let i = 0; i < array.length; i++) {
				this.itemsRemove[i] = array[i];
			}
			return array;
		}
		catch (err) {
			logger.info("Error: " + err);
			return null;
		}
	}

	async initReservedTokensContainer() {
		logger.info(this.name + "initReservedTokensContainer warnings ");
		return await super.findWithWait(ReservedTokensContainer,10);
	}

	async initInputFields() {
		logger.info(this.name + "initInputFields ");
		try {
			let locator = By.className("input");
			let array = await super.findWithWait(locator);
			this.fieldAddress = array[3];
			this.fieldValue = array[4];
			return array;
		}
		catch (err) {
			logger.info("Error: " + err);
			return null;
		}
	}

	async initCheckboxes() {
		logger.info(this.name + "initCheckboxes ");
		try {
			let locator = By.className("radio-inline");
			let array = await super.findWithWait(locator);
			this.checkboxTokens = array[0];
			this.checkboxPercentage = array[1];
			return array;
		}
		catch (err) {
			logger.info("Error: " + err);
			return null;
		}
	}

	async amountAddedReservedTokens() {
		logger.info(this.name + "amountAddedReservedTokens ");
		try {
			let array = await this.initReservedTokensContainer();
			let length = 0;
			if (array !== null) length = array.length;
			logger.info("Reserved tokens added=" + length);
			return length;
		}
		catch (err) {
			logger.info("Error " +err);
			return 0;
		}
	}

	async setDimension(dimension) {
		logger.info(this.name + "setDimension ");
		if (dimension === 'percentage') await this.clickCheckboxPercentage();
		else await this.clickCheckboxTokens();
	}

	async fillAddress(value) {
		logger.info(this.name + "field Address with value=" + value);
		if (value === "") return true;
		return (await this.initInputFields() !== null) &&
			await this.clearField(this.fieldAddress) &&
			await this.fillWithWait(this.fieldAddress, value);
	}

	async fillValue(value) {
		logger.info(this.name + " fillValue with value " + value);
		if (value === "") return true;
		return (await this.initInputFields() !== null) &&
			await this.clearField(this.fieldValue) &&
			await this.fillWithWait(this.fieldValue, value);
	}

	async fillOneReservedToken(reservedTokens) {
		logger.info(this.name + "fillOneReservedToken ");

		do {
			await this.fillAddress(reservedTokens.address);
		} while (await this.isPresentWarningAddress());

		await this.setDimension(reservedTokens.dimension);

		do {
			await this.fillValue(reservedTokens.value);
		} while (await this.isPresentWarningValue() && (counter-- > 0));
		return true;
	}

	async clickCheckboxPercentage() {
		logger.info(this.name + "clickCheckboxPercentage ");
		return (await this.initCheckboxes() !== null) &&
			await super.clickWithWait(this.checkboxPercentage);
	}

	async clickCheckboxTokens() {
		logger.info(this.name + "clickCheckboxTokens ");
		await this.initCheckboxes();
		return (await this.initCheckboxes() != null) &&
			await super.clickWithWait(this.checkboxTokens);
	}

	async clickButtonAddReservedTokens() {
		logger.info(this.name + "clickButtonAddReservedTokens ");
		return await super.clickWithWait(buttonAdd);
	}

	async removeReservedTokens(value) {
		logger.info(this.name + "removeReservedTokens ");
		return (await this.initItemsRemove() !== null) &&
			await super.clickWithWait(this.itemsRemove[value]);
	}

	async clickButtonClearAll() {
		logger.info(this.name + " clickButtonClearAll :");
		try {
			await this.driver.executeScript("document.getElementsByClassName('fa fa-trash')[0].click();");
			return true;
		}
		catch (err) {
			logger.info(err);
			return false;
		}
	}

	async isLocatedButtonClearAll() {
		logger.info(this.name + "isLocatedButtonClearAll ");
		return await super.isElementLocated(buttonClearAll);
	}

	async isDisplayedButtonYesAlert() {
		logger.info(this.name + "isDisplayedButtonYesAlert ");
		return await super.isElementDisplayed(buttonYesAlert);
	}

	async isDisplayedButtonNoAlert() {
		logger.info(this.name + "isDisplayedButtonNoAlert ");
		return await super.isElementDisplayed(buttonNoAlert);
	}

	async clickButtonYesAlert() {
		logger.info(this.name + "clickButtonYesAlert ");
		return await super.clickWithWait(buttonYesAlert);

	}

	async clickButtonNoAlert() {
		logger.info(this.name + "clickButtonNoAlert ");
		return await super.clickWithWait(buttonNoAlert);
	}

	async isPresentWarningAddress() {
		logger.info(this.name + "isPresentWarningAddress ");
		return false;
		await this.initWarnings();
		if ((await super.getTextForElement(this.warningAddress)) !== "") return true;
		else return false;
	}

	async isPresentWarningValue() {
		logger.info(this.name + "isPresentWarningValue ");
		return false;
		await this.initWarnings();
		if ((await super.getTextForElement(this.warningValue)) !== "") return true;
		else return false;
	}

	async fillReservedTokens(crowdsale) {
		logger.info(this.name + "fillReservedTokens ");
		let result = true;
		for (let i = 0; i < crowdsale.reservedTokens.length; i++) {
			result = result &&
				await this.fillOneReservedToken(crowdsale.reservedTokens[i]) &&
				await this.clickButtonAddReservedTokens();
		}
		return result;
	}
	async fillBulkReservedTokens(path) {
		logger.info(this.name + "fillBulkReservedTokens ");

		let result = await this.uploadReservedCSVFile(path)
		  && await this.clickButtonOk();
		return result;
	}
	async uploadReservedCSVFile(path) {
		logger.info(this.name + "uploadReservedCSVFile ");
        if (path === undefined) path = "./public/reservedAddressesTestValidation.csv";
		try {
			const locator = By.xpath('//input[@type="file"]');
			let element = await this.driver.findElement(locator);
			let pathPWD = await Utils.getPathToFileInPWD(path);
			logger.info("path =  "+pathPWD);
			await element.sendKeys(pathPWD);
			return true;
		}
		catch (err) {
			logger.info("Error " + err);
			return false;
		}
	}

	async clickButtonOk() {
		logger.info("clickButtonOk");
		return await super.clickWithWait(buttonOK);

	}
	async isDisplayedButtonOk() {
		logger.info(this.name + "isDisplayedButtonOk ");
		return await super.isElementDisplayed(buttonOK);

	}

	async waitUntilShowUpPopupConfirm(Twaiting) {
		logger.info("waitUntilShowUpPopupConfirm: ");
		return await this.waitUntilDisplayed(buttonYesAlert, Twaiting);
	}

}

module.exports.ReservedTokensPage = ReservedTokensPage;