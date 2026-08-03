import axios from "axios";

const APPLICATION_JSON = "application/json";
const USER_AGENT_HEADER = "r7:insightappsec-github-actions/1.5.0";

class InsightAppSecClient {

    constructor(region, apiKey) {
        // region is spliced into the API host, so an unvalidated value (e.g. "evil.com/",
        // "attacker.com#", "us@evil.com") would redirect requests — and the x-api-key header —
        // to an attacker-chosen host (Mythos #193852, CWE-918). Restrict to real region codes.
        if (typeof region !== "string" || !/^[a-z]{2}[0-9]?$/.test(region)) {
            throw new Error(`Invalid region: ${region}`);
        }
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

export default InsightAppSecClient;
