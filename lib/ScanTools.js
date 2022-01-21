const core = require("@actions/core");

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

module.exports = class ScanTools{
    constructor(client, pollInterval = 300000) {
        this.client = client;
        this.pollInterval = pollInterval;
    }

    async startScan(scanConfigId) {
        const response = await this.client.startScan(scanConfigId);

        if(response.status < 200 || response.status > 299) {
            core.error(`Unable to start Rapid7 InsightAppSec scan: ${response.status}, ${response.data}`);
            return null;
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

    async pollForScanComplete(scanId) {
        let status = null;

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
            
            await sleep(this.pollInterval); //eslint-disable-line
        } while(!COMPLETE_STATUS.includes(status) && !ERROR_STATUS.includes(status))

        if(ERROR_STATUS.includes(status)) {
            core.info(`The scan is in an error state ${status}. Check InsightAppSec for details.`);
        }
        else {
            core.info("Scan is complete");
        }
    }

    async getScanResultsSummary(scanId, vulnQuery) {
        let next = {};
        let resultSummary = {};

        do {
            let results = await this.client.getScanVulnerabilities(scanId, vulnQuery, next.href); // eslint-disable-line

            if(results.status < 200 || results.status > 299) {
                core.error(`Unable to get Rapid7 InsightAppSec scan results: ${results.status}, ${results.data}`);
                return null;
            }

            resultSummary = this.compileResults(resultSummary, results.data.data);
            next = getNext(results.data.links);
        } while(next);

        return resultSummary;
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
}