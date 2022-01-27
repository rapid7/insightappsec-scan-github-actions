const core = require("@actions/core");
const InsightAppSecClient = require("./api/InsightAppSecClient");
const ScanTools = require("./lib/ScanTools");

const INPUT_REGION = "region";
const INPUT_API_KEY = "api-key";
const INPUT_SCAN_CONFIG_ID = "scan-config-id";
const INPUT_VULN_QUERY = "vuln-query";
const INPUT_WAIT_SCAN_COMPLETE = "wait-for-scan-complete";
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
    const vulnQuery = core.getInput(INPUT_VULN_QUERY);
    const waitScanComplete = core.getBooleanInput(INPUT_WAIT_SCAN_COMPLETE);

    core.info(`Scan gating query: ${vulnQuery}`);
    core.info(`Wait for scan complete: ${waitScanComplete}`);

    if(!isInputValid(INPUT_REGION, region) || 
       !isInputValid(INPUT_API_KEY, apiKey) || 
       !isInputValid(INPUT_SCAN_CONFIG_ID, scanConfigId)) 
    {
        return;
    }

    const scanTools = new ScanTools(new InsightAppSecClient(region, apiKey));

    try {
        const scanId = await scanTools.startScan(scanConfigId);
        if (!waitScanComplete) {
            core.setOutput(OUTPUT_SCAN_FINDINGS, `Scan ID: ${scanId}`);
        }
        else {
            core.info("Will check for scan status updates every 5 minutes.")
            await scanTools.pollForScanComplete(scanId);
            const result = await scanTools.getScanResultsSummary(scanId, vulnQuery);
            core.setOutput(OUTPUT_SCAN_FINDINGS, JSON.stringify({vulnerabilities: result}, null, 2));
            if (Object.keys(result).length != 0 && vulnQuery) {
                core.setFailed("Vulnerabilities were found in scan. Failing.");
            }
        }
    }
    catch(e) {
        core.error(`An error occurred with the scan: ${e}`);
    }
}

performAction()