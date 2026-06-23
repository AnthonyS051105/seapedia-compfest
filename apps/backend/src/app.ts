import express, { Application } from 'express'
import cors from 'cors'
import helmet from 'helmet'
import cookieParser from 'cookie-parser'
import rateLimit from 'express-rate-limit'
import swaggerUi from 'swagger-ui-express'
import { swaggerSpec } from './config/swagger'
import { errorHandler } from './middleware/errorHandler'
import authRoutes from './routes/auth.routes'

const app: Application = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(helmet())
app.use(cookieParser())
app.use(express.json({ limit: '10mb' }))

const generalRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
})
app.use(generalRateLimiter)

const authRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
})
app.use('/api/auth', authRateLimiter)

app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
app.get('/api/docs.json', (_req, res) => res.json(swaggerSpec))

app.use('/api/auth', authRoutes)

// Route placeholder — individual routers will be mounted here as they are implemented
// app.use('/api', publicRoutes)
// app.use('/api/buyer', buyerRoutes)
// app.use('/api/seller', sellerRoutes)
// app.use('/api/driver', driverRoutes)
// app.use('/api/admin', adminRoutes)
// app.use('/api/reviews', reviewRoutes)

app.use(errorHandler)

export default app
