import path from 'node:path';
import { fileURLToPath } from 'node:url';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config.js';
import authRoutes from './routes/auth.js';
import progressRoutes from './routes/progress.js';
import adminRoutes from './routes/admin.js';
import { errorHandler, notFound } from './middleware/errors.js';

const app=express();
const root=path.dirname(fileURLToPath(import.meta.url));

app.set('trust proxy',1);
app.use(helmet({contentSecurityPolicy:{directives:{defaultSrc:["'self'"],scriptSrc:["'self'","'unsafe-inline'"],styleSrc:["'self'","'unsafe-inline'"],connectSrc:["'self'"]}}}));
app.use(cors({origin(origin,callback){if(!origin||config.corsOrigins.includes(origin)) return callback(null,true);callback(new Error('Origin is not allowed'));},credentials:false}));
app.use(express.json({limit:'256kb'}));
app.use(rateLimit({windowMs:15*60*1000,limit:300,standardHeaders:'draft-8',legacyHeaders:false}));
app.use('/api/auth',rateLimit({windowMs:15*60*1000,limit:30}),authRoutes);
app.use('/api/progress',progressRoutes);
app.use('/api/admin',adminRoutes);
app.get('/api/health',(req,res)=>res.json({status:'ok',service:'english-edu-api',time:new Date().toISOString()}));
app.use('/admin',express.static(path.join(root,'public/admin')));
app.get('/',(req,res)=>res.json({name:'English Edu API',version:'1.0.0',health:'/api/health',admin:'/admin/'}));
app.use(notFound);
app.use(errorHandler);

export default app;
