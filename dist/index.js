/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 768:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const axios = __nccwpck_require__(96);

const APPLICATION_JSON = "application/json";
const USER_AGENT_HEADER = "r7:insightappsec-github-actions/1.3.0";

class InsightAppSecClient {

    constructor(region, apiKey) {
        this.baseUrl = `https://${region}.api.insight.rapid7.com/ias/v1/`;
        this.axiosInst = axios.create({
            baseURL: this.baseUrl,
            headers: {
                "Accept": APPLICATION_JSON,
                "x-api-key": apiKey,
                "User-Agent": USER_AGENT_HEADER
            },
            timeout: 60000
        });

        this.axiosInst.defaults.headers.post["Content-Type"] = APPLICATION_JSON;
    }

    startScan(scanConfigId) {        
        return this.axiosInst.post("scans", {
            scan_config: {
                id: scanConfigId
            }
        });
    }

    getScan(scanId) {
        return this.axiosInst.get(`scans/${scanId}`);
    }

    cancelScan(scanId){
        return this.axiosInst.put(`scans/${scanId}/action`, { 
            action: "CANCEL" 
        });
    }

    getScanVulnerabilities(scanId, vulnQuery, nextLink) {
        let query = `vulnerability.scans.id='${scanId}'`;
        if (vulnQuery){
            query = `${query} && (${vulnQuery})`;
        }
        
        return this.axiosInst.post(nextLink || "search", {
            type: "VULNERABILITY",
            query: query
        });
    }
}

module.exports = InsightAppSecClient;

/***/ }),

/***/ 442:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const core = __nccwpck_require__(297);

const COMPLETE_STATUS = ["COMPLETE"];
const ERROR_STATUS = ["FAILED"]

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

function getNext(links) {
    if(!links) {
        return null;
    }

    return links.find(link => link.rel === "next"); // returns undefined when not found
}

function setUiUrl(results, scanId, scanConfigId) {

    let insightUiUrl = "";
    let appId = "";
    let orgToken = "";

    if(!results.data.data || !results.data.data.length){
        core.debug("No results found");
        return;
    }

    if(!results.data.data[0].app.id){
        core.debug("App ID not found.");
        return;
    } 

    appId = results.data.data[0].app.id;

    if(!results.data.data[0].insight_ui_url){
        core.debug("insight_ui_url not found.");
        return;
    }

    insightUiUrl = results.data.data[0].insight_ui_url;

    if(!insightUiUrl){
        core.debug("insight_ui_url not found.");
        return;
    }

    insightUiUrl = insightUiUrl.split("#");
    orgToken = insightUiUrl[0];

    if(!orgToken){
        core.debug("Org Token not found.");
        return;
    }

    return `${orgToken}#/apps/${appId}/configuration/${scanConfigId}/scan/${scanId}`;
}

module.exports = class ScanTools{
    constructor(client, scanTimeoutMins = null, pollInterval = null) {
        this.client = client;
        this.scanTimeoutMins = scanTimeoutMins;
        this.pollInterval = pollInterval || 5;
    }

    async startScan(scanConfigId) {
        const response = await this.client.startScan(scanConfigId);

        if(response.status < 200 || response.status > 299) {
            core.error(`Unable to start Rapid7 InsightAppSec scan: ${response.status}, ${response.data}`);
            throw Error("Unable to get Rapid7 InsightAppSec scan.");
        }

        let scanId = null;
        if(response.headers.location) {
            scanId = response.headers.location.split("/").pop();
        }

        if(!scanId) {
            core.error(`Scan UUID was not returned in the InsightAppSec response`);  
        }

        core.info(`Scan started, UUID ${scanId}`);  
        return scanId;
    }

    hasScanTimeoutExceeded(startTime) {
        if(!startTime || !this.scanTimeoutMins) {
            return false;
        }

        const now = new Date();
        const check = new Date(startTime + (this.scanTimeoutMins * 60000));
        core.debug(`Timeout check Now: ${now}, Max: ${check}`);
        
        if(now >= check) {
            core.error("Scan duration has exceeded the configured timeout value.");
            return true;
        }

        return false;
    }

    async pollForScanComplete(scanId, startTime = null) {
        let status = null;
        let isTimeout = false;

        do {
            let scan = await this.client.getScan(scanId); //eslint-disable-line

            if(scan.status < 200 || scan.status > 299 || !scan.data) {
                core.error(`Unable to get Rapid7 InsightAppSec scan: ${scan.status}, ${scan.data}`);
                throw Error(`Unable to get Rapid7 InsightAppSec scan: ${scan.status}, ${scan.data}`);
            }
    
            status = scan.data.status;
            
            core.info(`Scan is currently in status ${status}`);
            if (COMPLETE_STATUS.includes(status) || ERROR_STATUS.includes(status)){
                break;
            }

            isTimeout = this.hasScanTimeoutExceeded(startTime);
            if(isTimeout) {
                break;
            }

            await sleep(this.pollInterval * 60000); //eslint-disable-line
        } while(!COMPLETE_STATUS.includes(status) && !ERROR_STATUS.includes(status) || !isTimeout)

        this.postScanActions(scanId, status, isTimeout);

        return COMPLETE_STATUS.includes(status);
    }

    async getScanResultsSummary(scanId, vulnQuery, scanConfigId) {
        let next = {};
        let resultSummary = {};
        let uiUrl = "";

        do {
            let results = await this.client.getScanVulnerabilities(scanId, vulnQuery, next.href); // eslint-disable-line

            if(results.status < 200 || results.status > 299) {
                core.error(`Unable to get Rapid7 InsightAppSec scan results: ${results.status}, ${results.data}`);
                return null;
            }

            if(!uiUrl){
                try{
                    uiUrl = setUiUrl(results, scanId, scanConfigId);
                }
                catch(e) {
                    core.error(`Error retrieving Insight UI URL: ${e}`);
                }
            }

            resultSummary = this.compileResults(resultSummary, results.data.data);
            next = getNext(results.data.links);
        } while(next);

        return {vulnerabilities: resultSummary, scanLink: uiUrl};
    }

    compileResults(total = {}, currentPage) {
        const result = currentPage.reduce( (accumulator, vuln) => {
            if(accumulator[vuln.severity]) {
                accumulator[vuln.severity] += 1;
            }
            else {
                Object.assign(total, {[vuln.severity]: 1});
            }

            return accumulator;
        }, total)

        return result;
    }

    postScanActions(scanId, status, isTimeout) {
        if(ERROR_STATUS.includes(status)) {
            core.info(`The scan is in an error state ${status}. Check InsightAppSec for details.`);
        }
        else if (isTimeout) {
            core.info(`The scan duration has exceeded the maximum configured duration of ${this.scanTimeoutMins}. The scan will be cancelled.`);
    
            this.client.cancelScan(scanId).catch( (error) => {
                core.error(`Error canceling timed out scan: ${error}`);
            });
        }
        else {
            core.info("Scan is complete");
        }
    }
}

