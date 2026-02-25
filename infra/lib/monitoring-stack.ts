import * as cdk from 'aws-cdk-lib';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as cloudwatchActions from 'aws-cdk-lib/aws-cloudwatch-actions';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as elbv2 from 'aws-cdk-lib/aws-elasticloadbalancingv2';
import * as sns from 'aws-cdk-lib/aws-sns';
import * as snsSubscriptions from 'aws-cdk-lib/aws-sns-subscriptions';
import { Construct } from 'constructs';

export interface MonitoringStackProps extends cdk.StackProps {
  readonly fargateService: ecs.FargateService;
  readonly alb: elbv2.ApplicationLoadBalancer;
  readonly alertEmail?: string;
}

export class MonitoringStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: MonitoringStackProps) {
    super(scope, id, props);

    const { fargateService, alb, alertEmail } = props;

    const alertTopic = new sns.Topic(this, 'IncidentsAlertTopic', {
      topicName: 'incidents-alerts',
      displayName: 'Incident Portal Alerts',
    });

    if (alertEmail) {
      alertTopic.addSubscription(
        new snsSubscriptions.EmailSubscription(alertEmail),
      );
    }

    const snsAction = new cloudwatchActions.SnsAction(alertTopic);

    const alb5xxAlarm = new cloudwatch.Alarm(this, 'Alb5xxAlarm', {
      alarmName: 'incidents-alb-5xx-rate',
      alarmDescription: 'ALB 5XX error rate exceeds 5% over 5 minutes',
      metric: new cloudwatch.MathExpression({
        expression: '(m1 / m2) * 100',
        usingMetrics: {
          m1: alb.metrics.httpCodeElb(elbv2.HttpCodeElb.ELB_5XX_COUNT, { period: cdk.Duration.minutes(5) }),
          m2: alb.metrics.requestCount({ period: cdk.Duration.minutes(5) }),
        },
        period: cdk.Duration.minutes(5),
        label: 'ALB 5XX Rate (%)',
      }),
      threshold: 5,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    alb5xxAlarm.addAlarmAction(snsAction);

    const cpuAlarm = new cloudwatch.Alarm(this, 'EcsCpuAlarm', {
      alarmName: 'incidents-ecs-cpu-high',
      alarmDescription: 'ECS CPU utilization exceeds 80% over 5 minutes',
      metric: fargateService.metricCpuUtilization({ period: cdk.Duration.minutes(5) }),
      threshold: 80,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    cpuAlarm.addAlarmAction(snsAction);

    const memoryAlarm = new cloudwatch.Alarm(this, 'EcsMemoryAlarm', {
      alarmName: 'incidents-ecs-memory-high',
      alarmDescription: 'ECS Memory utilization exceeds 80% over 5 minutes',
      metric: fargateService.metricMemoryUtilization({ period: cdk.Duration.minutes(5) }),
      threshold: 80,
      evaluationPeriods: 1,
      comparisonOperator: cloudwatch.ComparisonOperator.GREATER_THAN_THRESHOLD,
      treatMissingData: cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    memoryAlarm.addAlarmAction(snsAction);

    const dashboard = new cloudwatch.Dashboard(this, 'IncidentsDashboard', {
      dashboardName: 'incidents-portal',
    });

    dashboard.addWidgets(
      new cloudwatch.AlarmWidget({ alarm: alb5xxAlarm, title: 'ALB 5XX Rate', width: 8 }),
      new cloudwatch.AlarmWidget({ alarm: cpuAlarm, title: 'ECS CPU Utilization', width: 8 }),
      new cloudwatch.AlarmWidget({ alarm: memoryAlarm, title: 'ECS Memory Utilization', width: 8 }),
    );

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: 'ALB Request Count',
        left: [alb.metrics.requestCount({ period: cdk.Duration.minutes(1) })],
        width: 12,
      }),
      new cloudwatch.GraphWidget({
        title: 'ALB Response Time',
        left: [alb.metrics.targetResponseTime({ period: cdk.Duration.minutes(1) })],
        width: 12,
      }),
    );

    new cdk.CfnOutput(this, 'AlertTopicArn', {
      value: alertTopic.topicArn,
      exportName: 'IncidentsAlertTopicArn',
    });

    new cdk.CfnOutput(this, 'DashboardUrl', {
      value: `https://${this.region}.console.aws.amazon.com/cloudwatch/home#dashboards:name=incidents-portal`,
      exportName: 'IncidentsDashboardUrl',
    });
  }
}
