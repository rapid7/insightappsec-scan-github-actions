# Rapid7 InsightAppSec Scan for GitHub actions

This GitHub action will start a scan on Rapid7 InsightAppSec and depending on configuration either:
- wait for its completion and return a result summary to the logs. These results can be filtered using the `vuln-query` (scan gating) option in the config.
- immediately return the InsightAppSec scan ID to the logs and the action finishes.

This can be configured using the `wait-for-scan-complete` option in the config.

The InsightAppSec API key will need to be added as a GitHub secret in order for the action to work. See how to do this here: https://docs.github.com/en/actions/security-guides/encrypted-secrets

## Usage

```yaml
- uses: rapid7/insightappsec-scan-github-actions
  with:
    # The region indicates the geo-location of the Insight Platform. For example 'us'.
    region: 'us'
    # The API key used to authorized the GitHub action to interact with the Rapid7 API. The API key should be stored as
    # a GitHub secret. Instructions for creating an InsightAppSec API key are shown in the Rapid7 InsightAppSec
    # documentation.
    api-key: ${{ secrets.INSIGHTAPPSEC_API_KEY }}
    # The UUID of the scan configuration to be used during scanning. The scan configuration should be a sub-resource of
    # the application and can be obtained from InsightAppSec.
    scan-config-id: '999703e4-a4p0-4ea6-a3sc-53cg789e4fc1'
    # Scan gating query. Used to filter results by vulnerability properties.
    vuln-query: 'vulnerability.vulnerabilityScore > 4'
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
        uses: rapid7/insightappsec-scan-github-actions@v1.0.0
        with:
          region: us
          api-key: ${{ secrets.IAS_API_KEY }}
          scan-config-id: '999703e4-a4p0-4ea6-a3sc-53cg789e4fc1'
          vuln-query: 'vulnerability.vulnerabilityScore > 4'
      - run: echo '${{ steps.my-scan.outputs.scan-findings }}'
```

## Development
To develop new versions of this action
1. Make the required code updates
2. From the root project directory, in a terminal execute
```
npm run build
```
3. Add the contents of the /dist directory to the changelist.
4. Submit the changes for review.
5. Once approved and merged a tag should also be created. It's this tag that's referenced in the implementing yaml file, the below example uses a v1.0.0 tag.
```
uses: rapid7/insightappsec-scan-github-actions@v1.0.0
```

### Unit tests
The unit tests use the jest framework. This can be installed using node package manager.

1. From the insightappsec-scan-github-actions directory _npm  install_ (only the first time)
2. From the insightappsec-scan-github-actions directory _npm run build_

### Execution

To execute all tests
1. From the insightappsec-scan-github-actions directory run _npm t_

For a code coverage report
1. From the insightappsec-scan-github-actions directory run _npm run coverage_