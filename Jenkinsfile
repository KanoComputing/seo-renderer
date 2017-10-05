#!groovy

pipeline {
    agent any

    stages {
        // pulls down locally the sources for the component
        stage('checkout') {
            steps {
                checkout scm
            }
        }

        // Install the bower dependencies of the component
        stage('install dependencies') {
            steps {
                script {
                    def KEY = "-i ~/.ssh/kano-production-us.pem"
                    sh "eval \$(ssh-agent)"
                    sh "ssh-add ${KEY}"
                    sh "rsync -avz --exclude='.git/' ./ ubuntu@render-staging.kano.me:/opt/seo-render"
                    remote "cd /opt/seo-render && npm i"
                }
            }
        }

        // Lints, and tests the component
        stage('test') {
            steps {
                script {
                    // Enable once jenkins uses node 8
                    // sh "npm test --silent -- --tap > tap.log"
                    // step([$class: "TapPublisher", testResults: "./tap.log"])
                }
            }
        }

        // Install the bower dependencies of the component
        stage('restart server') {
            steps {
                remote "sudo supervisorctl restart seo-render"
            }
        }
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }
}

def remote (cmd) {
    sh "ssh ubuntu@render-staging.kano.me '${cmd}'"

}