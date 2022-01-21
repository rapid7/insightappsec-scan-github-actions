const core = require("@actions/core");
const InsightAppSecClient = require("../api/InsightAppSecClient");
const ScanTools = require("../lib/ScanTools");
const testData = require("./testdata");

const client = new InsightAppSecClient("region", "apiKey");
const tools = new ScanTools(client, 4000);

describe("ScanTools tests", () => {

    it("async startScan test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "startScan");
        spy.mockImplementationOnce(() => Promise.resolve(testData.startScanResponse));
        const result = await tools.startScan('scanconfigid');
        expect(result).toEqual(testData.startScanOutput);
    });

    it("async pollForScanComplete test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "getScan");
        spy.mockImplementationOnce(() => testData.scanStatusRunning);
        spy.mockImplementationOnce(() => testData.scanStatusComplete);
        const logSpy = jest.spyOn(core, 'info');
        await tools.pollForScanComplete('scanID');
        expect(logSpy).toHaveBeenCalledWith('Scan is currently in status RUNNING')
        expect(logSpy).toHaveBeenCalledWith('Scan is currently in status COMPLETE')
    });

    it("getScanResultsSummary test", async () => {
        const spy = jest.spyOn(InsightAppSecClient.prototype, "getScanVulnerabilities");
        spy.mockImplementationOnce(() => testData.scanVulnsPg1);
        spy.mockImplementationOnce(() => testData.scanVulnsPg2);
        const result = await tools.getScanResultsSummary('scanID', "vulnQuery");
        expect(result).toEqual({ MEDIUM: 2, LOW: 8, INFORMATIONAL: 21, SAFE: 1 });
    });
});