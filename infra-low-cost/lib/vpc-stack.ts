import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import { Construct } from 'constructs';

// Free tier: 0 NAT Gateways — ECS runs in public subnets with assignPublicIp
// RDS stays in isolated subnet (internal VPC routing, not internet-accessible)
export class VpcStack extends cdk.Stack {
  public readonly vpc: ec2.Vpc;
  public readonly albSg: ec2.SecurityGroup;
  public readonly ecsSg: ec2.SecurityGroup;
  public readonly rdsSg: ec2.SecurityGroup;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.vpc = new ec2.Vpc(this, 'IncidentsVpc', {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 28,
          name: 'isolated',
          subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
        },
      ],
    });

    this.albSg = new ec2.SecurityGroup(this, 'AlbSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for Application Load Balancer',
      allowAllOutbound: true,
    });

    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(80), 'Allow HTTP');
    this.albSg.addIngressRule(ec2.Peer.anyIpv4(), ec2.Port.tcp(443), 'Allow HTTPS');

    this.ecsSg = new ec2.SecurityGroup(this, 'EcsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for ECS Fargate tasks',
      allowAllOutbound: true,
    });

    this.ecsSg.addIngressRule(
      this.albSg,
      ec2.Port.tcp(3000),
      'Allow traffic from ALB on port 3000',
    );

    this.rdsSg = new ec2.SecurityGroup(this, 'RdsSecurityGroup', {
      vpc: this.vpc,
      description: 'Security group for RDS PostgreSQL',
      allowAllOutbound: false,
    });

    this.rdsSg.addIngressRule(
      this.ecsSg,
      ec2.Port.tcp(5432),
      'Allow PostgreSQL from ECS tasks',
    );

    new cdk.CfnOutput(this, 'VpcId', { value: this.vpc.vpcId, exportName: 'IncidentsLcVpcId' });
    new cdk.CfnOutput(this, 'AlbSgId', { value: this.albSg.securityGroupId, exportName: 'IncidentsLcAlbSgId' });
    new cdk.CfnOutput(this, 'EcsSgId', { value: this.ecsSg.securityGroupId, exportName: 'IncidentsLcEcsSgId' });
    new cdk.CfnOutput(this, 'RdsSgId', { value: this.rdsSg.securityGroupId, exportName: 'IncidentsLcRdsSgId' });
  }
}
