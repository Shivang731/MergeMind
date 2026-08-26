import 'dotenv/config';
import 'express-async-errors';
import express from 'express';
import path from 'path';
import { dashboardRouter } from './api/dashboardRouter';
import { reviewRouter } from './review/reviewRouter';
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

app.use((_req, res, next) => {
  res.header('Access-Control-Allow-Origin', process.env.DASHBOARD_ORIGIN || '*');
  res.header('Access-Control-Allow-Headers', 'Content-Type, X-MergeMind-Secret');
  res.header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  next();
});

app.options('*', (_req, res) => res.sendStatus(204));
app.use(express.static(path.join(__dirname, '..', '..')));
app.use('/api', dashboardRouter);
app.use('/review', reviewRouter);
app.use('/webhook', webhookRouter);

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', service: 'MergeMind MVP', timestamp: new Date().toISOString() });
});

app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`\nMergeMind MVP running on port ${PORT}`);
  console.log(`   Dashboard:        http://localhost:${PORT}/`);
  console.log(`   Webhook endpoint: POST http://localhost:${PORT}/webhook`);
  console.log(`   Review endpoint:  POST http://localhost:${PORT}/review/analyze`);
  console.log(`   Health check:     GET  http://localhost:${PORT}/health\n`);
});

export default app;
