const core = require("@actions/core");
const InsightAppSecClient = require("../api/InsightAppSecClient");
const ScanTools = require("../lib/ScanTools");
const testData = require("./testdata");

const client = new InsightAppSecClient("region", "apiKey");
const tools = new ScanTools(client, null, 1000);

describe("ScanTools tests", () => {

    it("async startScan test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "startScan");
        spy.mockImplementationOnce(() => Promise.resolve(testData.startScanResponse));
        const result = await tools.startScan("scanconfigid");
        expect(result).toEqual(testData.startScanOutput);
    });

    it("async pollForScanComplete test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "getScan");
        spy.mockImplementationOnce(() => testData.scanStatusRunning);
        spy.mockImplementationOnce(() => testData.scanStatusComplete);
        const logSpy = jest.spyOn(core, "info");
        await tools.pollForScanComplete("scanID");
        expect(logSpy).toHaveBeenCalledWith("Scan is currently in status RUNNING")
        expect(logSpy).toHaveBeenCalledWith("Scan is currently in status COMPLETE")
    });

    it("getScanResultsSummary test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "getScanVulnerabilities");
        spy.mockImplementationOnce(() => testData.scanVulnsPg1);
        spy.mockImplementationOnce(() => testData.scanVulnsPg2);
        const result = await tools.getScanResultsSummary("scanID", "vulnQuery", "scanconfigid");
        expect(result).toEqual([{ MEDIUM: 2, LOW: 8, INFORMATIONAL: 21, SAFE: 1 }, "www.example.com/123#/apps/myvalue/configuration/scanconfigid/scan/scanID"]);
    });

    it("hasTimeoutExceeded test", () => {
        const noTimeoutTools = new ScanTools(client, 10, 1000);
        const result = noTimeoutTools.hasScanTimeoutExceeded(new Date().getTime());
        expect(result).toEqual(false);

        // Falsy test
        const noTimeoutTools2 = new ScanTools(client, 0, 1000);
        const result2 = noTimeoutTools2.hasScanTimeoutExceeded(new Date().getTime());
        expect(result2).toEqual(false);

        // Force timeout
        const timeoutTools = new ScanTools(client, -1, 1000);
        const result3 = timeoutTools.hasScanTimeoutExceeded(new Date().getTime());
        expect(result3).toEqual(true);
    });

    it("Timeout cancels the scan", async () => {
        const spyGetScan = jest.spyOn(InsightAppSecClient.prototype, "getScan");
        spyGetScan.mockImplementationOnce(() => testData.scanStatusRunning);
        const spyCancel = jest.spyOn(InsightAppSecClient.prototype, "cancelScan");
        spyCancel.mockImplementationOnce(() => Promise.resolve({}));
        const timeoutTools = new ScanTools(client, -1, 1000);

        await timeoutTools.pollForScanComplete("scanID", new Date().getTime());
        expect(spyCancel).toHaveBeenCalledTimes(1);
    }); 
});