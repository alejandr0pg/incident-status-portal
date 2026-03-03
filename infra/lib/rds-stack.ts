import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsStackProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
  readonly rdsSg: ec2.SecurityGroup;
  readonly isProd: boolean;
}

export class RdsStack extends cdk.Stack {
  public readonly instanceEndpoint: string;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc, rdsSg, isProd } = props;

    const removalPolicy = isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    const instance = new rds.DatabaseInstance(this, 'IncidentsRdsInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      credentials: rds.Credentials.fromGeneratedSecret('incidents_admin', {
        secretName: 'incidents/db-credentials',
      }),
      databaseName: 'incidents',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSg],
      multiAz: isProd,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      deletionProtection: isProd,
      removalPolicy,
      backupRetention: isProd ? cdk.Duration.days(7) : cdk.Duration.days(1),
      deleteAutomatedBackups: !isProd,
    });

    this.instanceEndpoint = instance.dbInstanceEndpointAddress;
    this.dbSecret = instance.secret!;

    new cdk.CfnOutput(this, 'InstanceEndpoint', {
      value: this.instanceEndpoint,
      exportName: 'IncidentsDbInstanceEndpoint',
    });

    new cdk.CfnOutput(this, 'DbSecretArnOutput', {
      value: this.dbSecret.secretArn,
      exportName: 'IncidentsRdsSecretArn',
    });
  }
}
