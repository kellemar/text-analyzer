import * as cdk from 'aws-cdk-lib'
import { Construct } from 'constructs'
import * as lambda from 'aws-cdk-lib/aws-lambda'
import { NodejsFunction } from 'aws-cdk-lib/aws-lambda-nodejs'
import * as ssm from 'aws-cdk-lib/aws-ssm'
import * as apigw from 'aws-cdk-lib/aws-apigateway'
import * as ec2 from 'aws-cdk-lib/aws-ec2'
import * as rds from 'aws-cdk-lib/aws-rds'
import * as s3 from 'aws-cdk-lib/aws-s3'
import * as path from 'path';

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props)

    // Get ENV VARS from Parameter Store
    const paramPrefix = '/env/production/'
    const openAiKeyParam = ssm.StringParameter.fromStringParameterName(this, 'OpenAIKeyParam', paramPrefix+"open-ai-key")
    const dbUsernameParam = ssm.StringParameter.fromStringParameterName(this, 'dbUsernameParam', paramPrefix+"db-username")
    const dbPasswordParam = ssm.StringParameter.fromStringParameterName(this, 'dbPasswordParam', paramPrefix+"db-password")

    // 1. Create a new VPC that will host both RDS and Lambda
    const vpc = new ec2.Vpc(this, 'AppVpc', {
      maxAzs: 2,
      natGateways: 1,
    })

    // 2. Security group for Lambda
    const lambdaSG = new ec2.SecurityGroup(this, 'LambdaSG', {
      vpc,
      description: 'Security group for Lambda function',
    })

    // 3. Create a new PostgreSQL RDS instance
    const db = new rds.DatabaseInstance(this, 'PostgresDB', {
      vpc,
      engine: rds.DatabaseInstanceEngine.postgres({
        version: rds.PostgresEngineVersion.VER_17_5,
      }),
      instanceType: ec2.InstanceType.of(ec2.InstanceClass.BURSTABLE3, ec2.InstanceSize.MICRO),
      vpcSubnets: { subnetType: ec2.SubnetType.PRIVATE_WITH_EGRESS },
      securityGroups: [lambdaSG],
      allocatedStorage: 20,
      maxAllocatedStorage: 25,
      multiAz: false,
      publiclyAccessible: false,
      credentials: rds.Credentials.fromGeneratedSecret('postgres'),
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      deleteAutomatedBackups: true,
    })

    // Allow Lambda SG to connect to the DB
    db.connections.allowDefaultPortFrom(lambdaSG, 'Lambda access RDS')

    // 4. Create an S3 bucket for file uploads
    const uploadBucket = new s3.Bucket(this, 'UploadBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true,
      blockPublicAccess: s3.BlockPublicAccess.BLOCK_ALL,
    })


    // Layer that only contains the CA bundle
    const rdsCaLayer = new lambda.LayerVersion(this, 'RdsCaLayer', {
      code: lambda.Code.fromAsset(path.join(__dirname, '..', 'layers', 'rds-ca')),
      description: 'RDS root CA bundle',
      compatibleRuntimes: [lambda.Runtime.NODEJS_22_X],
    });
    // 5. Create the Lambda function inside the VPC
    const fn = new NodejsFunction(this, 'lambda', {
      entry: 'lambda/index.ts',
      handler: 'handler',
      runtime: lambda.Runtime.NODEJS_22_X,
      timeout: cdk.Duration.seconds(60),
      vpc,
      layers: [rdsCaLayer],  
      securityGroups: [lambdaSG],
      environment: {
        OPENAI_API_KEY: openAiKeyParam.stringValue,
        DB_HOST: db.dbInstanceEndpointAddress,
        DB_USERNAME: dbUsernameParam.stringValue,
        DB_PASSWORD: dbPasswordParam.stringValue,
        DB_PORT: cdk.Token.asString(db.dbInstanceEndpointPort),
        DB_SECRET_ARN: db.secret!.secretArn,
        FILE_BUCKET: uploadBucket.bucketName,
        RDS_CA_PATH: '/opt/rds-combined-ca-bundle.pem',
      },
    })

    // Grant Lambda permissions
    openAiKeyParam.grantRead(fn)
    db.secret!.grantRead(fn)
    uploadBucket.grantReadWrite(fn)

    // 6. API Gateway to front the Lambda function
    const api = new apigw.LambdaRestApi(this, 'BackendApi', {
      handler: fn,
      proxy: true,
      binaryMediaTypes: ['multipart/form-data', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    })

    new cdk.CfnOutput(this, 'ApiEndpoint', {
      value: api.url ?? 'unknown',
    })

    new cdk.CfnOutput(this, 'S3BucketName', {
      value: uploadBucket.bucketName,
    })

    new cdk.CfnOutput(this, 'DbSecretArn', {
      value: db.secret!.secretArn,
    })
  }
}