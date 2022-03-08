pipeline {

    agent {
        kubernetes {
yaml """
apiVersion: v1
kind: Pod
metadata:
  name: pod
  labels:
    name: pod
spec:
  nodeSelector:
    eks.amazonaws.com/capacityType: SPOT
  securityContext:
    fsGroup: 993
  volumes:
  - name: docker-socket
    hostPath:
      path: '/var/run/docker.sock'
  containers:
  - name: node
    image: node:14.17.0-slim
    command:
    - cat
    tty: true
    resources:
      limits:
        cpu: "200m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "256Mi"
    volumeMounts:
    - mountPath: '/var/run/docker.sock'
      name: docker-socket
  - name: jenkins-agent
    image: 207483685382.dkr.ecr.us-east-1.amazonaws.com/jenkins-agent:latest
    command:
    - cat
    tty: true
    resources:
      limits:
        cpu: "200m"
        memory: "512Mi"
      requests:
        cpu: "100m"
        memory: "256Mi"
    volumeMounts:
    - mountPath: '/var/run/docker.sock'
      name: docker-socket
    securityContext:
      runAsUser: 1000
      runAsGroup: 1000
      allowPrivilegeEscalation: false
"""
    // idleMinutes 60 // Stay idle after build
    defaultContainer 'jenkins-agent'
        }
    }

    options {
        ansiColor('xterm')
        timestamps()
    }

    parameters {
        string(name: 'POD_IDLE_MINUTES', defaultValue: '0', description: 'Number of minutes pod will stay idle post build')
        string(name: 'VERSION_NUMBER', description: 'InsightAppSec Gitlab Scan version number')
    }

    stages {

        //run unit tests
        stage('Unit tests') {
            steps {
                container("node"){
                    script {
                        sh """
                        npm install --save-dev jest
                        npm t
                        """
                    }
                }
            }
        }

        //create updated dist/index.js file
        stage('Prepare build') {
            steps {
                container("node"){
                    script {
                        sh """
                        if [ -d "node_modules" ]
                        then
                            rm -r node_modules
                        fi
                        npm install --production
                        npm i -g @vercel/ncc@0.31.1
                        npm run build
                        """
                    }
                }
            }
        }

        stage('Create tag') {
            when {
                expression {
                    //prevent 'create tag' stage from running if version number not provided
                    !params.VERSION_NUMBER.isEmpty()
                }
            }
            steps {
                withCredentials([usernamePassword(credentialsId: 'github-app-key', usernameVariable: 'USERNAME', passwordVariable: 'PASSWORD')]) {
                    sh label: 'git config user.email',
                    script: 'git config --global user.email github_serviceaccounts+$USERNAME@rapid7.com'
                    sh label: 'git config user.name',
                    script: 'git config --global user.name $USERNAME'

                    //push new tag to repo
                    //sh """
                    //git tag ${params.VERSION_NUMBER}
                    //git push https://${USERNAME}:${PASSWORD}@github.com/rapid7/insightappsec-scan-github-actions ${params.VERSION_NUMBER}
                    //"""

                    //update dist/index.js file
                    sh """
                    if [ -f "dist/index.js" ]; then
                        git add dist/index.js
                        git diff --quiet && git diff --staged --quiet || git commit -m "Updating index.js file"
                        git push https://${USERNAME}:${PASSWORD}@github.com/rapid7/insightappsec-scan-github-actions
                    else
                        echo "File not accessed"
                    fi
                    """

                    //create release
                    //sh """
                    //gh release create ${params.VERSION_NUMBER}
                    //"""
                }
                    
            }
        }
    }
}
