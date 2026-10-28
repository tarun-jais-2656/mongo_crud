import express from 'express';
import swaggerUi from 'swagger-ui-express';
import { swaggerDocument } from './docs/swagger.js';
import { errorHandler } from './middlewares/errorHandler.js';
import { requestLogger } from './middlewares/requestLogger.js';
import routes from './routes/index.js';

const app = express();

// Needed so req.ip is correct behind a proxy (used by the login throttle).
app.set('trust proxy', 1);

app.use(express.json({ limit: '1mb' }));
app.use(requestLogger);

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument));

app.use('/api', routes);

app.use(errorHandler.notFound);
app.use(errorHandler.handle);

export default app;
