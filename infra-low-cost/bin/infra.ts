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

const vpcStack = new VpcStack(app, 'IncidentsLcVpcStack', {
  env,
  description: 'VPC for Incident & Status Portal (low-cost)',
});

const secretsStack = new SecretsStack(app, 'IncidentsLcSecretsStack', {
  env,
  description: 'Secrets Manager for Incident & Status Portal (low-cost)',
});
secretsStack.addDependency(vpcStack);

const rdsStack = new RdsStack(app, 'IncidentsLcRdsStack', {
  env,
  description: 'RDS PostgreSQL db.t3.micro for Incident & Status Portal (low-cost)',
  vpc: vpcStack.vpc,
  rdsSg: vpcStack.rdsSg,
});
rdsStack.addDependency(vpcStack);

const ecrStack = new EcrStack(app, 'IncidentsLcEcrStack', {
  env,
  description: 'ECR repository for Incident & Status Portal (low-cost)',
});

const ecsStack = new EcsStack(app, 'IncidentsLcEcsStack', {
  env,
  description: 'ECS Fargate for Incident & Status Portal (low-cost)',
  vpc: vpcStack.vpc,
  albSg: vpcStack.albSg,
  ecsSg: vpcStack.ecsSg,
  repository: ecrStack.repository,
  dbSecret: rdsStack.dbSecret,
  jwtSecret: secretsStack.jwtSecret,
  dbEndpoint: rdsStack.instanceEndpoint,
});
ecsStack.addDependency(vpcStack);
ecsStack.addDependency(rdsStack);
ecsStack.addDependency(ecrStack);
ecsStack.addDependency(secretsStack);

const monitoringStack = new MonitoringStack(app, 'IncidentsLcMonitoringStack', {
  env,
  description: 'CloudWatch monitoring for Incident & Status Portal (low-cost)',
  fargateService: ecsStack.fargateService,
  alb: ecsStack.alb,
  alertEmail: process.env.ALERT_EMAIL,
});
monitoringStack.addDependency(ecsStack);

app.synth();
