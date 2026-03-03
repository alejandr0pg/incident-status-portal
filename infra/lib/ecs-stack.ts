import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';
import { buildTaskDefinition } from './ecs/task-definition';
import { buildAlb } from './ecs/alb';

export interface EcsStackProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
  readonly albSg: ec2.SecurityGroup;
  readonly ecsSg: ec2.SecurityGroup;
  readonly repository: ecr.Repository;
  readonly dbSecret: secretsmanager.ISecret;
  readonly jwtSecret: secretsmanager.ISecret;
  readonly dbEndpoint: string;
  readonly isProd: boolean;
}

export class EcsStack extends cdk.Stack {
  public readonly fargateService: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { vpc, albSg, ecsSg, repository, dbSecret, jwtSecret, dbEndpoint, isProd } = props;

    const logGroup = new logs.LogGroup(this, 'EcsLogGroup', {
      logGroupName: '/ecs/incidents-backend',
      retention: logs.RetentionDays.ONE_MONTH,
      removalPolicy: isProd ? cdk.RemovalPolicy.RETAIN : cdk.RemovalPolicy.DESTROY,
    });

    const cluster = new ecs.Cluster(this, 'IncidentsCluster', {
      vpc,
      clusterName: 'incidents-cluster',
      containerInsights: true,
    });

    const taskDefinition = buildTaskDefinition(this, {
      repository,
      dbSecret,
      jwtSecret,
      dbEndpoint,
      logGroup,
    });

    this.alb = buildAlb(this, { vpc, albSg });

    this.fargateService = new ecs.FargateService(this, 'IncidentsFargateService', {
      cluster,
      taskDefinition,
      serviceName: 'IncidentsFargateService',
      desiredCount: isProd ? 2 : 1,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      assignPublicIp: false,
      enableExecuteCommand: !isProd,
    });

    const targetGroup = new elbv2.ApplicationTargetGroup(this, 'IncidentsTargetGroup', {
      vpc,
      port: 3000,
      protocol: elbv2.ApplicationProtocol.HTTP,
      targetType: elbv2.TargetType.IP,
      healthCheck: {
        path: '/public/status',
        healthyHttpCodes: '200',
        interval: cdk.Duration.seconds(30),
        timeout: cdk.Duration.seconds(5),
        healthyThresholdCount: 2,
        unhealthyThresholdCount: 3,
      },
    });

    this.fargateService.attachToApplicationTargetGroup(targetGroup);

    const listener = this.alb.addListener('HttpListener', {
      port: 80,
      protocol: elbv2.ApplicationProtocol.HTTP,
      defaultTargetGroups: [targetGroup],
    });

    dbSecret.grantRead(taskDefinition.taskRole);
    jwtSecret.grantRead(taskDefinition.taskRole);
    repository.grantPull(taskDefinition.executionRole!);

    new cdk.CfnOutput(this, 'AlbDnsName', {
      value: this.alb.loadBalancerDnsName,
      exportName: 'IncidentsAlbDnsName',
    });

    new cdk.CfnOutput(this, 'AlbArn', {
      value: this.alb.loadBalancerArn,
      exportName: 'IncidentsAlbArn',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.fargateService.serviceName,
      exportName: 'IncidentsFargateServiceName',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: 'IncidentsClusterName',
    });

    // suppress unused variable warning
    void listener;
  }
}
