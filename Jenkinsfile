pipeline {
    agent any

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/razz1992/nest-graphql-mysql.git'
            }
        }
        stage('Install Dependencies') {
            steps {
                bat 'node -v'
                bat 'npm -v'
                bat 'npm ci'
            }
        }
        stage('Verify Dependencies') {
            steps {
                bat 'if exist node_modules (echo node_modules exists) else (echo ERROR: node_modules missing & exit /b 1)'
                bat 'npm ls --depth=0'
            }
        }
        stage('Lint') {
            steps {
                bat 'npm run lint'
            }
        }
        stage('Unit Tests') {
            steps {
                bat 'npm test -- --runInBand'
            }
        }
        stage('Build') {
            steps {
                bat 'npm run build'
            }
        }
        stage('Verify Build Artifact') {
            steps {
                bat 'if exist dist (echo dist folder exists) else (echo ERROR: dist folder missing & exit /b 1)'
                bat 'dir dist'
            }
        }        
        stage('Package Artifact') {
            steps {
                bat 'if exist deploy.zip del /f /q deploy.zip'
                bat 'powershell -Command "Compress-Archive -Path dist,package.json,package-lock.json -DestinationPath deploy.zip -Force"'
                bat 'dir deploy.zip'
            }
        }
        stage('Archive Artifact') {
            steps {
                archiveArtifacts artifacts: 'deploy.zip', fingerprint: true
            }
        }
        
    }
}