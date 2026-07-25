import express from 'express'
import cors from 'cors'
import 'dotenv/config'
import { clerkMiddleware } from '@clerk/express'
import { auth } from './middlewares/auth.js'
import { generateArticle} from './controllers/aicontroller.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(clerkMiddleware())

app.get('/', (req, res) => (res.send("server is live")))

// app.use(auth)

app.post('/api/generate-article', generateArticle)
// app.post('/api/generate-image', generateImage)

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log("app is listening", PORT)
})