pipeline {
    agent any

    environment {
        EC2_HOST = '3.92.84.188'
        EC2_USER = 'ec2-user'
        RELEASES_DIR = '/home/ec2-user/releases'
        CURRENT_DIR = '/home/ec2-user/current'
        APP_PID = '/home/ec2-user/app.pid'
        APP_LOG = '/home/ec2-user/app.log'
        STARTUP_TEST_PORT = '3001'
    }

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

        stage('Test EC2 SSH') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "echo SSH_CONNECTION_SUCCESS && hostname"
                    '''
                }
            }
        }

        stage('Upload Artifact to EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "mkdir -p %RELEASES_DIR%"
                        scp -o StrictHostKeyChecking=no deploy.zip %EC2_USER%@%EC2_HOST%:%RELEASES_DIR%/deploy.zip
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "ls -lh %RELEASES_DIR%/deploy.zip"
                    '''
                }
            }
        }

        stage('Extract Release on EC2') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "rm -rf %RELEASES_DIR%/%BUILD_NUMBER% && mkdir -p %RELEASES_DIR%/%BUILD_NUMBER%"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "unzip -o %RELEASES_DIR%/deploy.zip -d %RELEASES_DIR%/%BUILD_NUMBER%"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "find %RELEASES_DIR%/%BUILD_NUMBER% -maxdepth 2 -type f | sort"
                    '''
                }
            }
        }

        stage('Install Production Dependencies') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd %RELEASES_DIR%/%BUILD_NUMBER% && npm ci --omit=dev"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd %RELEASES_DIR%/%BUILD_NUMBER% && npm ls --omit=dev --depth=0"
                    '''
                }
            }
        }

        stage('Configure Runtime Environment') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    withCredentials([
                        string(credentialsId: 'db-password', variable: 'DB_PASSWORD'),
                        string(credentialsId: 'ssl-passphrase', variable: 'SSL_PASSPHRASE')
                    ]) {
                        powershell '''
                            $envContent = @"
MYSQL_DB_HOST=127.0.0.1
MYSQL_DB_PORT=3307
MYSQL_DB_USER=root
MYSQL_DB_PASSWORD=$env:DB_PASSWORD
NODE_ENV=production
PORT=3000
SSL_CERT_PATH=/home/ec2-user/certs/server.crt
SSL_KEY_PATH=/home/ec2-user/certs/server.key
SSL_PASSPHRASE=$env:SSL_PASSPHRASE
"@

                            $releaseDir = "$env:RELEASES_DIR/$env:BUILD_NUMBER"

                            $envContent | ssh -o StrictHostKeyChecking=no "$env:EC2_USER@$env:EC2_HOST" "cat > $releaseDir/.env.local"
                            $envContent | ssh -o StrictHostKeyChecking=no "$env:EC2_USER@$env:EC2_HOST" "cat > $releaseDir/.env.prod"

                            ssh -o StrictHostKeyChecking=no "$env:EC2_USER@$env:EC2_HOST" "chmod 600 $releaseDir/.env.local $releaseDir/.env.prod"
                            ssh -o StrictHostKeyChecking=no "$env:EC2_USER@$env:EC2_HOST" "cd $releaseDir && grep -vE 'PASSWORD|PASSPHRASE' .env.prod"
                        '''
                    }
                }
            }
        }

        stage('Application Startup Test') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd %RELEASES_DIR%/%BUILD_NUMBER% && rm -f startup-test.pid startup-test.log && nohup env NODE_ENV=production PORT=%STARTUP_TEST_PORT% node dist/main.js > startup-test.log 2>&1 < /dev/null & echo $! > startup-test.pid"
                        ping 127.0.0.1 -n 11 >nul
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "curl -k -f https://127.0.0.1:%STARTUP_TEST_PORT%/health"
                    '''
                }
            }
            post {
                always {
                    sshagent(credentials: ['ec2-ssh-key']) {
                        bat '''
                            ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd %RELEASES_DIR%/%BUILD_NUMBER% && if [ -f startup-test.pid ]; then kill $(cat startup-test.pid) || true; fi; rm -f startup-test.pid startup-test.log"
                        '''
                    }
                }
            }
        }

        stage('Activate Release') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "ln -sfn %RELEASES_DIR%/%BUILD_NUMBER% %CURRENT_DIR%"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "ls -l %CURRENT_DIR%"
                    '''
                }
            }
        }

        stage('Restart Application') {
            steps {
                sshagent(credentials: ['ec2-ssh-key']) {
                    bat '''
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "if [ -f %APP_PID% ]; then kill $(cat %APP_PID%) || true; rm -f %APP_PID%; fi"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "cd %CURRENT_DIR% && nohup env NODE_ENV=production node dist/main.js > %APP_LOG% 2>&1 < /dev/null & echo $! > %APP_PID%"
                        ping 127.0.0.1 -n 11 >nul
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "curl -k -f https://127.0.0.1:3000/health"
                        ssh -o StrictHostKeyChecking=no %EC2_USER%@%EC2_HOST% "tail -n 50 %APP_LOG%"
                    '''
                }
            }
        }
    }

    post {
        success {
            echo "Deployment completed successfully. Active release: ${BUILD_NUMBER}"
        }
        failure {
            echo "Deployment failed. Check Jenkins stage logs and EC2 application log."
        }
    }
}
