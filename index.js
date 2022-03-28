const core = require("@actions/core");
const InsightAppSecClient = require("./api/InsightAppSecClient");
const ScanTools = require("./lib/ScanTools");

const INPUT_REGION = "region";
const INPUT_API_KEY = "api-key";
const INPUT_SCAN_CONFIG_ID = "scan-config-id";
const INPUT_VULN_QUERY = "vuln-query";
const INPUT_WAIT_SCAN_COMPLETE = "wait-for-scan-complete";
const INPUT_SCAN_TIMEOUT_MINS = "scan-timeout-mins";
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
    
    core.info(`Scan gating query: ${vulnQuery}`);
    core.info(`Wait for scan complete: ${waitScanComplete}`);

    if(!isInputValid(INPUT_REGION, region) || 
       !isInputValid(INPUT_API_KEY, apiKey) || 
       !isInputValid(INPUT_SCAN_CONFIG_ID, scanConfigId)) 
    {
        return;
    }

    const scanTools = new ScanTools(new InsightAppSecClient(region, apiKey), scanTimeoutMins);

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