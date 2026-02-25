import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import { Construct } from 'constructs';

export interface AlbProps {
  readonly vpc: ec2.Vpc;
  readonly albSg: ec2.SecurityGroup;
}

export function buildAlb(
  scope: Construct,
  props: AlbProps,
): elbv2.ApplicationLoadBalancer {
  const { vpc, albSg } = props;

  const alb = new elbv2.ApplicationLoadBalancer(scope, 'IncidentsAlb', {
    vpc,
    internetFacing: true,
    securityGroup: albSg,
    vpcSubnets: { subnetType: ec2.SubnetType.PUBLIC },
    loadBalancerName: 'incidents-alb',
  });

  return alb;
}
