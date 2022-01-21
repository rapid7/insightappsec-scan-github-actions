module.exports = {
    startScanResponse: {
        status: 200,
        headers: {
            location: "placeholder/9a0b6a25-f05h-4c76-b9db-797x8bb4fb00"
        }
    },

    getScanResponse: {
        "data" : [{
          "id" : "9a0b6a25-f05h-4c76-b9db-797x8bb4fb00",
          "app" : {
            "id" : "674203e4-a4e6-4ab6-a38c-53c8789ebfg9"
            }
          },
          {
            "id" : "c81b4776-cfb0-408f-81c3-1df3c869f03e",
            "app" : {
              "id" : "674203e4-a4e6-4ab6-a38c-53c8789ebfg9"
            }
          }
          ],
        "metadata": {
          "index": 0,
          "size": 50,
          "total_data": 2,
          "total_pages": 1
      },
      "links": [
          {
              "rel": "first",
              "href": "https://us.api.insight.rapid7.com:443/ias/search?index=0&size=50"
          },
          {
              "rel": "self",
              "href": "https://us.api.insight.rapid7.com:443/ias/search"
          },
          {
              "rel": "next",
              "href": ""
          },
          {
              "rel": "last",
              "href": "https://us.api.insight.rapid7.com:443/ias/search?index=0&size=50"
          }
      ]
    },

    getScanOutput: {
        "data" : [{
          "id" : "9a0b6a25-f05h-4c76-b9db-797x8bb4fb00",
          "app" : {
            "id" : "674203e4-a4e6-4ab6-a38c-53c8789ebfg9"
            }
          },
          {
            "id" : "c81b4776-cfb0-408f-81c3-1df3c869f03e",
            "app" : {
              "id" : "674203e4-a4e6-4ab6-a38c-53c8789ebfg9"
            }
          }
          ],
        "metadata": {
          "index": 0,
          "size": 50,
          "total_data": 2,
          "total_pages": 1
      },
      "links": [
          {
              "rel": "first",
              "href": "https://us.api.insight.rapid7.com:443/ias/search?index=0&size=50"
          },
          {
              "rel": "self",
              "href": "https://us.api.insight.rapid7.com:443/ias/search"
          },
          {
              "rel": "next",
              "href": ""
          },
          {
              "rel": "last",
              "href": "https://us.api.insight.rapid7.com:443/ias/search?index=0&size=50"
          }
      ]
    },

    scanStatusRunning: {
        'status': 200,
        'data': {
          "status": "RUNNING"
        }
    },

    scanStatusComplete: {
        'status': 200,
        'data': {
          "status": "COMPLETE"
          }
    },

    startScanOutput: "9a0b6a25-f05h-4c76-b9db-797x8bb4fb00",

    getNextInput: {
        "links" : [ {
            "rel" : "first",
            "href" : "https://us.api.insight.rapid7.com:443/ias/v1/search?index=0&size=2"
          }, {
            "rel" : "self",
            "href" : "https://us.api.insight.rapid7.com:443/ias/v1/search"
          }, {
            "rel" : "next",
            "href" : "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=2"
          }, {
            "rel" : "last",
            "href" : "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=2"
          } ]
    },
    
    getNextOutput: "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=2",

    scanVulnsPg1: {"status": 200, "data": {
        "data": [
            {
                "severity": "MEDIUM"
            },
            {
                "severity": "MEDIUM"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "LOW"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            }
        ],
        "metadata": {
            "index": 0,
            "size": 20,
            "total_data": 32,
            "total_pages": 2
        },
        "links": [
            {
                "rel": "first",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=0&size=20"
            },
            {
                "rel": "self",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search"
            },
            {
                "rel": "next",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=20"
            },
            {
                "rel": "last",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=20"
            }
        ]
    }
    },

    scanVulnsPg2: {"status": 200, "data": {
        "data": [
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {

                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "INFORMATIONAL"
            },
            {
                "severity": "SAFE"
            }
        ],
        "metadata": {
            "index": 1,
            "size": 20,
            "total_data": 32,
            "total_pages": 2
        },
        "links": [
            {
                "rel": "first",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=0&size=20"
            },
            {
                "rel": "previous",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=0&size=20"
            },
            {
                "rel": "self",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search"
            },
            {
                "rel": "last",
                "href": "https://us.api.insight.rapid7.com:443/ias/v1/search?index=1&size=20"
            }
        ]
    }
    }
};