const path = require('path')
// Reads backend/.env locally. On Render the variables come from the dashboard
// and this simply finds no file, which is fine.
require('dotenv').config({ path: path.join(__dirname, '.env'), quiet: true })

const app = require('./app')
const connectDatabase = require('./config/database')

connectDatabase()

// Render assigns the port through process.env.PORT.
const PORT = process.env.PORT || 4001
app.listen(PORT, () => {
    console.log(`Server started on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`)
})
