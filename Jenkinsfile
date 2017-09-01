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
                    sh "npm i"
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
    }

    options {
        buildDiscarder(logRotator(numToKeepStr: '20'))
    }
}