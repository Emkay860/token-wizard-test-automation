let test = require('selenium-webdriver/testing');
let assert = require('assert');
const fs = require('fs-extra');
///////////////////////////////////////////////////////
const WizardWelcome = require('../pages/WizardWelcome.js').WizardWelcome;
const WizardStep1 = require('../pages/WizardStep1.js').WizardStep1;
const WizardStep2 = require('../pages/WizardStep2.js').WizardStep2;
const WizardStep3 = require('../pages/WizardStep3.js').WizardStep3;
const WizardStep4 = require('../pages/WizardStep4.js').WizardStep4;
const TierPage = require('../pages/TierPage.js').TierPage;
const ReservedTokensPage = require('../pages/ReservedTokensPage.js').ReservedTokensPage;
const CrowdsalePage = require('../pages/CrowdsalePage.js').CrowdsalePage;
const ContributionPage = require('../pages/ContributionPage.js').InvestPage;
const InvestPage = require('../pages/ContributionPage.js').InvestPage;
const ManagePage = require('../pages/ManagePage.js').ManagePage;
const logger = require('../entity/Logger.js').logger;
const tempOutputPath = require('../entity/Logger.js').tempOutputPath;
const Utils = require('../utils/Utils.js').Utils;
const User = require("../entity/User.js").User;
const PublishPage = require('../pages/PublishPage.js').PublishPage;

