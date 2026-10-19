const dotenv = require('dotenv')
dotenv.config({ path: require('path').join(__dirname, 'config', '.env') })

const app = require('./app')
const connectDatabase = require('./config/database')

connectDatabase()

const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} in ${process.env.NODE_ENV} mode`)
})
