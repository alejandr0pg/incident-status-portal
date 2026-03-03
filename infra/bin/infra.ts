#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { VpcStack } from '../lib/vpc-stack';
import { SecretsStack } from '../lib/secrets-stack';
import { RdsStack } from '../lib/rds-stack';
import { EcrStack } from '../lib/ecr-stack';
import { EcsStack } from '../lib/ecs-stack';
import { MonitoringStack } from '../lib/monitoring-stack';

const app = new cdk.App();

const env: cdk.Environment = {
  account: process.env.CDK_DEFAULT_ACCOUNT,
  region: process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
};

const isProd = process.env.NODE_ENV === 'production';

const vpcStack = new VpcStack(app, 'IncidentsVpcStack', {
  env,
  description: 'VPC and networking for Incident & Status Portal',
});

const secretsStack = new SecretsStack(app, 'IncidentsSecretsStack', {
  env,
  description: 'Secrets Manager resources for Incident & Status Portal',
});
secretsStack.addDependency(vpcStack);

const rdsStack = new RdsStack(app, 'IncidentsRdsStack', {
  env,
  description: 'RDS Aurora Serverless v2 for Incident & Status Portal',
  vpc: vpcStack.vpc,
  rdsSg: vpcStack.rdsSg,
  isProd,
});
rdsStack.addDependency(vpcStack);
rdsStack.addDependency(secretsStack);

const ecrStack = new EcrStack(app, 'IncidentsEcrStack', {
  env,
  description: 'ECR repository for Incident & Status Portal',
  isProd,
});

const ecsStack = new EcsStack(app, 'IncidentsEcsStack', {
  env,
  description: 'ECS Fargate service for Incident & Status Portal',
  vpc: vpcStack.vpc,
  albSg: vpcStack.albSg,
  ecsSg: vpcStack.ecsSg,
  repository: ecrStack.repository,
  dbSecret: rdsStack.dbSecret,
  jwtSecret: secretsStack.jwtSecret,
  dbEndpoint: rdsStack.instanceEndpoint,
  isProd,
});
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(rdsStack);
ecsStack.addDependency(ecrStack);
ecsStack.addDependency(secretsStack);

const monitoringStack = new MonitoringStack(app, 'IncidentsMonitoringStack', {
  env,
  description: 'CloudWatch monitoring for Incident & Status Portal',
  fargateService: ecsStack.fargateService,
  alb: ecsStack.alb,
  alertEmail: process.env.ALERT_EMAIL,
});
monitoringStack.addDependency(ecsStack);

app.synth();
