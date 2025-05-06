pipeline {

  triggers {
    githubPush()
  }

  agent none

  tools {
    nodejs 'node20'   
  }
  
  environment {
    AWS_ECR_REGISTRY         = "324037323031.dkr.ecr.us-east-2.amazonaws.com/nws"
    BACKEND_IMAGE            = "${AWS_ECR_REGISTRY}/installation_projects_backend"
    FRONTEND_IMAGE           = "${AWS_ECR_REGISTRY}/installation_projects_frontend"
    AWS_DEFAULT_REGION       = "us-east-2"
    AWS_FRONTEND_ENV_CRED_ID = "AWS_FRONTEND_ENV_CRED_ID"
    AWS_CLUSTER              = "api-dealerportal-cluster"
    AWS_FRONTEND_SERVICE     = "installation-project-frontend-service"
    AWS_BACKEND_SERVICE      = "installation-project-backend-service"
  }

  stages {

    stage('Checkout') {
      agent any
      steps {
        checkout scm
      }
    }

    stage('Verify agent groups') {
        agent { label 'docker' }
        steps {
            sh 'echo "Users: $(id -un)"'
            sh 'echo "Groups: $(id -Gn)"'
        }
    }

    stage('Smoke Test Docker') {
      agent { label 'docker' }
      steps {
        echo "🔍 Testing Docker from this agent in EC2..."
        sh 'docker version'
        sh 'docker info'
        sh 'docker-compose version'
      }
    }

    stage('Build & Push Backend') {
      when {
        changeset "**/backend_app/**"
      }
      agent { 
        label 'docker' 
      }
      steps {
        dir('backend_app') {
          sh """
            docker-compose -f docker-compose.aws.backend.prod.yml build
            docker tag api_installation_project-aws_backend_app:latest $BACKEND_IMAGE:latest
            aws ecr get-login-password \
              | docker login --username AWS --password-stdin $AWS_ECR_REGISTRY
            docker push $BACKEND_IMAGE:latest
          """
        }
      }
    }

    stage('Install Frontend Dependencies') {
      agent { label 'docker' }
      when {
        anyOf {
          expression { !fileExists('frontend_app/node_modules') }
          changeset "frontend_app/package.json"
          changeset "frontend_app/package-lock.json"
        }
      }
      steps {
        dir('frontend_app') {
          echo "⇒ Installing dependencies (npm ci)…"
          sh 'npm ci'
        }
      }
    }

    stage('Build & Push Frontend') {
        when { changeset "**/frontend_app/**" }
        agent { label 'docker' }
        steps {
            dir('frontend_app') {
            withCredentials([file(credentialsId: env.AWS_FRONTEND_ENV_CRED_ID, variable: 'ENV_FILE')]) {
                sh 'cp $ENV_FILE .env'
            }
            sh 'npm run lint -- --fix'
            sh 'npm run build'
            sh """
                docker-compose -f docker-compose.aws.frontend.prod.yml build
                docker tag api_installation_project-aws_frontend_app:latest $FRONTEND_IMAGE:latest
                aws ecr get-login-password | docker login --username AWS --password-stdin $AWS_ECR_REGISTRY
                docker push $FRONTEND_IMAGE:latest
            """
            }
        }
    }

    stage('Deploy Backend') {
        when {
            changeset "**/backend_app/**"
        }
        agent { 
            label 'docker' 
        }
        steps {
            echo "→ There are changes in backend_app, redeploy backend"
            sh """
                aws ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_BACKEND_SERVICE \
                --force-new-deployment
            """
        }
    }

    stage('Deploy Frontend') {
        when {
        changeset "**/frontend_app/**"
        }
        agent { 
            label 'docker' 
        }
        steps {
            echo "→ There are changes in frontend_app, redeploy frontend"
            sh """
                aws ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_FRONTEND_SERVICE \
                --force-new-deployment
            """
        }
    }
  }
}
