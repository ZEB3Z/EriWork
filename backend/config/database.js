const mongoose = require('mongoose')

const connectDatabase = () => {
    mongoose.connect(process.env.DB_URI)
        .then((con) => console.log(`MongoDB Database connected with HOST: ${con.connection.host}`))
        .catch((err) => {
            console.error('Could not connect to MongoDB:', err.message)
            console.error('Is MongoDB running? Check DB_URI in backend/config/.env')
            process.exit(1)
        })
}

module.exports = connectDatabase
