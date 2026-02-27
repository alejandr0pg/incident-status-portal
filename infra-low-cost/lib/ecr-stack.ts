import * as cdk from 'aws-cdk-lib';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import { Construct } from 'constructs';

export class EcrStack extends cdk.Stack {
  public readonly repository: ecr.Repository;

  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    this.repository = new ecr.Repository(this, 'IncidentsBackendRepo', {
      repositoryName: 'incidents-backend-lc',
      imageScanOnPush: true,
      imageTagMutability: ecr.TagMutability.MUTABLE,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    this.repository.addLifecycleRule({
      description: 'Remove untagged images after 1 day',
      maxImageAge: cdk.Duration.days(1),
      rulePriority: 1,
      tagStatus: ecr.TagStatus.UNTAGGED,
    });

    this.repository.addLifecycleRule({
      description: 'Keep only the last 5 images',
      maxImageCount: 5,
      rulePriority: 2,
      tagStatus: ecr.TagStatus.ANY,
    });

    new cdk.CfnOutput(this, 'RepositoryUri', {
      value: this.repository.repositoryUri,
      exportName: 'IncidentsLcEcrRepositoryUri',
    });

    new cdk.CfnOutput(this, 'RepositoryName', {
      value: this.repository.repositoryName,
      exportName: 'IncidentsLcEcrRepositoryName',
    });
  }
}
