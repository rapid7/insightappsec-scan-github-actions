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
        booleanParam(name: 'RUN_PIPELINE', defaultValue: false, description: 'Option to trigger pipeline')
    }

    stages {

        //run unit tests
        stage('Unit tests') {
             when {
                expression {
                    params.RUN_PIPELINE
                }
            }
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
            when {
                expression {
                    params.RUN_PIPELINE
                }
            }
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
                    }
                }
            }
        }

        stage('Create tag') {
            when {
                expression {
                    params.RUN_PIPELINE
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

                //check-in index file, create tag and release
                sh """
                if [ -f "dist/index.js" ]; then 
                    git add dist/index.js
                    git commit -m "Updating index.js file"
                    git push https://${USERNAME}:${PASSWORD}@github.com/rapid7/insightappsec-scan-github-actions

                    git tag ${params.VERSION_NUMBER}
                    git push https://${USERNAME}:${PASSWORD}@github.com/rapid7/insightappsec-scan-github-actions ${params.VERSION_NUMBER}

                    gh auth login --with-token ${GITHUB_TOKEN}
                    gh release create ${params.VERSION_NUMBER}
                fi
                """
                }  
            }
        }
    }
}
