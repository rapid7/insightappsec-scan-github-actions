import { jest } from "@jest/globals";
import InsightAppSecClient from "../api/InsightAppSecClient.js";
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
});
