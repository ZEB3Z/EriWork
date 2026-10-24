const mongoose = require('mongoose')

const connectDatabase = () => {
    if (!process.env.MONGO_URI) {
        console.error('MONGO_URI is not set. Add your MongoDB Atlas connection string to backend/.env (or the Render dashboard).')
        process.exit(1)
    }
    mongoose.connect(process.env.MONGO_URI)
        .then((con) => console.log(`MongoDB Database connected with HOST: ${con.connection.host}`))
        .catch((err) => {
            console.error('Could not connect to MongoDB:', err.message)
            console.error('Check MONGO_URI, the database user/password, and Atlas > Network Access (allow 0.0.0.0/0 for Render).')
            process.exit(1)
        })
}

module.exports = connectDatabase
