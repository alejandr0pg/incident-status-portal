import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface TaskDefinitionProps {
  readonly repository: ecr.Repository;
  readonly dbSecret: secretsmanager.ISecret;
  readonly jwtSecret: secretsmanager.ISecret;
  readonly dbClusterEndpoint: string;
  readonly logGroup: logs.LogGroup;
}

export function buildTaskDefinition(
  scope: Construct,
  props: TaskDefinitionProps,
): ecs.FargateTaskDefinition {
  const { repository, dbSecret, jwtSecret, dbClusterEndpoint, logGroup } = props;

  const executionRole = new iam.Role(scope, 'EcsExecutionRole', {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    managedPolicies: [
      iam.ManagedPolicy.fromAwsManagedPolicyName(
        'service-role/AmazonECSTaskExecutionRolePolicy',
      ),
    ],
  });

  const taskRole = new iam.Role(scope, 'EcsTaskRole', {
    assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
  });

  taskRole.addToPolicy(
    new iam.PolicyStatement({
      actions: ['ssmmessages:CreateControlChannel', 'ssmmessages:CreateDataChannel', 'ssmmessages:OpenControlChannel', 'ssmmessages:OpenDataChannel'],
      resources: ['*'],
    }),
  );

  const taskDefinition = new ecs.FargateTaskDefinition(scope, 'IncidentsTaskDef', {
    family: 'incidents-backend',
    cpu: 512,
    memoryLimitMiB: 1024,
    executionRole,
    taskRole,
  });

  const dbUser = ecs.Secret.fromSecretsManager(dbSecret, 'username');
  const dbPass = ecs.Secret.fromSecretsManager(dbSecret, 'password');

  taskDefinition.addContainer('incidents-backend', {
    image: ecs.ContainerImage.fromEcrRepository(repository, 'latest'),
    essential: true,
    portMappings: [{ containerPort: 3000, protocol: ecs.Protocol.TCP }],
    environment: {
      PORT: '3000',
      NODE_ENV: 'production',
      DB_HOST: dbClusterEndpoint,
      DB_PORT: '5432',
      DB_NAME: 'incidents',
    },
    secrets: {
      DB_USER: dbUser,
      DB_PASSWORD: dbPass,
      JWT_SECRET: ecs.Secret.fromSecretsManager(jwtSecret),
    },
    logging: ecs.LogDrivers.awsLogs({
      streamPrefix: 'incidents-backend',
      logGroup,
    }),
    healthCheck: {
      command: ['CMD-SHELL', 'curl -f http://localhost:3000/public/status || exit 1'],
      interval: cdk.Duration.seconds(30),
      timeout: cdk.Duration.seconds(5),
      retries: 2,
      startPeriod: cdk.Duration.seconds(60),
    },
  });

  return taskDefinition;
}
