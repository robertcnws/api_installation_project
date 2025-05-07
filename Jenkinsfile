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
    JENKINS_HOOK             = "api-installation-repository-hook"
  }

  stages {
    stage('Checkout & Stash') {
      agent any
      steps {
        checkout scm
        stash name: 'source', includes: '**'
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

    stage('Login to ECR') {
      agent { label 'docker' }
      steps {
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            aws_pw=$(docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              amazon/aws-cli ecr get-login-password --region $AWS_DEFAULT_REGION)
            echo "$aws_pw" | docker login --username AWS --password-stdin $AWS_ECR_REGISTRY
          '''
        }
      }
    }

    stage('Prune Docker') {
      agent { label 'docker' }
      steps {
        sh 'docker system prune -af || true'
      }
    }

    stage('Build & Push Backend') {
      when { changeset "**/backend_app/**" }
      agent { label 'docker' }
      steps {
        deleteDir()
        unstash 'source'
        dir('backend_app') {
          sh """
            docker-compose -f ../docker-compose.aws.backend.prod.yml build
            docker tag "${JENKINS_HOOK}_aws_backend_app:latest" "${BACKEND_IMAGE}:latest"
            docker push "${BACKEND_IMAGE}:latest"
          """
        }
      }
    }

    stage('Build & Push Frontend') {
      when { changeset "**/frontend_app/**" }
      agent { label 'docker' }
      steps {
        deleteDir()
        unstash 'source'
        dir('frontend_app') {
          withCredentials([file(credentialsId: env.AWS_FRONTEND_ENV_CRED_ID, variable: 'ENV_FILE')]) {
            sh 'cp $ENV_FILE .env'
          }
          sh 'npm ci'
          sh 'npm run lint -- --fix'
          sh 'npm run build'
          sh """
            docker-compose -f ../docker-compose.aws.frontend.prod.yml build
            docker tag "${JENKINS_HOOK}_aws_frontend_app:latest" "${FRONTEND_IMAGE}:latest"
            docker push "${FRONTEND_IMAGE}:latest"
          """
        }
      }
    }

    stage('Deploy Backend') {
      when { changeset "**/backend_app/**" }
      agent { label 'docker' }
      steps {
        echo "→ There are changes in backend_app, redeploy backend"
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              -e AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION \
              amazon/aws-cli ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_BACKEND_SERVICE \
                --force-new-deployment
          '''
        }
      }
    }

    stage('Deploy Frontend') {
      when { changeset "**/frontend_app/**" }
      agent { label 'docker' }
      steps {
        echo "→ There are changes in frontend_app, redeploy frontend"
        withCredentials([[
          $class: 'AmazonWebServicesCredentialsBinding',
          credentialsId: 'aws-ecr-creds'
        ]]) {
          sh '''
            docker run --rm \
              -e AWS_ACCESS_KEY_ID=$AWS_ACCESS_KEY_ID \
              -e AWS_SECRET_ACCESS_KEY=$AWS_SECRET_ACCESS_KEY \
              -e AWS_DEFAULT_REGION=$AWS_DEFAULT_REGION \
              amazon/aws-cli ecs update-service \
                --cluster $AWS_CLUSTER \
                --service $AWS_FRONTEND_SERVICE \
                --force-new-deployment
          '''
        }
      }
    }
  }  

  post {
    success {
      script {
        if (currentBuild.changeSets.any { it.items.size() > 0 }) {
          emailext (
            subject: "Build #${env.BUILD_NUMBER} - Changes detected",
            body: """
              Build has completed successfully #${env.BUILD_NUMBER}  
              Project: ${env.JOB_NAME}  
              URL: ${env.BUILD_URL}  

              Changes detected:
              ${currentBuild.changeSets.collect { cs ->
                  cs.items.collect { "- ${it.author} : ${it.msg}" }.join("\n")
                }.join("\n")}
            """,
            from: 'Jenkins NWS CI/CD <nnws15815@gmail.com>',
            to: '$DEFAULT_RECIPIENTS',
            // to: "equipo@tudominio.com"
          )
        }
      }
    }
    failure {
      emailext (
        subject: "Build #${env.BUILD_NUMBER} failed",
        body: "Build has failed. More info in ${env.BUILD_URL}",
        from: 'Jenkins NWS CI/CD <nnws15815@gmail.com>',
        to: '$DEFAULT_RECIPIENTS',
        // to: "equipo@tudominio.com"
      )
    }
  }

}    