test.describe(`e2e test for TokenWizard2.0/MintedCappedCrowdsale. v ${testVersion}`, async function () {
    this.timeout(2400000);//40 min
    this.slow(1800000);

    const user8545_56B2File = './users/user8545_56B2.json';//Owner
    const user77_F16AFile = './users/user77_F16A.json';//Investor1
    let driver;
    let Owner;
    let Investor1;

    let wallet;
    let welcomePage;
    let wizardStep1;
    let wizardStep2;
    let wizardStep3;
    let wizardStep4;
    let tierPage;
    let reservedTokensPage;
    let investPage;
    let contributionPage;
    let crowdsalePage;

    let startURL;
    let crowdsaleForUItests;
    let mngPage;
    let balanceEthOwnerBefore;
    let crowdsaleMintedSimple;
    let publishPage;
    let scenarioSimple

    const placeholder = {
        gasCustom: '0.1',
        setupNameTier1: 'Tier 1',
        decimals: '18',
        mincap: '0'
    }

    const newValue = {
        setupNameTier1: 'tier#1',
        name: 'Name',
        decimals: '13',
        customGas: '100',
        ticker: 'Tick',
        rateTier1: '456',
        supplyTier1: '1e18',
        mincapTier2: '423'
    }


/////////////////////////////////////////////////////////////////////////

    test.before(async function () {
        // const endTimeShouldBe = await Utils.getUTCPublishFormat('01/05/2030 11:22')
        // console.log(endTimeShouldBe)
        // throw('Stoper3e')
        await Utils.copyEnvFromWizard();

        const scenarioForUItests = './scenarios/scenarioUItests.json';
        crowdsaleForUItests = await Utils.getMintedCrowdsaleInstance(scenarioForUItests);
        scenarioSimple = './scenarios/scenarioMintedSimple.json'
        crowdsaleMintedSimple = await Utils.getMintedCrowdsaleInstance(scenarioSimple);

        startURL = await Utils.getStartURL();
        driver = await Utils.startBrowserWithWallet();

        Owner = new User(driver, user8545_56B2File);
        await Utils.receiveEth(Owner, 20);
        Investor1 = new User(driver, user77_F16AFile);

        logger.info("Roles:");
        logger.info("Owner = " + Owner.account);
        balanceEthOwnerBefore = await Utils.getBalance(Owner);
        logger.info("Owner's balance = :" + balanceEthOwnerBefore / 1e18);

        wallet = await Utils.getWalletInstance(driver);
        //await wallet.activate();//return activated Wallet and empty page
        // await Owner.setWalletAccount();

        welcomePage = new WizardWelcome(driver, startURL);
        wizardStep1 = new WizardStep1(driver);
        wizardStep2 = new WizardStep2(driver);
        wizardStep3 = new WizardStep3(driver);
        wizardStep4 = new WizardStep4(driver);
        investPage = new InvestPage(driver);
        reservedTokensPage = new ReservedTokensPage(driver);
        mngPage = new ManagePage(driver);
        tierPage = new TierPage(driver, crowdsaleForUItests.tiers[0]);
        contributionPage = new ContributionPage(driver);
        crowdsalePage = new CrowdsalePage(driver);
        publishPage = new PublishPage(driver)
    });

    test.after(async function () {
        // Utils.killProcess(ganache);
        //await Utils.sendEmail(tempOutputFile);
        let outputPath = Utils.getOutputPath();
        outputPath = outputPath + "/result" + Utils.getDate();
        await fs.ensureDirSync(outputPath);
        await fs.copySync(tempOutputPath, outputPath);
        //await fs.remove(tempOutputPath);
        // await driver.quit();
    });
///////////////////////// UI TESTS /////////////////////////////////////

    describe('Welcome page', async function () {
        test.it('User is able to open wizard welcome page',
            async function () {
                await welcomePage.open();
                let result = await welcomePage.waitUntilDisplayedButtonNewCrowdsale(180);
                return await assert.equal(result, true, "Test FAILED. Wizard's page is not available ");
            });

        test.it('Warning present if user logged out from wallet',
            async function () {
                let result = await welcomePage.waitUntilShowUpWarning(180)
                return await assert.equal(result, true, "Test FAILED. No warning present if user logged out from wallet ");
            });

        test.it('User can confirm warning',
            async function () {
                let result = await welcomePage.clickButtonOk()
                return await assert.equal(result, true, "Test FAILED. Button Ok doesn\'t present");
            });

        test.it('No warning present if user logged into wallet',
            async function () {
                await wallet.activate();//return activated Wallet and empty page
                await Owner.setWalletAccount();
                let result = await welcomePage.waitUntilShowUpWarning(10)
                return await assert.equal(result, false, "Test FAILED. No warning present if user logged out from wallet ");
            });

        test.it('Button NewCrowdsale present ',
            async function () {
                let result = await welcomePage.isDisplayedButtonNewCrowdsale();
                return await assert.equal(result, true, "Test FAILED. Button NewCrowdsale not present ");
            });

        test.it('Button \'ChooseContract\' present ',
            async function () {
                let result = await welcomePage.isDisplayedButtonChooseContract();
                return await assert.equal(result, true, "Test FAILED. button ChooseContract not present ");
            });

        test.it('User is able to open Step1 by clicking button NewCrowdsale ',
            async function () {
                let result = await welcomePage.clickButtonNewCrowdsale()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap();
                return await assert.equal(result, true, "Test FAILED. User is not able to activate Step1 by clicking button NewCrowdsale");
            });
    })
    describe('Step#1: ', async function () {
        test.it('Go back - page keep state of checkbox \'Whitelist with mincap\' ',
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await wizardStep1.goBack()
                    && await welcomePage.isDisplayedButtonChooseContract()
                    && await wizardStep1.goForward()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                return await assert.equal(result, true, "Test FAILED. Checkbox changed");
            });

        test.it('Refresh - page keep state of checkbox \'Whitelist with mincap\' ',
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await wizardStep1.refresh()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                return await assert.equal(result, true, "Test FAILED. Checkbox changed");
            });

        test.it('Change network - page keep state of checkbox \'Whitelist with mincap\' ',
            async function () {
                const result = await wizardStep1.clickCheckboxWhitelistWithCap()
                    && await Investor1.setWalletAccount()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.isSelectedCheckboxWhitelistWithCap()
                    && await Owner.setWalletAccount()
                    && await wizardStep1.waitUntilLoaderGone()
                return await assert.equal(result, true, "Test FAILED. Checkbox changed");
            });

        test.it('User is able to open Step2 by clicking button Continue ',
            async function () {
                let count = 10;
                do {
                    await driver.sleep(1000);
                    if ( (await wizardStep1.isDisplayedButtonContinue()) &&
                        !(await wizardStep2.isDisplayedFieldName()) ) {
                        await wizardStep1.clickButtonContinue();
                    }
                    else break;
                }
                while ( count-- > 0 );
                let result = await wizardStep2.isDisplayedFieldName();
                return await assert.equal(result, true, "Test FAILED. User is not able to open Step2 by clicking button Continue");
            });
    })
    describe('Step#2: ', async function () {
        test.it('Field \'Decimals\' has placeholder 18',
            async function () {
                return await assert.equal(await wizardStep2.getValueFieldDecimals(), placeholder.decimals, "Test FAILED. Step#2:incorrect placeholder for field 'Decimals'");
            });

        test.it('User able to fill out field \'Name\' with valid data',
            async function () {
                let result = await wizardStep2.fillName(newValue.name)
                    && await wizardStep2.isDisplayedWarningName();
                return await assert.equal(result, false, "Test FAILED. Wizard step#2: field name changed");
            });

        test.it('Go back - page keep state of field \'Name\' ',
            async function () {
                const result = await wizardStep2.goBack()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.goForward()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "Test FAILED. Wizard step#2: field name changed");
                return await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Field name changed");
            });

        test.it('Refresh - page keep state of  field \'Name\'',
            async function () {
                const result = await wizardStep2.refresh()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "Test FAILED. Wizard step#2: field name changed");
                return await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Wizard step#2: field name changed");
            });

        test.it('Change network - page keep state of  field \'Name\'',
            async function () {
                const result = await Investor1.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && (await wizardStep2.getValueFieldName() === newValue.name)
                    && await Owner.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                    && (await wizardStep2.getValueFieldName() === newValue.name)
                return await assert.equal(result, true, "Test FAILED. Wizard step#2: field name changed");
            });

        test.it('User able to fill out field Ticker with valid data',
            async function () {
                await wizardStep2.fillTicker(newValue.ticker);
                let result = await wizardStep2.isDisplayedWarningTicker();
                return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not  able to fill out field Ticker with valid data ");
            });

        test.it('User able to fill out  Decimals field with valid data',
            async function () {
                await wizardStep2.fillDecimals(newValue.decimals);
                let result = await wizardStep2.isDisplayedWarningDecimals();
                return await assert.equal(result, false, "Test FAILED. Wizard step#2: user is not able to fill Decimals  field with valid data ");
            });


        test.it('User is able to download CSV file with reserved tokens',
            async function () {
                let fileName = './public/reservedAddresses21.csv';
                let result = await reservedTokensPage.uploadReservedCSVFile(fileName);
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
            });

        test.it('Alert present if number of reserved addresses greater 20 ',
            async function () {
                let result = await reservedTokensPage.waitUntilShowUpPopupConfirm(100)
                    && await reservedTokensPage.clickButtonOk();
                return await assert.equal(result, true, "Test FAILED.ClearAll button is NOT present");
            });
        test.it('Added only 20 reserved addresses from CSV file',
            async function () {
                let correctNumberReservedTokens = 20;
                let result = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, correctNumberReservedTokens, "Test FAILED. Wizard step#2: number of added reserved tokens is correct");
            });

        test.it('Check validator for reserved addresses',
            async function () {
                let fileName = './public/reservedAddressesTestValidation.csv';
                let result = await reservedTokensPage.uploadReservedCSVFile(fileName);
                await reservedTokensPage.clickButtonOk();
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
            });

        test.it('Added only valid data from CSV file',
            async function () {
                let correctNumberReservedTokens = 20;
                let result = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, correctNumberReservedTokens, "Test FAILED. Wizard step#2: number of added reserved tokens is correct");
            });

        test.it('Button ClearAll is displayed ',
            async function () {

                let result = await reservedTokensPage.isLocatedButtonClearAll();
                return await assert.equal(result, true, "Test FAILED.ClearAll button is NOT present");
            });

        test.it('Alert present after clicking ClearAll',
            async function () {
                await reservedTokensPage.clickButtonClearAll();
                let result = await reservedTokensPage.isDisplayedButtonNoAlert();
                return await assert.equal(result, true, "Test FAILED.Alert does NOT present after select ClearAll or button No does NOT present");
            });

        test.it('User is able to bulk delete of reserved tokens ',
            async function () {
                let result = await reservedTokensPage.waitUntilShowUpPopupConfirm(20)
                    && await reservedTokensPage.clickButtonYesAlert()
                    && await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, 0, "Wizard step#2: user is NOT able bulk delete of reserved tokens");
            });

        test.it('User is able to add reserved tokens one by one ',
            async function () {
                await reservedTokensPage.fillReservedTokens(crowdsaleForUItests);
                let result = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(result, crowdsaleForUItests.reservedTokens.length, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");
            });

        test.it('Field Decimals is disabled if reserved tokens are added ',
            async function () {
                let result = await wizardStep2.isDisabledDecimals();
                return await assert.equal(result, true, "Wizard step#2: field Decimals enabled if reserved tokens added ");
            });

        test.it('User is able to remove one of reserved tokens ',
            async function () {
                let amountBefore = await reservedTokensPage.amountAddedReservedTokens();
                await reservedTokensPage.removeReservedTokens(1);
                let amountAfter = await reservedTokensPage.amountAddedReservedTokens();
                return await assert.equal(amountBefore, amountAfter + 1, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");
            });

        test.it('Go back - page keep state of each field',
            async function () {
                const result = await wizardStep2.goBack()
                    && await wizardStep1.waitUntilDisplayedCheckboxWhitelistWithCap()
                    && await wizardStep1.goForward()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "Test FAILED. Wizard step#2: page isn\'t loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Field name changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "Test FAILED.Field decimals changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "Test FAILED.Field ticker changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");
            });

        test.it('Refresh - page keep state of each field',
            async function () {
                const result = await wizardStep2.refresh()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilDisplayedFieldName()
                    && await wizardStep2.waitUntilHasValueFieldName();
                await assert.equal(result, true, "Test FAILED. Wizard step#2: page isn\'t loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Field name changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "Test FAILED.Field decimals changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "Test FAILED.Field ticker changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");
            });

        test.it('Change network - page keep state of each field',
            async function () {
                let result = await Investor1.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                await assert.equal(result, true, "Test FAILED. Wizard step#2: page isn\'t loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Field name changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "Test FAILED.Field decimals changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "Test FAILED.Field ticker changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");

                result = await Owner.setWalletAccount()
                    && await wizardStep2.waitUntilLoaderGone()
                    && await wizardStep2.waitUntilHasValueFieldName()
                await assert.equal(result, true, "Test FAILED. Wizard step#2: page isn\'t loaded");
                await assert.equal(await wizardStep2.getValueFieldName(), newValue.name, "Test FAILED.Field name changed");
                await assert.equal(await wizardStep2.getValueFieldDecimals(), newValue.decimals, "Test FAILED.Field decimals changed");
                await assert.equal(await wizardStep2.getValueFieldTicker(), newValue.ticker, "Test FAILED.Field ticker changed");
                await assert.equal(await reservedTokensPage.amountAddedReservedTokens(), crowdsaleForUItests.reservedTokens.length - 1, "Test FAILED. Wizard step#2: user is NOT able to add reserved tokens");

            });

        test.it('Button Continue is displayed ',
            async function () {
                let result = await wizardStep2.isDisplayedButtonContinue();
                return await assert.equal(result, true, "Test FAILED. Wizard step#2: button Continue  not present ");

            });

        test.it('User is able to open Step3 by clicking button Continue ',
            async function () {
                await wizardStep2.clickButtonContinue();
                await wizardStep3.waitUntilDisplayedTitle(180);
                let result = await wizardStep3.getTitleText();
                result = (result === wizardStep3.title);
                return await assert.equal(result, true, "Test FAILED. User is not able to activate Step2 by clicking button Continue");
            });
    })
    describe('Step#3: ', async function () {

        test.it('Field Wallet address contains current metamask account address  ',
            async function () {
                let result = await wizardStep3.getValueFieldWalletAddress();
                result = (result === Owner.account.toString());
                return await assert.equal(result, true, "Test FAILED. Wallet address does not match the metamask account address ");
            });

        test.it('Checkbox gasprice \'Safe\'  by default ',
            async function () {
                const result = await wizardStep3.isSelectedCheckboxGasSafe()
                    && !await wizardStep3.isSelectedCheckboxGasNormal()
                    && !await wizardStep3.isSelectedCheckboxGasFast()
                    && !await wizardStep3.isSelectedCheckboxGasCustom()
                    && !await wizardStep3.isDisplayedFieldGasCustom()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Safe'  by default ");
            });

        test.it('User is able to set checkbox gasprice \'Normal\'',
            async function () {
                const result = await wizardStep3.clickCheckboxGasNormal()
                    && await wizardStep3.isSelectedCheckboxGasNormal()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Normal' isn\'t selected ");
            });

        test.it('User is able to set checkbox gasprice \'Safe\'',
            async function () {
                const result = await wizardStep3.clickCheckboxGasSafe()
                    && await wizardStep3.isSelectedCheckboxGasSafe()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Safe' isn\'t selected ");
            });

        test.it('Field \'Gas price custom\' isn\'t displayed if checkbox gasprice \'Custom\' isn\'t selected ',
            async function () {
                const result = await wizardStep3.isDisplayedFieldGasCustom()
                return await assert.equal(result, false, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
            });

        test.it('User is able to set checkbox gasprice \'Fast\'',
            async function () {
                const result = await wizardStep3.clickCheckboxGasFast()
                    && await wizardStep3.isSelectedCheckboxGasFast()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Fast' isn\'t selected ");
            });

        test.it('User is able to set "Custom Gasprice" checkbox',
            async function () {
                const result = await wizardStep3.clickCheckboxGasCustom()
                    && await wizardStep3.isSelectedCheckboxGasCustom()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
            });

        test.it('Field \'Gas price custom\' displayed if checkbox gasprice \'Custom\'is selected ',
            async function () {
                const result = await wizardStep3.isDisplayedFieldGasCustom()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
            });

        test.it('Field \'Gas price custom\' has correct placeholder ',
            async function () {
                const result = await wizardStep3.getValueFieldGasCustom()
                return await assert.equal(result, placeholder.gasCustom, "Wizard step#3: checkbox gasprice 'Custom' isn\'t selected ");
            });

        test.it('User is able to fill out the  CustomGasprice field with valid value',
            async function () {
                const result = await wizardStep3.fillGasPriceCustom(newValue.customGas);
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to fill "Custom Gasprice" with valid value');
            });
    })
    describe('Tier#1: ', async function () {
        test.it('Field \'Mincap\' has value 0 by default ',
            async function () {
                const result = await tierPage.getValueFieldMinCap();
                return await assert.equal(result, placeholder.mincap, "Tier#1: field 'Mincap' has incorrect value by default ");
            });
        test.it('Field \'Setup name\' has value 0 by default ',
            async function () {
                const result = await tierPage.getValueFieldSetupName();
                return await assert.equal(result, placeholder.setupNameTier1, "Tier#1: field 'Setup name' has incorrect value by default ");
            });

        test.it('Checkbox \'Allow Modify\' is off by default ',
            async function () {
                const result = await tierPage.isSelectedCheckboxAllowModifyOff()
                    && !await tierPage.isSelectedCheckboxAllowModifyOn();
                return await assert.equal(result, true, "Tier#1: checkbox 'Allow Modify' isn\'t OFF by default ");
            });
        test.it('Checkbox \'Enable Whitelist\' is no by default ',
            async function () {
                const result = await tierPage.isSelectedCheckboxWhitelistNo()
                    && !await tierPage.isSelectedCheckboxWhitelistYes();
                return await assert.equal(result, true, "Tier#1: checkbox 'Enable Whitelist' isn\'t NO by default ");
            });

        test.it('User is able to set checkbox  \'Allow Modify on\'',
            async function () {
                const result = await tierPage.clickCheckboxAllowModifyOn()
                    && await tierPage.isSelectedCheckboxAllowModifyOn()
                    && !await tierPage.isSelectedCheckboxAllowModifyOff()
                return await assert.equal(result, true, "Wizard step#3: checkbox gasprice 'Allow Modify on' isn\'t selected ");
            });

        test.it('Whitelist container isn\'t present if checkbox "Whitelist enabled" is no',
            async function () {
                const result = await tierPage.isDisplayedWhitelistContainer();
                return await assert.equal(result, false, 'Test FAILED. Wizard step#3: User is NOT able to set checkbox  "Whitelist enabled"');
            });
        test.it('Whitelist container present if checkbox "Whitelist enabled" is selected',
            async function () {
                const result = await tierPage.clickCheckboxWhitelistYes()
                    && await tierPage.isDisplayedWhitelistContainer();
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to set checkbox  "Whitelist enabled"');
            });

        test.it('Field minCap disabled if whitelist enabled ',
            async function () {
                const tierNumber = 1;
                const result = await tierPage.isDisabledFieldMinCap(tierNumber);
                return await assert.equal(result, true, "Test FAILED. Field minCap disabled if whitelist enabled");
            });
        test.it('User is able to fill out field "Setup name" with valid data',
            async function () {
                tierPage.tier.name = newValue.setupNameTier1;
                let result = await tierPage.fillSetupName();

                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
            });
        test.it('User is able to fill out field "Supply" with valid data',
            async function () {
                tierPage.tier.supply = 69;
                let result = await tierPage.fillSupply();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
            });

        test.it('User is able to download CSV file with whitelisted addresses',
            async function () {
                const fileName = "./public/whitelistAddressesTestValidation.csv";
                const result = await tierPage.uploadWhitelistCSVFile(fileName)
                    && await tierPage.waitUntilShowUpPopupConfirm(180)
                    && await wizardStep3.clickButtonOk();
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
            });

        test.it('Field Supply disabled if whitelist added ',
            async function () {
                const result = await tierPage.isDisabledFieldSupply();
                return await assert.equal(result, true, "Test FAILED. Field minCap disabled if whitelist enabled");
            });

        test.it('Number of added whitelisted addresses is correct, data is valid',
            async function () {
                const shouldBe = 5;
                const inReality = await tierPage.amountAddedWhitelist();
                return await assert.equal(shouldBe, inReality, "Test FAILED. Wizard step#3: Number of added whitelisted addresses is NOT correct");
            });

        test.it('User is able to bulk delete all whitelisted addresses ',
            async function () {
                const result = await tierPage.clickButtonClearAll()
                    && await tierPage.waitUntilShowUpPopupConfirm(180)
                    && await tierPage.clickButtonYesAlert();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
            });

        test.it('All whitelisted addresses are removed after deletion ',
            async function () {
                const result = await tierPage.amountAddedWhitelist(10);
                return await assert.equal(result, 0, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
            });

        test.it('Field Supply enabled if whitelist was deleted ',
            async function () {
                const result = await tierPage.isDisabledFieldSupply();
                return await assert.equal(result, false, "Test FAILED. Field minCap disabled if whitelist enabled");
            });

        test.it('User is able to fill out field "Supply" with valid data',
            async function () {
                tierPage.tier.supply = newValue.supplyTier1;
                const result = await tierPage.fillSupply();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
            });

        test.it('User is able to download CSV file with more than 50 whitelisted addresses',
            async function () {
                const fileName = "./public/whitelistedAddresses61.csv";
                const result = await tierPage.uploadWhitelistCSVFile(fileName);
                return await assert.equal(result, true, 'Test FAILED. Wizard step#3: User is NOT able to download CVS file with whitelisted addresses');
            });

        test.it('Alert present if number of whitelisted addresses greater 50 ',
            async function () {
                const result = await tierPage.waitUntilShowUpPopupConfirm(100)
                    && await wizardStep3.clickButtonOk();
                return await assert.equal(result, true, "Test FAILED.ClearAll button is NOT present");
            });

        test.it('Number of added whitelisted addresses is correct, data is valid',
            async function () {
                const shouldBe = 50;
                const inReality = await tierPage.amountAddedWhitelist();
                return await assert.equal(shouldBe, inReality, "Test FAILED. Wizard step#3: Number of added whitelisted addresses is NOT correct");

            });

        test.it('User is able to bulk delete all whitelisted addresses ',
            async function () {
                const result = await tierPage.clickButtonClearAll()
                    && await tierPage.waitUntilShowUpPopupConfirm(180)
                    && await tierPage.clickButtonYesAlert();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to bulk delete all whitelisted addresses");
            });

        test.it('User is able to add several whitelisted addresses one by one ',
            async function () {
                const result = await tierPage.fillWhitelist();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to add several whitelisted addresses");
            });

        test.it('User is able to remove one whitelisted address',
            async function () {
                const beforeRemoving = await tierPage.amountAddedWhitelist();
                const numberAddressForRemove = 1;
                await tierPage.removeWhiteList(numberAddressForRemove - 1);
                const afterRemoving = await tierPage.amountAddedWhitelist();
                return await assert.equal(beforeRemoving, afterRemoving + 1, "Test FAILED. Wizard step#3: User is NOT able to remove one whitelisted address");
            });


        test.it('User is able to fill out field "Rate" with valid data',
            async function () {
                tierPage.number = 0;
                tierPage.tier.rate = newValue.rateTier1;
                const result = await tierPage.fillRate();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to fill out field 'Rate' with valid data");
            });
    })
    describe('Tier#2:', async function () {
        test.it('User is able to add tier',
            async function () {
                const result = await wizardStep3.clickButtonAddTier();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: Wizard step#3: User is able to add tier");
            });

        test.it('User is able to fill out field "Rate" with valid data',
            async function () {
                tierPage.number = 1;
                tierPage.tier.rate = newValue.rateTier1;
                let result = await tierPage.fillRate();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is NOT able to fill out field 'Rate' with valid data");
            });

        test.it('User is able to fill out field "Supply" with valid data',
            async function () {
                tierPage.tier.supply = newValue.supplyTier1;
                let result = await tierPage.fillSupply();
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
            });
        test.it('User is able to fill out field "minCap" with valid data',
            async function () {
                tierPage.tier.minCap = newValue.mincapTier2;
                let tierNumber = 2;
                let result = await tierPage.fillMinCap(tierNumber,);
                return await assert.equal(result, true, "Test FAILED. Wizard step#3: User is able to fill out field 'Supply' with valid data");
            });

        test.it('Go back - page keep state  ',
            async function () {
                const result = await wizardStep3.goBack()
                    && await wizardStep2.waitUntilDisplayedFieldName()
                    && await Utils.delay(5000)
                    && await wizardStep3.goForward()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                await assert.equal(result, true, "Test FAILED.Page crashed after go back/forward");
                await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox \'Custom\' lost state after refresh");
                await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field \'Gas Custom\' lost value after refresh");
                await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field \'Gas Custom\' lost value after refresh");
                tierPage.number = 0
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOff(), false, "Checkbox \'Allow modify off\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOn(), true, "Checkbox \'Allow modify on\' lost state after refresh");

                await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Checkbox \'Enable whitelist\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Checkbox \'Enable whitelist\' lost state after refresh");

                await assert.equal(await tierPage.getValueFieldSetupName(), newValue.setupNameTier1, "field \'Setup name\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldRate(), newValue.rateTier1, "field \'Rate\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldSupply(), newValue.supplyTier1, "field \'Supply\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldMinCap(), 0, "field \'Mincap\' lost value after refresh");
                await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "field 'Mincap' became enabled after refresh");
                tierPage.number = 1;
                await assert.equal(await tierPage.getValueFieldMinCap(), newValue.mincapTier2, "field \'Mincap\' lost value after refresh");

            });

        test.it('Refresh - page keep state of checkbox \'Whitelist with mincap\' ',
            async function () {
                const result = await wizardStep3.refresh()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                await assert.equal(result, true, "Test FAILED.Page crashed after refreshing");
                await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox \'Custom\' lost state after refresh");
                await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field \'Gas Custom\' lost value after refresh");
                await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field \'Gas Custom\' lost value after refresh");
                tierPage.number = 0
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOff(), false, "Checkbox \'Allow modify off\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOn(), true, "Checkbox \'Allow modify on\' lost state after refresh");

                await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Checkbox \'Enable whitelist\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Checkbox \'Enable whitelist\' lost state after refresh");

                await assert.equal(await tierPage.getValueFieldSetupName(), newValue.setupNameTier1, "field \'Setup name\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldRate(), newValue.rateTier1, "field \'Rate\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldSupply(), newValue.supplyTier1, "field \'Supply\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldMinCap(), 0, "field \'Mincap\' lost value after refresh");
                await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "field 'Mincap' became enabled after refresh");
                tierPage.number = 1;
                await assert.equal(await tierPage.getValueFieldMinCap(), newValue.mincapTier2, "field \'Mincap\' lost value after refresh");

            });

        test.it('Change network - page keep state of checkbox \'Whitelist with mincap\' ',
            async function () {
                const result = await Investor1.setWalletAccount()
                    && await wizardStep1.waitUntilLoaderGone()
                    && await Owner.setWalletAccount()
                    && await wizardStep3.waitUntilDisplayedFieldWalletAddress()
                await assert.equal(result, true, "Test FAILED.Page crashed after switch account");
                await assert.equal(await wizardStep3.isSelectedCheckboxGasCustom(), true, "Checkbox \'Custom\' lost state after refresh");
                await assert.equal(await wizardStep3.getValueFieldGasCustom(), newValue.customGas, "field \'Gas Custom\' lost value after refresh");
                await assert.equal(await wizardStep3.getValueFieldWalletAddress(), Owner.account, "field \'Gas Custom\' lost value after refresh");
                tierPage.number = 0
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOff(), false, "Checkbox \'Allow modify off\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxAllowModifyOn(), true, "Checkbox \'Allow modify on\' lost state after refresh");

                await assert.equal(await tierPage.isSelectedCheckboxWhitelistYes(), true, "Checkbox \'Enable whitelist\' lost state after refresh");
                await assert.equal(await tierPage.isSelectedCheckboxWhitelistNo(), false, "Checkbox \'Enable whitelist\' lost state after refresh");

                await assert.equal(await tierPage.getValueFieldSetupName(), newValue.setupNameTier1, "field \'Setup name\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldRate(), newValue.rateTier1, "field \'Rate\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldSupply(), newValue.supplyTier1, "field \'Supply\' lost value after refresh");
                await assert.equal(await tierPage.getValueFieldMinCap(), 0, "field \'Mincap\' lost value after refresh");
                await assert.equal(await tierPage.isDisabledFieldMinCap(), true, "field 'Mincap' became enabled after refresh");
                tierPage.number = 1;
                await assert.equal(await tierPage.getValueFieldMinCap(), newValue.mincapTier2, "field \'Mincap\' lost value after refresh");
            });


        test.it('User is able to proceed to Step4 by clicking button Continue ',
            async function () {
                await wizardStep3.clickButtonContinue();
                let result = await wizardStep4.waitUntilDisplayedModal(60);
                return await assert.equal(result, true, "Test FAILED. User is not able to activate Step2 by clicking button Continue");
            });
    })
    describe('Step#4:', async function () {

        test.it('Modal is displayed ',
            async function () {
                let result = await wizardStep4.waitUntilDisplayedModal()
                    && await wizardStep4.isDisplayedModal();
                return await assert.equal(result, true, "Modal is not displayed");
            });

        test.it('Check status of transaction, should be \'please confirm\'',
            async function () {
                const result = await wizardStep4.getTxStatus()
                return await assert.equal(result.includes('please confirm'), true, 'tx status is incorrect');
            });

        test.it('Alert present if user reload the page ',
            async function () {
                await wizardStep4.refresh();
                await driver.sleep(2000);
                const result = await wizardStep4.isPresentAlert();
                return await assert.equal(result, true, "Test FAILED.  Alert does not present if user refresh the page");
            });

        test.it('Warning after accepting alert ',
            async function () {
                const result = await wizardStep4.acceptAlert()
                    && await wizardStep4.waitUntilShowUpWarning(80);
                return await assert.equal(result, true, "Alert isn\'t displayed");
            });

        test.it('Check warning\'s text ',
            async function () {
                const result = await wizardStep4.getTextWarning()
                const shouldBe = 'Please cancel pending transaction, if there\'s any, in your wallet (Nifty Wallet or Metamask) and Continue'
                return await assert.equal(result, shouldBe, "Alert isn\'t displayed");
            });

        test.it('Modal is displayed after confirm warning ',
            async function () {
                const result = await wizardStep4.clickButtonOk()
                    && await wizardStep4.waitUntilDisplayedModal(80);
                return await assert.equal(result, true, "Modal isn\'t displayed");
            });

        test.it('Check status of transaction, should be \'please confirm\'',
            async function () {
                const result = await wizardStep4.getTxStatus()
                return await assert.equal(result.includes('please confirm'), true, 'tx status is incorrect');
            });

        test.it('Button \'Skip transaction\' is displayed if user reject a transaction ',
            async function () {
                const result = await wallet.rejectTransaction(20)
                    && await wizardStep4.isDisplayedButtonSkipTransaction();
                return await assert.equal(result, true, "button'Skip transaction' does not present if user reject the transaction");
            });

        test.it('Button \'Retry transaction\' is displayed if user reject a transaction ',
            async function () {
                const result = await wizardStep4.isDisplayedButtonRetryTransaction()
                return await assert.equal(result, true, "button'Retry transaction' does not present if user reject the transaction");
            });

        test.it('User is able to retry transaction ',
            async function () {
                const result = await wizardStep4.clickButtonRetryTransaction()
                    && !await wizardStep4.isDisplayedButtonRetryTransaction()
                    && !await wizardStep4.isDisplayedButtonSkipTransaction()
                return await assert.equal(result, true, "user is not able to retry transaction");
            });

        test.it('user able to confirm transaction',
            async function () {
                const result = await Utils.delay(5000)
                    && await wallet.signTransaction(20)
                    && await wizardStep4.isDisplayedModal()
                return await assert.equal(result, true, 'user is not able to confirm transaction');
            });

        test.it('warning if user skip transaction ',
            async function () {
                await wizardStep4.refresh();
                await driver.sleep(2000);
                const result = await wizardStep4.isPresentAlert()
                    && await wizardStep4.acceptAlert()
                    && await wizardStep4.waitUntilShowUpWarning(80)
                    && await wizardStep4.clickButtonOk()
                    && await Utils.delay(5000)
                    && await wallet.rejectTransaction(20)
                   // && await wizardStep4.waitUntilLoaderGone(20)
                    && await wizardStep4.clickButtonSkipTransaction()
                    && await wizardStep4.waitUntilShowUpWarning(80)
                return await assert.equal(result, true, "button \'Skip transaction\' isn\'t clickable");
            });

        test.it('confirm warning ',
            async function () {
                const result = await wizardStep4.clickButtonOk()
                    && await wizardStep4.waitUntilDisplayedModal(80);
                return await assert.equal(result, true, 'can not confirm warning');
            });

        test.it('Button \'Retry transaction\' is not  displayed if user skipped a transaction ',
            async function () {
                const result =  await wizardStep4.isDisplayedButtonRetryTransaction()
                return await assert.equal(result, false, "button'Retry transaction' is displayed if user skip the transaction");
            });


        test.it('Alert is presented if user wants to leave the wizard ',
            async function () {
                const result = await welcomePage.openWithAlertConfirmation();
                return await assert.equal(result, false, "Test FAILED. Alert does not present if user wants to leave the site");
            });

        test.it('User is able to stop deployment ',
            async function () {

                let result = await wizardStep4.waitUntilShowUpButtonCancelDeployment(80)
                    && await wizardStep4.clickButtonCancelDeployment()
                    && await wizardStep4.waitUntilShowUpPopupConfirm(80)
                    && await wizardStep4.clickButtonYes();

                return await assert.equal(result, true, "Test FAILED. Button 'Cancel' does not present");
            });
    })

    describe('Create crowdsale', async function () {
        test.it('User is able to create crowdsale(scenarioMintedSimple.json),minCap,1 tier',
            async function () {
                let owner = Owner;
                assert.equal(await owner.setWalletAccount(), true, "Can not set Metamask account");
                let result = await owner.createMintedCappedCrowdsale({
                    crowdsale: crowdsaleMintedSimple,
                    stop: { publish: true }
                });
                return await assert.equal(result, true, 'Test FAILED. Crowdsale has not created ');
            });
    })
    describe('Publish page', async function () {
        describe('Common data', async function () {
            test.it('Name is correct',
                async function () {
                    await driver.sleep(10000)
                    const result = await publishPage.getName()
                    return await assert.equal(crowdsaleMintedSimple.name, result, 'Publish page: name is incorrect ');
                });

            test.it('Ticker is correct',
                async function () {
                    const result = await publishPage.getTicker()
                    return await assert.equal(crowdsaleMintedSimple.ticker, result, 'Publish page: ticker is incorrect ');
                });

            test.it('Decimals is correct',
                async function () {
                    const result = await publishPage.getDecimals()
                    return await assert.equal(crowdsaleMintedSimple.decimals, result, 'Publish page: decimals is incorrect ');
                });

            test.it('Supply is correct',
                async function () {
                    const result = await publishPage.getSupply()
                    return await assert.equal(result, '0', 'Publish page: wallet address is incorrect ');
                });

            test.it('Wallet address is correct',
                async function () {
                    const result = await publishPage.getWalletAddress()
                    return await assert.equal(crowdsaleMintedSimple.walletAddress, result, 'Publish page: wallet address is incorrect ');
                });

            test.it('Crowdsale start time/date is correct',
                async function () {
                    const startTimePage = await publishPage.getCrowdsaleStartTime()
                    const startDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].startDate
                    const startTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].startTime
                    const startTimeShouldBe = await Utils.getUTCPublishFormat(startDate + ' ' + startTime)
                    await assert.equal(startTimeShouldBe, startTimePage, 'Publish page: time/date is incorrect ');
                });

            test.it('Crowdsale end time/date is correct',
                async function () {
                    const endTimePage = await publishPage.getCrowdsaleEndTime()
                    const endTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].endTime
                    const endDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].endDate
                    const endTimeShouldBe = await Utils.getUTCPublishFormat(endDate + ' ' + endTime)
                    await assert.equal(endTimeShouldBe, endTimePage, 'Publish page: time/date is incorrect ');
                });

            test.it('Wallet address is correct',
                async function () {
                    const result = await publishPage.getWalletAddress()
                    return await assert.equal(crowdsaleMintedSimple.walletAddress, result, 'Publish page: wallet address is incorrect ');
                });


            test.it('Publish page : compiler version is correct',
                async function () {
                    const result = await publishPage.getCompilerVersion()
                    return await assert.equal(result.includes('0.4.'), true, 'Publish page: compiler version is incorrect ');
                });

            test.it('Publish page : contract name is correct',
                async function () {
                    const result = await publishPage.getContractName()
                    return await assert.equal(result, 'MintedCappedProxy', 'Publish page: contract name is incorrect ');
                });

            test.it('Publish page : optimized flag is correct',
                async function () {
                    const result = await publishPage.getOptimized()
                    return await assert.equal(result, 'Yes', 'Publish page: optimized flag name is incorrect ');
                });

            test.it.skip('Publish page: contract source code is displayed and correct ',
                async function () {
                    const contract = await publishPage.getTextContract()
                    crowdsaleMintedSimple.sort = 'minted'
                    const shouldBe = await Utils.getContractSourceCode(crowdsaleMintedSimple)
                    return await assert.equal(contract, shouldBe, 'Publish page:contract source code isn\'t correct ');
                });

            test.it('Publish page: encoded ABI is displayed and correct ',
                async function () {
                    const abi = await publishPage.getEncodedABI()
                    return await assert.equal(abi.length, 256, 'Publish page:encoded ABI isn\'t correct ');
                });
        })
        describe('Tier#1', async function () {
            test.it('Tier start time/date is correct',
                async function () {
                    const startTimePage = await publishPage.getTierStartTime(1)
                    const startTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].startTime
                    const startDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].startDate
                    const startTimeShouldBe = await Utils.getUTCPublishFormat(startDate + ' ' + startTime)
                    await assert.equal(startTimePage, startTimeShouldBe, 'Publish page: time/date is incorrect ');
                });

            test.it('Tier end time/date is correct',
                async function () {
                    const endTimePage = await publishPage.getTierEndTime(1)
                    const endDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].endDate
                    const endTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[0].endTime
                    const endTimeShouldBe = await Utils.getUTCPublishFormat(endDate + ' ' + endTime)
                    await assert.equal(endTimePage, endTimeShouldBe, 'Publish page: time/date is incorrect ');
                });

            test.it('Rate is correct',
                async function () {
                    const result = await publishPage.getRate(1)
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].rate, result, 'Publish page: rate is incorrect ');
                });
            test.it('Allow modifying is correct',
                async function () {
                    const result = (await publishPage.getAllowModifying(1)) === 'on'
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].allowModify, result, 'Publish page: allow modify is incorrect ');
                });
            test.it('Maxcap is correct',
                async function () {
                    const result = await publishPage.getMaxcap(1)
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].supply, result, 'Publish page: maxcap is incorrect ');
                });
            test.it('Whitelisting is correct',
                async function () {
                    const result = (await publishPage.getWhitelisting(1)) === 'yes'
                    return await assert.equal(crowdsaleMintedSimple.tiers[0].isWhitelisted, result, 'Publish page: whitelisting is incorrect ');
                });
            test.it('Mincap is correct',
                async function () {
                    const result = await publishPage.getMincap(1)
                    return await assert.equal('0', result, 'Publish page: mincap is incorrect ');
                });
        })
        describe('Tier#2', async function () {
            test.it('Tier start time/date is correct',
                async function () {
                    const startTimePage = await publishPage.getTierStartTime(2)
                    const startTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].startTime
                    const startDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].startDate
                    const startTimeShouldBe = await Utils.getUTCPublishFormat(startDate + ' ' + startTime)
                    await assert.equal(startTimeShouldBe, startTimePage, 'Publish page: time/date is incorrect ');
                });

            test.it('Tier end time/date is correct',
                async function () {
                    const endTimePage = await publishPage.getTierEndTime(2)
                    const endDate = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].endDate
                    const endTime = await JSON.parse(fs.readFileSync(scenarioSimple, "utf8")).tiers[1].endTime
                    const endTimeShouldBe = await Utils.getUTCPublishFormat(endDate + ' ' + endTime)
                    await assert.equal(endTimePage, endTimeShouldBe, 'Publish page: time/date is incorrect ');
                });
            test.it('Rate is correct',
                async function () {
                    const result = await publishPage.getRate(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].rate, result, 'Publish page: rate is incorrect ');
                });
            test.it('Allow modifying is correct',
                async function () {
                    const result = (await publishPage.getAllowModifying(2)) === 'off'
                    return await assert.equal(result, true, 'Publish page: allow modify is incorrect ');
                });
            test.it('Maxcap is correct',
                async function () {
                    const result = await publishPage.getMaxcap(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].supply, result, 'Publish page: maxcap is incorrect ');
                });
            test.it('Whitelisting is correct',
                async function () {
                    const result = (await publishPage.getWhitelisting(2)) === 'no'
                    return await assert.equal(result, true, 'Publish page: whitelisting is incorrect ');
                });
            test.it('Mincap is correct',
                async function () {
                    const result = await publishPage.getMincap(2)
                    return await assert.equal(crowdsaleMintedSimple.tiers[1].minCap, result, 'Publish page: mincap is incorrect ');
                });
        })
        describe('Check alert, buttons', async function () {
            test.it('Alert displayed after refresh ',
                async function () {
                    await publishPage.refresh()
                    await driver.sleep(2000);
                    let result = await publishPage.isPresentAlert();
                    return await assert.equal(result, true, "Test FAILED.  Alert does not present if user refresh the page");
                });
            test.it('Warning displayed after accepting alert ',
                async function () {
                    await publishPage.acceptAlert()
                    const result = await publishPage.waitUntilShowUpWarning()
                        && await publishPage.clickButtonOk()
                    return await assert.equal(result, true, "Test FAILED.  Warning does not present");
                });

            test.it('Button \'Download file\' is presented and clickable, notice appears ',
                async function () {
                    const result = !await publishPage.waitUntilShowUpWarning(15)
                    await publishPage.clickButtonDownload()
                    && await publishPage.waitUntilShowUpErrorNotice()
                    return await assert.equal(result, true, ' button \'Download file\' isn\'t present ');
                });
            test.it('Clicking button \'Continue\' opens Crowdsale page ',
                async function () {
                    const result = await publishPage.clickButtonContinue()
                        && await publishPage.waitUntilLoaderGone()
                        && await crowdsalePage.waitUntilShowUpTitle()
                    return await assert.equal(result, true, 'Crowdsale page hasn\'t opened ');
                });
        })

        describe('Crowdsale page:', async function () {

            test.it('Proxy address is correct ',
                async function () {
                    const result = await crowdsalePage.getProxyAddress()
                    return await assert.equal(result.length, 42, 'Proxy address is incorrect');
                });
            test.it('Raised funds is correct ',
                async function () {
                    const result = await crowdsalePage.getRaisedFunds()
                    return await assert.equal(result, '0 ETH', 'Raised funds is incorrect');
                });
            test.it('Goal funds is correct ',
                async function () {
                    const result = await crowdsalePage.getGoalFunds()
                    const goal = crowdsaleMintedSimple.tiers[0].supply / crowdsaleMintedSimple.tiers[0].rate + crowdsaleMintedSimple.tiers[1].supply / crowdsaleMintedSimple.tiers[1].rate
                    return await assert.equal(result.includes(goal.toString().slice(0, 15)), true, 'Goal funds is incorrect');
                });
            test.it('Tokens claimed is correct ',
                async function () {
                    const result = await crowdsalePage.getTokensClaimed()
                    return await assert.equal(result, '0', 'Tokens claimed is incorrect')
                });
            test.it('Contributors number is zero ',
                async function () {
                    const result = await crowdsalePage.getContributors()
                    return await assert.equal(result, '0', 'Contributors number is incorrect')
                });

            test.it('Rate is correct ',
                async function () {
                    const result = await crowdsalePage.getRate()
                    return await assert.equal(result, crowdsaleMintedSimple.tiers[0].rate, 'Rate is incorrect')
                });

            test.it('Total supply is correct ',
                async function () {
                    const result = await crowdsalePage.getTotalSupply()
                    const goal = crowdsaleMintedSimple.tiers[0].supply + crowdsaleMintedSimple.tiers[1].supply
                    return await assert.equal(result, goal, 'Total supply is incorrect')
                });

            test.it('Clicking button \'Continue\' opens Contribution page ',
                async function () {
                    const result = await crowdsalePage.clickButtonContribute()
                        && await crowdsalePage.waitUntilLoaderGone()
                        && await contributionPage.waitUntilShowUpCountdownTimer()
                    return await assert.equal(result, true, 'Contribution page hasn\'t opened ');
                });
        })

        describe('Contribution page:', async function () {
            test.it('Button \'Contribute\' disabled by default',
                async function () {
                    const result = await contributionPage.isDisabledButtonContribute()
                    return await assert.equal(result, true, 'Button  \'Contribute\' enabled by default');
                });

            test.it.skip('correct error message if contribution amount less than mincap',
                async function () {
                    const contribution = crowdsaleMintedSimple.tiers[0].minCap * 0.9;
                    const result = await contributionPage.waitUntilLoaderGone()
                        && await contributionPage.fillContribute(contribution)
                        && await contributionPage.clickButtonContribute()
                        && await contributionPage.waitUntilShowUpError(20)
                    await assert.equal(result, true, 'error isn\'t displayed');
                    const textShouldBe = 'Minimum valid contribution: ' + crowdsaleMintedSimple.tiers[0].minCap
                    const errorText = await contributionPage.getErrorText()
                    return await assert.equal(errorText, textShouldBe, 'incorrect error message');
                });

            test.it.skip('error message is dissappeared if contribution amount more than mincap',
                async function () {
                    const result = await contributionPage.clearContribute()
                        && await contributionPage.fillContribute(1000)
                        && await Utils.delay(20000)
                        && !await contributionPage.isDisplayedError()

                    await assert.equal(result, true, 'unexpected error message');
                    await contributionPage.clearContribute()
                });

            test.it('balance is zero by default',
                async function () {
                    const result = await contributionPage.getBalance()
                    const shouldBe = '0 ' + crowdsaleMintedSimple.ticker
                    return await assert.equal(result, shouldBe, 'incorrect balance');
                });

            test.it('current account is correct',
                async function () {
                    const result = await contributionPage.getCurrentAccount()
                    return await assert.equal(result, Owner.account, 'incorrect current account');
                });

            test.it('proxy address is valid',
                async function () {
                    const result = await contributionPage.getProxyAddress()
                    return await assert.equal(result.length, 42, 'incorrect proxy address ');
                });

            test.it('crowdsale\'s name is correct',
                async function () {
                    const result = await contributionPage.getName()
                    return await assert.equal(result, crowdsaleMintedSimple.name, 'incorrect crowdsale\'s name ');
                });

            test.it('ticker is correct',
                async function () {
                    const result = await contributionPage.getTicker()
                    return await assert.equal(result, crowdsaleMintedSimple.ticker, 'incorrect ticker');
                });
            test.it('total supply is correct',
                async function () {
                    const result = await contributionPage.getTotalSupply()
                    const supply = crowdsaleMintedSimple.tiers[0].supply + crowdsaleMintedSimple.tiers[1].supply + ' ' + crowdsaleMintedSimple.ticker
                    return await assert.equal(result, supply, 'incorrect total supply');
                });

            test.it.skip('min contribution is correct',
                async function () {
                    const result = await contributionPage.getMinContribution()
                    const shouldBe = crowdsaleMintedSimple.tiers[0].minCap
                    return await assert.equal(result, shouldBe, 'incorrect min contribution');
                });

            test.it('max contribution is correct',
                async function () {
                    const result = await contributionPage.getMaxContribution()
                    const shouldBe = 'You are not allowed'
                    return await assert.equal(result, shouldBe, 'incorrect max contribution');
                });

            test.it('Alert is displayed if user attempt contribute before start',
                async function () {
                    const contribution = crowdsaleMintedSimple.tiers[0].minCap + 10;
                    const result = await contributionPage.waitUntilLoaderGone()
                        && await contributionPage.fillContribute(contribution)
                        && await contributionPage.clickButtonContribute()
                        && await contributionPage.waitUntilShowUpWarning(20)
                    return await assert.equal(result, true, 'Alert isn\'t displayed');
                });
            test.it('Alert text is correct',
                async function () {
                    const textShouldBe = 'Wait, please. Crowdsale company hasn\'t started yet. It\'ll start from Thu May 09 2030 05:16:00'
                    const warningText = await contributionPage.getWarningText()
                    return await assert.equal(warningText.includes(textShouldBe), true, 'Alert\'s text is incorrect');
                });

            test.it('Should be alert if invalid crowdsale url in address bar',
                async function () {
                    crowdsaleMintedSimple.url = await contributionPage.getURL()
                    let wrongUrl = crowdsaleMintedSimple.url.substring(0, 50) + crowdsaleMintedSimple.url.substring(52, crowdsaleMintedSimple.length)
                    let result = await contributionPage.open(wrongUrl)
                        && await contributionPage.waitUntilShowUpButtonOk()
                        && await contributionPage.clickButtonOk()
                    return await assert.equal(result, true, 'Test FAILED. Contribution page: no alert if invalid proxyID in address bar');
                });
            test.it('Should be alert if invalid proxyID in address bar',
                async function () {
                    let owner = Owner;
                    crowdsaleMintedSimple.proxyAddress = await contributionPage.getProxyAddress()
                    let wrongCrowdsale = crowdsaleMintedSimple;
                    wrongCrowdsale.proxyAddress = crowdsaleMintedSimple.proxyAddress.substring(0, crowdsaleMintedSimple.proxyAddress.length - 5)
                    let result = await owner.openCrowdsalePage(wrongCrowdsale)
                        && await contributionPage.waitUntilShowUpButtonOk()
                        && await contributionPage.clickButtonOk()
                    return await assert.equal(result, true, 'Test FAILED. Crowdsale page: no alert if invalid proxyID in address bar');
                });
        })
    })
})
