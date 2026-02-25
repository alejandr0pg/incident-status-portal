import * as cdk from 'aws-cdk-lib';
import * as secretsmanager from 'aws-cdk-lib/aws-secretsmanager';
import { Construct } from 'constructs';

export class SecretsStack extends cdk.Stack {
  public readonly jwtSecret: secretsmanager.Secret;
  public readonly dbSecret: secretsmanager.Secret;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.jwtSecret = new secretsmanager.Secret(this, 'JwtSecret', {
      secretName: 'incidents/jwt-secret',
      description: 'JWT signing secret for Incident & Status Portal',
      generateSecretString: {
        passwordLength: 64,
        excludePunctuation: false,
        includeSpace: false,
      },
    });

    this.dbSecret = new secretsmanager.Secret(this, 'DbSecret', {
      secretName: 'incidents/db-credentials',
      description: 'RDS Aurora credentials for Incident & Status Portal',
      generateSecretString: {
        secretStringTemplate: JSON.stringify({ username: 'incidents_admin' }),
        generateStringKey: 'password',
        passwordLength: 32,
        excludeCharacters: '"@/\\\'',
        excludePunctuation: false,
        includeSpace: false,
      },
    });

    new cdk.CfnOutput(this, 'JwtSecretArn', {
      value: this.jwtSecret.secretArn,
      exportName: 'IncidentsJwtSecretArn',
    });

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: this.dbSecret.secretArn,
      exportName: 'IncidentsDbSecretArn',
    });
  }
}
