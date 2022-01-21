const InsightAppSecClient = require("../api/InsightAppSecClient");
const testData = require("./testdata");

const iasClient = new InsightAppSecClient("region", "apiKey");

describe("InsightAppSecClient tests", () => {

    it("startScan test", () => {
        const spy = jest.spyOn(iasClient.axiosInst, "post");
        spy.mockImplementationOnce(() => testData.submitScanResponse);
        const result = iasClient.startScan('config');
        expect(result).toEqual(testData.submitScanOutput);
    });

    it("getScan test", () => {
        const spy = jest.spyOn(iasClient.axiosInst, "get");
        spy.mockImplementationOnce(() => testData.getScanResponse);
        const result = iasClient.getScan('config');
        expect(result).toEqual(testData.getScanResponse);
    });

    it("getScanVulnerabilities test", () => {
        const spy = jest.spyOn(iasClient.axiosInst, "post");
        spy.mockImplementationOnce(() => testData.scanVulns);
        const result = iasClient.getScanVulnerabilities('scanID', 'vulnQuery', 'nextLink');
        expect(result).toEqual(testData.scanVulns);
    });
});