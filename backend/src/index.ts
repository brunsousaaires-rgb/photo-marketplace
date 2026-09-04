import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import path from 'path';
import { env } from './config/env';
import authRoutes from './routes/auth.routes';
import photosRoutes from './routes/photos.routes';
import paymentsRoutes from './routes/payments.routes';
import dashboardRoutes from './routes/dashboard.routes';
import { stripeWebhook } from './controllers/payments.controller';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { asyncHandler } from './middleware/asyncHandler';
import { localRootDir } from './utils/storage';

const app = express();

app.use(helmet({ crossOriginResourcePolicy: false }));
app.use(cors({ origin: env.clientUrl }));
app.use(morgan(env.nodeEnv === 'development' ? 'dev' : 'combined'));

// Stripe precisa do corpo bruto (raw) para validar a assinatura do webhook.
app.post('/api/payments/webhook', express.raw({ type: 'application/json' }), asyncHandler(stripeWebhook));

app.use(express.json({ limit: '2mb' }));

// Previews e thumbnails (com marca d'água) ficam públicos; originais nunca são servidos daqui.
if (env.storageDriver === 'local') {
  app.use('/files/previews', express.static(path.join(localRootDir(), 'previews'), { maxAge: '1d' }));
  app.use('/files/thumbs', express.static(path.join(localRootDir(), 'thumbs'), { maxAge: '1d' }));
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok' }));

app.use('/api/auth', authRoutes);
app.use('/api/photos', photosRoutes);
app.use('/api/payments', paymentsRoutes);
app.use('/api/dashboard', dashboardRoutes);

app.use(notFoundHandler);
app.use(errorHandler);

app.listen(env.port, () => {
  console.log(`Photo Marketplace API rodando em http://localhost:${env.port}`);
});