/***/ }),

/***/ 297:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 96:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(297);
const InsightAppSecClient = __nccwpck_require__(768);
const ScanTools = __nccwpck_require__(442);

const INPUT_REGION = "region";
const INPUT_API_KEY = "api-key";
const INPUT_SCAN_CONFIG_ID = "scan-config-id";
const INPUT_VULN_QUERY = "vuln-query";
const INPUT_WAIT_SCAN_COMPLETE = "wait-for-scan-complete";
const INPUT_SCAN_TIMEOUT_MINS = "scan-timeout-mins";
const INPUT_POLL_INTERVAL_MINS = "poll-interval-mins";
const OUTPUT_SCAN_FINDINGS = "scan-findings";

function isInputValid(key, value) {
    if(!value) {
        core.setFailed(`${key} is a required input but has not been provided`);
        return false;
    }

    return true;
}

async function performAction() {
    const region = core.getInput(INPUT_REGION);
    const apiKey = core.getInput(INPUT_API_KEY);
    const scanConfigId = core.getInput(INPUT_SCAN_CONFIG_ID);
    const vulnQuery = core.getInput(INPUT_VULN_QUERY) || null;
    const waitScanComplete = core.getBooleanInput(INPUT_WAIT_SCAN_COMPLETE);
    let scanTimeoutMins = core.getInput(INPUT_SCAN_TIMEOUT_MINS) || null;
    let pollIntervalMins = core.getInput(INPUT_POLL_INTERVAL_MINS) || null;

    if(scanTimeoutMins) {
        try{
            scanTimeoutMins = parseInt(scanTimeoutMins);
            if(isNaN(scanTimeoutMins)) {
                throw Error("Scan timeout is NaN");
            }

            core.info(`Scan timeout: ${scanTimeoutMins} minutes`);
        }
        catch(e) {
            core.setFailed("Scan timeout should be an integer");
            return;
        }
    }

    if(pollIntervalMins) {
        try{
            pollIntervalMins = parseInt(pollIntervalMins);
            if(isNaN(pollIntervalMins)) {
                throw Error("Poll interval is NaN");
            }

            core.info(`Poll interval: ${pollIntervalMins} mins`);
        }
        catch(e) {
            core.setFailed("Poll interval should be an integer");
            return;
        }
    }    
    
    core.info(`Scan gating query: ${vulnQuery}`);
    core.info(`Wait for scan complete: ${waitScanComplete}`);

    if(!isInputValid(INPUT_REGION, region) || 
       !isInputValid(INPUT_API_KEY, apiKey) || 
       !isInputValid(INPUT_SCAN_CONFIG_ID, scanConfigId)) 
    {
        return;
    }

    const scanTools = new ScanTools(new InsightAppSecClient(region, apiKey), scanTimeoutMins, pollIntervalMins);

    try {
        const scanId = await scanTools.startScan(scanConfigId);
        if (!waitScanComplete) {
            core.setOutput(OUTPUT_SCAN_FINDINGS, `Scan ID: ${scanId}`);
        }
        else {
            const startTimeMillis = new Date().getTime();
            core.info("Will check for scan status updates every 5 minutes.")
            const success = await scanTools.pollForScanComplete(scanId, startTimeMillis, scanTimeoutMins);

            if(success) {
                const result = await scanTools.getScanResultsSummary(scanId, vulnQuery, scanConfigId);
                core.setOutput(OUTPUT_SCAN_FINDINGS, JSON.stringify(result, null, 2));
                if (Object.keys(result.vulnerabilities).length != 0 && vulnQuery) {
                    core.setFailed("Vulnerabilities were found in scan. Failing.");
                }
            }
            else{
                core.setFailed("Scan did not successfully complete in the required time.");
            }
        }
    }
    catch(e) {
        core.error(`An error occurred with the scan: ${e}`);
    }
}

performAction().catch( (error) => {
    core.error(`An error occurred during the action ${error}`);
});
})();

module.exports = __webpack_exports__;
/******/ })()
;