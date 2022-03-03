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
            steps {
                container("node"){
                    script{
                        if(params.VERSION_NUMBER.isEmpty()){
                        error("Build failed. Version number not provided.")
                        }

                        repositoryCommiterEmail = 'sophie_stephenson@rapid7.com'
                        repositoryCommiterUsername = 'sstephenson-r7'

                        checkout scm

                        sh("git config user.email ${repositoryCommiterEmail}")
                        sh("git config user.name '${repositoryCommiterUsername}'")

                        sh "git remote set-url origin https://github.com/rapid7/insightappsec-scan-github-actions"

                        // deletes current snapshot tag
                        sh "git tag -d ${params.VERSION_NUMBER} || true"
                        // tags current changeset
                        sh "git tag -a ${params.VERSION_NUMBER}  -m \"passed CI\""
                        // deletes tag on remote in order not to fail pushing the new one
                        sh "git push origin :refs/tags/${params.VERSION_NUMBER} "
                        // pushes the tags
                        sh "git push --tags"
                    }
                }
            }
        }
    }
}
