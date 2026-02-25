import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsStackProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
  readonly rdsSg: ec2.SecurityGroup;
  readonly dbSecret: secretsmanager.Secret;
  readonly isProd: boolean;
}

export class RdsStack extends cdk.Stack {
  public readonly clusterEndpoint: string;
  public readonly secretArn: string;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc, rdsSg, dbSecret, isProd } = props;

    const removalPolicy = isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const cluster = new rds.DatabaseCluster(this, 'IncidentsAuroraCluster', {
      engine: rds.DatabaseClusterEngine.auroraPostgres({
        version: rds.AuroraPostgresEngineVersion.VER_15_4,
      }),
      defaultDatabaseName: 'incidents',
      credentials: rds.Credentials.fromSecret(dbSecret),
      serverlessV2MinCapacity: 0.5,
      serverlessV2MaxCapacity: 4,
      writer: rds.ClusterInstance.serverlessV2('writer', {
        publiclyAccessible: false,
      }),
      readers: isProd
        ? [
            rds.ClusterInstance.serverlessV2('reader', {
              scaleWithWriter: true,
            }),
          ]
        : [],
      vpc,
      vpcSubnets: {
        subnetType: ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [rdsSg],
      deletionProtection: isProd,
      removalPolicy,
      backup: {
        retention: isProd ? cdk.Duration.days(7) : cdk.Duration.days(1),
        preferredWindow: '03:00-04:00',
      },
      preferredMaintenanceWindow: 'sun:05:00-sun:06:00',
    });

    this.clusterEndpoint = cluster.clusterEndpoint.hostname;
    this.secretArn = dbSecret.secretArn;

    new cdk.CfnOutput(this, 'ClusterEndpoint', {
      value: this.clusterEndpoint,
      exportName: 'IncidentsDbClusterEndpoint',
    });

    new cdk.CfnOutput(this, 'ClusterPort', {
      value: cluster.clusterEndpoint.port.toString(),
      exportName: 'IncidentsDbClusterPort',
    });

    new cdk.CfnOutput(this, 'DbSecretArnOutput', {
      value: this.secretArn,
      exportName: 'IncidentsRdsSecretArn',
    });
  }
}
