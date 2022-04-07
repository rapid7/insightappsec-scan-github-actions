![InsightAppSec](https://brand.rapid7.com/includes/file/png/insightappsec-b-c.png)
# InsightAppSec Scan Action
The [InsightAppSec Scan](https://docs.rapid7.com/insightappsec/github-actions-integration) GitHub Action allows security and development teams to integrate dynamic application security testing (DAST) into the CI/CD pipeline.

# About InsightAppSec
[InsightAppSec](https://www.rapid7.com/products/insightappsec/) is Rapid7’s industry leading Dynamic Application Security Testing (DAST) that helps you understand and minimize risk in your web applications and APIs. 

# Usage
The action will start a scan on Rapid7 InsightAppSec and depending on configuration either:
- wait for its completion and return a result summary to the logs. These results can be filtered using the `vuln-query` (scan gating) option in the config.
- immediately return the InsightAppSec scan ID to the logs and the action finishes.

This behavior can be configured using the `wait-for-scan-complete` option in the config.

The InsightAppSec API key will need to be added as a GitHub secret in order for the action to work. See how to do this here: https://docs.github.com/en/actions/security-guides/encrypted-secrets


```yaml
- uses: rapid7/insightappsec-scan-github-actions@v1.2.0
  with:
    # The region indicates the geo-location of the Insight Platform. For example 'us'.
    region: "us"
    # The API key used to authorized the GitHub action to interact with the Rapid7 API. The API key should be stored as
    # a GitHub secret. Instructions for creating an InsightAppSec API key are shown in the Rapid7 InsightAppSec
    # documentation.
    api-key: ${{ secrets.INSIGHTAPPSEC_API_KEY }}
    # The UUID of the scan configuration to be used during scanning. The scan configuration should be a sub-resource of
    # the application and can be obtained from InsightAppSec.
    scan-config-id: "999703e4-a4p0-4ea6-a3sc-53cg789e4fc1"
    # Scan gating query. Used to filter results by vulnerability properties. If this has a value and the query returns
    # vulnerabilities from the scan then the job will be marked as failed. The format of the scan gating query should conform to the 
    # VULNERABILITY search query format described in the documentation: 
    # https://help.rapid7.com/insightappsec/en-us/api/v1/docs.html#tag/Search
    vuln-query: "vulnerability.vulnerabilityScore > 4"
    # If false the Scan ID will be returned as soon as the scan is kicked off, else the workflow will continually poll 
    # until the scan is completed and return the results. Defaults to true.
    wait-for-scan-complete: true
```

A full example yaml may look similar to:
```yaml
name: IAS Scan
on:
  push:
    branches: [ master ]
jobs:
  scan:
    runs-on: ubuntu-latest
    steps:
      - id: my-scan
        uses: rapid7/insightappsec-scan-github-actions@v1.2.0
        with:
          region: "us"
          api-key: ${{ secrets.IAS_API_KEY }}
          scan-config-id: "999703e4-a4p0-4ea6-a3sc-53cg789e4fc1"
          vuln-query: "vulnerability.vulnerabilityScore > 4"
      - name: Upload findings
        if: always()
        run: echo "${{ steps.my-scan.outputs.scan-findings }}"
```

The body of a vulnerability query cannot contain double quotes ("), single quotes (') should be used instead. The entire vuln-query property can be wrapped in double quotes. For example:
```yaml
  vuln-query: "vulnerability.severity = 'MEDIUM'"
```

## Development
To develop new versions of this action, we use a combination of manual testing and the Jenkins CI pipeline. 

1. Make the required code updates and test locally.
2. Create a fork on the repo.
3. Delete previous tags. Local: git tag -d <tagname>   Remote: git push --delete origin <tagname>
4. Delete dist/index.js.
5. Remove node_modules folder.
6. Build new file: npm run build.
7. Create new tags. Local: git tag <tagname>     Remote: git push origin <tagname> 
8. Push branch changes to Github.
9. Checkout forked master branch and pull changes.
10. Create yaml file in workflows/.github folder, as per https://wiki.corp.rapid7.com/display/EXT/GitHub+Scan+Action "Testing Changes" section.
11. Add your AppSec API key to the forked repo as a secret named IAS_API_KEY.
12. Push any changes to the forked master branch.
13. If a scan is not kicked off automatically, make a further change to the forked repo, i.e. add an additional space to the READ_ME file.
14. If the scan runs successfully, create a PR to the rapid7 master branch. Merging will kick-off the CI pipeline.
15. In the insightappsec-scan-github-actions folder on Jenkins VRM, create a new build with parameters for your branch. Provide a tag number, i.e. v1.0.0, and tick the RUN_PIPELINE checkbox.
16. If required, manually create a new release based on your new tag.

### Unit tests
The unit tests use the jest framework. This can be installed using node package manager.

1. From the insightappsec-scan-github-actions directory _npm  install_ (only the first time)
2. From the insightappsec-scan-github-actions directory _npm run build_

### Execution

To execute all tests
- From the insightappsec-scan-github-actions directory run _npm t_

For a code coverage report
- From the insightappsec-scan-github-actions directory run _npm run coverage_
