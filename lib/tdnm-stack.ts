import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ec2 from 'aws-cdk-lib/aws-ec2';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as acm from 'aws-cdk-lib/aws-certificatemanager';

export class TdnmStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create VPC
    const vpc = new ec2.Vpc(this, 'TdnmVpc', {
      maxAzs: 2,
      subnetConfiguration: [
        {
          cidrMask: 24,
          name: 'public-subnet',
          subnetType: ec2.SubnetType.PUBLIC,
        },
        {
          cidrMask: 24,
          name: 'private-subnet',
          subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS,
        },
      ],
    });

    // Create ECR repository
    const ecrRepository = new ecr.Repository(this, 'TdnmRepository', {
      repositoryName: 'tdnm-app',
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Create ECS cluster
    const cluster = new ecs.Cluster(this, 'TdnmCluster', {
      vpc,
      containerInsights: true,
    });

    // Create ECS task definition
    const taskDefinition = new ecs.FargateTaskDefinition(this, 'TdnmTask', {
      cpu: 2048,
      memoryLimitMiB: 8192,
      runtimePlatform: {
        operatingSystemFamily: ecs.OperatingSystemFamily.LINUX,
      },
    });

    // Add container to task definition
    taskDefinition.addContainer('TdnmContainer', {
      image: ecs.ContainerImage.fromEcrRepository(ecrRepository),
      logging: ecs.LogDrivers.awsLogs({
        streamPrefix: 'tdnm-app',
      }),
      environment: {
        NODE_ENV: 'production',
        DATABASE_URL: process.env.DATABASE_URL || '',
        NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || '',
        NEXTAUTH_URL: process.env.NEXTAUTH_URL || '',
        OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY || '',
        PEXELS_API_KEY: process.env.PEXELS_API_KEY || '',
        GOOGLE_API_KEY: process.env.GOOGLE_API_KEY || '',
      },
      portMappings: [{ containerPort: 3000 }],
    });

    // Create ECS service
    const service = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'TdnmService', {
      cluster,
      taskDefinition,
      desiredCount: 2,
      publicLoadBalancer: true,
      listenerPort: 80,
      domainName: 'tdnm-app.com',
      domainZone: route53.HostedZone.fromLookup(this, 'HostedZone', {
        domainName: 'tdnm-app.com',
      }),
      certificate: acm.Certificate.fromCertificateArn(this, 'Certificate', process.env.CERTIFICATE_ARN || ''),
    });

    // Add auto-scaling
    service.service.autoScaleTaskCount({
      minCapacity: 2,
      maxCapacity: 5,
    }).scaleOnCpuUtilization('CpuScaling', {
      targetUtilizationPercent: 75,
    });
  }
}
