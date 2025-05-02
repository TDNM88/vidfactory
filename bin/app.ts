import { App } from 'aws-cdk-lib';
import { TdnmStack } from '../lib/tdnm-stack';

const app = new App();
new TdnmStack(app, 'TdnmStack');

app.synth();
