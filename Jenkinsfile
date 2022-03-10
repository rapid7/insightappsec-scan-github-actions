pipeline {

    agent {
        kubernetes (
            k8sAgent(
            name: 'nodeJs', 
            nodeJS: "14.17.0-slim",
            idleMinutes: params.POD_IDLE_MINUTES
            )
        )
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
                        if [ -f "dist/index.js" ]
                        then
                            rm  dist/index.js
                        fi
                        npm install --production
                        npm i -g @vercel/ncc@0.31.1
                        npm run build
                        """
                        stash includes: "dist/index.js", name: "indexFile"
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

                dir(env.WORKSPACE) {
                    unstash "indexFile"
                }

                sh """
                if [ "dist/index.js" ]; then 
                    echo "Got the file."
                else
                    echo "No file."
                fi                
                """

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
                if [ git diff --name-only HEAD~1 HEAD | grep 'dist/index.js' ]; then
                    echo "File accessed!"
                    git add dist/index.js
                    git commit -am "Updating index.js file"
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
