import dotenv from 'dotenv'
dotenv.config()

import app from './app'
import { authService } from './services/auth.service'

const PORT = process.env.PORT ?? 3001

authService
  .cleanupExpiredRefreshTokens()
  .then((count) => {
    if (count > 0) {
      console.log(`Cleaned up ${count} expired refresh token(s)`)
    }
  })
  .catch((err) => {
    console.error('Failed to clean up expired refresh tokens on startup:', err)
  })

app.listen(PORT, () => {
  console.log(`SEAPEDIA backend listening on port ${PORT}`)
})
