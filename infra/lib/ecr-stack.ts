import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export interface EcrStackProps extends cdk.StackProps {
  readonly isProd: boolean;
}

export class EcrStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props: EcrStackProps) {
    super(scope, id, props);

    const { isProd } = props;

    const removalPolicy = isProd
      ? cdk.RemovalPolicy.RETAIN
      : cdk.RemovalPolicy.DESTROY;

    this.repository = new ecr.Repository(this, 'IncidentsBackendRepo', {
      repositoryName: 'incidents-backend',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      removalPolicy,
      emptyOnDelete: !isProd,
    });

    this.repository.addLifecycleRule({
      description: 'Remove untagged images after 1 day',
      maxImageAge: cdk.Duration.days(1),
      rulePriority: 1,
      tagStatus: ecr.TagStatus.UNTAGGED,
    });

    this.repository.addLifecycleRule({
      description: 'Keep only the last 10 images',
      maxImageCount: 10,
      rulePriority: 2,
      tagStatus: ecr.TagStatus.ANY,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      exportName: 'IncidentsEcrRepositoryUri',
    });

    new cdk.CfnOutput(this, 'RepositoryArn', {
      value: this.repository.repositoryArn,
      exportName: 'IncidentsEcrRepositoryArn',
    });

    new cdk.CfnOutput(this, 'RepositoryName', {
      value: this.repository.repositoryName,
      exportName: 'IncidentsEcrRepositoryName',
    });
  }
}
