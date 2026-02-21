import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import { webhookRouter } from './webhook/webhookRouter';
import { errorHandler } from './utils/errorHandler';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(
  express.json({
    verify: (req: any, _res, buf) => {
      req.rawBody = buf;
    },
  })
);

app.use('/webhook', webhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MergeMind Dev1', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\n🚀 MergeMind Dev1 running on port ${PORT}`);
  console.log(`   Webhook endpoint: POST http://localhost:${PORT}/webhook`);
  console.log(`   Health check:     GET  http://localhost:${PORT}/health\n`);
});

export default app;
