import { jest } from "@jest/globals";
import InsightAppSecClient, { isValidRegion, VALID_REGIONS } from "../api/InsightAppSecClient.js";
import * as testData from "./testdata.js";

const iasClient = new InsightAppSecClient("us", "test-api-key");

describe("InsightAppSecClient tests", () => {

    it("startScan posts to scans endpoint with scan config id", async () => {
        const spy = jest.spyOn(iasClient.axiosInst, "post");
        spy.mockImplementationOnce(() => Promise.resolve(testData.startScanResponse));
        const result = await iasClient.startScan("my-scan-config-id");
        expect(spy).toHaveBeenCalledWith("scans", {
            scan_config: { id: "my-scan-config-id" }
        });
        expect(result).toEqual(testData.startScanResponse);
    });

    it("getScan calls get with the scan id", async () => {
        const spy = jest.spyOn(iasClient.axiosInst, "get");
        spy.mockImplementationOnce(() => Promise.resolve(testData.getScanResponse));
        const result = await iasClient.getScan("scan-123");
        expect(spy).toHaveBeenCalledWith("scans/scan-123");
        expect(result).toEqual(testData.getScanResponse);
    });

    it("cancelScan puts cancel action to the scan", async () => {
        const spy = jest.spyOn(iasClient.axiosInst, "put");
        spy.mockImplementationOnce(() => Promise.resolve({ status: 200 }));
        await iasClient.cancelScan("scan-123");
        expect(spy).toHaveBeenCalledWith("scans/scan-123/action", { action: "CANCEL" });
    });

    it("getScanVulnerabilities posts search query with scan id and vuln query", async () => {
        const spy = jest.spyOn(iasClient.axiosInst, "post");
        spy.mockImplementationOnce(() => Promise.resolve(testData.scanVulnsPg1));
        const result = await iasClient.getScanVulnerabilities("scan-123", "vulnerability.severity = 'HIGH'", null);
        expect(spy).toHaveBeenCalledWith("search", {
            type: "VULNERABILITY",
            query: "vulnerability.scans.id='scan-123' && (vulnerability.severity = 'HIGH')"
        });
        expect(result).toEqual(testData.scanVulnsPg1);
    });

    it("getScanVulnerabilities uses nextLink when provided", async () => {
        const spy = jest.spyOn(iasClient.axiosInst, "post");
        spy.mockImplementationOnce(() => Promise.resolve(testData.scanVulnsPg2));
        const nextLink = "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=20";
        await iasClient.getScanVulnerabilities("scan-123", null, nextLink);
        expect(spy).toHaveBeenCalledWith(nextLink, {
            type: "VULNERABILITY",
            query: "vulnerability.scans.id='scan-123'"
        });
    });

    // Mythos #193852 (CWE-918): region selects the API host, so it must come from
    // a fixed allowlist rather than being spliced into the URL.
    it.each(["us", "us2", "us3", "eu", "ca", "au", "ap"])(
        "accepts valid region %s", (region) => {
            expect(() => new InsightAppSecClient(region, "k")).not.toThrow();
        });

    it("the allowlist is exactly the supported regions", () => {
        expect([...VALID_REGIONS]).toEqual(["us", "us2", "us3", "eu", "ca", "au", "ap"]);
    });

    it.each([...VALID_REGIONS])("resolves %s to its own rapid7.com host", (region) => {
        const url = new URL(new InsightAppSecClient(region, "k").baseUrl);
        expect(url.protocol).toEqual("https:");
        expect(url.host).toEqual(`${region}.api.insight.rapid7.com`);
    });

    // Object.freeze on a plain object still inherits Object.prototype, so a lookup
    // by truthiness would resolve these to functions rather than rejecting them.
    it.each(["constructor", "toString", "hasOwnProperty", "valueOf"])(
        "does not treat inherited property %p as a region", (key) => {
            expect(isValidRegion(key)).toBe(false);
            expect(() => new InsightAppSecClient(key, "k")).toThrow(/Invalid region/);
        });

    it.each([
        "evil.com/",
        "attacker.com#",
        "us.api.insight.rapid7.com@evil.com",
        "../",
        "us/../../x",
        "",
        "someregion",
        "us us",
        "us\nevil.com/",
        "us\revil.com/",
        "zz",
        "us4",
        null,
        undefined
    ])("rejects host-altering region %p", (region) => {
        expect(() => new InsightAppSecClient(region, "k")).toThrow(/Invalid region/);
    });

    // DNS is case-insensitive, so these resolved before the validation existed and
    // must keep working, but they still have to end up on a rapid7.com host.
    it.each(["US", "Eu", " us ", "US2"])("normalises valid region %p", (region) => {
        const client = new InsightAppSecClient(region, "k");
        expect(new URL(client.baseUrl).host).toEqual(`${region.trim().toLowerCase()}.api.insight.rapid7.com`);
    });

    it.each(["us", "eu", "us2"])("keeps the resolved host on rapid7.com for %p", (region) => {
        const url = new URL(new InsightAppSecClient(region, "k").baseUrl);
        expect(url.protocol).toEqual("https:");
        expect(url.host).toEqual(`${region}.api.insight.rapid7.com`);
    });
});
