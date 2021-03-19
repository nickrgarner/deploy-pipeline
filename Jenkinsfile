pipeline {
    agent any

    environment {
        DB_ENGINE = 'mongodb',
        APP_PORT = 3002,
        MONGO_PORT = 27017,
        MONGO_USER = 'SpicyPanda',
        MONGO_PASSWORD = 'joenickjosh0',
        MONGO_IP = localhost
    }

    stages {
        stage('Build') {
            steps {
                echo 'Building...';
                sh 'printenv | sort';
            }
        }
    }
}