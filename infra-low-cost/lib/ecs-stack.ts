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
}

// Free tier: ECS tasks run in PUBLIC subnets with assignPublicIp (no NAT gateway needed)
// Security: ECS SG only allows inbound on port 3000 from ALB SG — public IP is not exploitable
export class EcsStack extends cdk.Stack {
  public readonly fargateService: ecs.FargateService;
  public readonly alb: elbv2.ApplicationLoadBalancer;

  constructor(scope: Construct, id: string, props: EcsStackProps) {
    super(scope, id, props);

    const { vpc, albSg, ecsSg, repository, dbSecret, jwtSecret, dbEndpoint } = props;

    const logGroup = new logs.LogGroup(this, 'EcsLogGroup', {
      logGroupName: '/ecs/incidents-backend-lc',
      retention: logs.RetentionDays.ONE_WEEK,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const cluster = new ecs.Cluster(this, 'IncidentsCluster', {
      vpc,
      clusterName: 'incidents-lc-cluster',
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
      serviceName: 'incidents-lc-service',
      desiredCount: 1,
      securityGroups: [ecsSg],
      vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
      assignPublicIp: true,
      healthCheckGracePeriod: cdk.Duration.seconds(60),
      enableExecuteCommand: true,
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
      exportName: 'IncidentsLcAlbDnsName',
    });

    new cdk.CfnOutput(this, 'ServiceName', {
      value: this.fargateService.serviceName,
      exportName: 'IncidentsLcFargateServiceName',
    });

    new cdk.CfnOutput(this, 'ClusterName', {
      value: cluster.clusterName,
      exportName: 'IncidentsLcClusterName',
    });

    void listener;
  }
}
