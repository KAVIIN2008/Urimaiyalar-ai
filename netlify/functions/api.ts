import serverless from 'serverless-http';
import { app } from '../../src/expressApp';

export const handler = serverless(app);
