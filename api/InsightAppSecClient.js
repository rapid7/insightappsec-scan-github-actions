import axios from "axios";

const APPLICATION_JSON = "application/json";
const USER_AGENT_HEADER = "r7:insightappsec-github-actions/1.5.0";

// Base URLs held as complete literals, deliberately NOT built by interpolating
// the region into a template string. region arrives from the consuming workflow's
// `with:` block, and interpolating it into the authority lets a value such as
// "attacker.example/" terminate the host early and redirect the request -- taking
// the x-api-key default header with it (Mythos #193852, CWE-918).
//
// Supporting a new region means adding a full literal URL here. Nothing else in
// the codebase should construct this host.
const REGION_BASE_URLS = Object.freeze({
    us: "https://us.api.insight.rapid7.com/ias/v1/",
    us2: "https://us2.api.insight.rapid7.com/ias/v1/",
    us3: "https://us3.api.insight.rapid7.com/ias/v1/",
    eu: "https://eu.api.insight.rapid7.com/ias/v1/",
    ca: "https://ca.api.insight.rapid7.com/ias/v1/",
    au: "https://au.api.insight.rapid7.com/ias/v1/",
    ap: "https://ap.api.insight.rapid7.com/ias/v1/"
});

export const VALID_REGIONS = Object.freeze(Object.keys(REGION_BASE_URLS));

// Case and surrounding whitespace only. Normalising cannot turn a rejected value
// into an accepted one, because the result still has to be an exact key match and
// no key contains a host-altering character. Applied because DNS is
// case-insensitive, so `region: "US"` worked before this validation existed and
// should keep working.
function normaliseRegion(region) {
    return typeof region === "string" ? region.trim().toLowerCase() : "";
}

// Exported so the region can be rejected before a client is constructed, and
// reported as a configuration error rather than a scan failure.
export function isValidRegion(region) {
    // hasOwnProperty rather than `in` or truthiness: otherwise inherited keys such
    // as "constructor" or "toString" would resolve against the object.
    return Object.prototype.hasOwnProperty.call(REGION_BASE_URLS, normaliseRegion(region));
}

class InsightAppSecClient {

    constructor(region, apiKey) {
        // region is spliced into the API host, so an unvalidated value (e.g. "evil.com/",
        // "attacker.com#", "us@evil.com") would redirect requests — and the x-api-key header —
        // to an attacker-chosen host (Mythos #193852, CWE-918). Restrict to real region codes.
        // Kept here as well as in index.js so the class is safe however it's called.
        if (!isValidRegion(region)) {
            throw new Error(`Invalid region: ${region}`);
        }

        this.baseUrl = REGION_BASE_URLS[normaliseRegion(region)];
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
