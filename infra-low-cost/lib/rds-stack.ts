import * as cdk from 'aws-cdk-lib';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as rds from 'aws-cdk-lib/aws-rds';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export interface RdsStackProps extends cdk.StackProps {
  readonly vpc: ec2.Vpc;
  readonly rdsSg: ec2.SecurityGroup;
}

// Free tier: db.t3.micro (750h/mes gratis, 20GB GP2 storage gratis)
// DB credentials generated here (not in SecretsStack) to avoid cyclic cross-stack refs
export class RdsStack extends cdk.Stack {
  public readonly instanceEndpoint: string;
  public readonly dbSecret: secretsmanager.ISecret;

  constructor(scope: Construct, id: string, props: RdsStackProps) {
    super(scope, id, props);

    const { vpc, rdsSg } = props;

    const instance = new rds.DatabaseInstance(this, 'IncidentsRdsInstance', {
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_15,
      }),
      instanceType: ec2.InstanceType.of(
        ec2.InstanceClass.T3,
        ec2.InstanceSize.MICRO,
      ),
      credentials: rds.Credentials.fromGeneratedSecret('incidents_admin', {
        secretName: 'incidents-lc/db-credentials',
      }),
      databaseName: 'incidents',
      vpc,
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_ISOLATED },
      securityGroups: [rdsSg],
      multiAz: false,
      allocatedStorage: 20,
      storageType: rds.StorageType.GP2,
      deletionProtection: false,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      backupRetention: cdk.Duration.days(1),
      deleteAutomatedBackups: true,
    });

    this.instanceEndpoint = instance.dbInstanceEndpointAddress;
    this.dbSecret = instance.secret!;

    new cdk.CfnOutput(this, 'InstanceEndpoint', {
      value: this.instanceEndpoint,
      exportName: 'IncidentsLcDbInstanceEndpoint',
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
      exportName: 'IncidentsLcDbSecretArn',
    });
  }
}
