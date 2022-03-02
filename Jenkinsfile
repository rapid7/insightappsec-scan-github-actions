pipeline {

    agent {
        kubernetes(k8sAgent(name: 'ubuntu_base_image', idleMinutes: params.POD_IDLE_MINUTES))
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

                    sh """
                    curl -sL https://deb.nodesource.com/setup_12.x
                    apt install nodejs
                    npm install
                    npm t
                    """
            }
        }

        stage('Prepare build') {
            steps {
                    sh """
                        if [ -d "node_modules" ]
                        then
                            rm node_modules
                        fi
                        npm install --production
                        npm i -g @vercel/ncc@0.31.1
                        npm run build
                        """
            }
        }

        stage('Create tag') {
            steps {

                script {
                    if(params.VERSION_NUMBER == null){
                        error("Build failed. Version number not provided.")
                    }
                }


                sh """
                    git push origin ${params.VERSION_NUMBER}
                """
            }
        }
    }
}