import 'dotenv/config'
const env = process.env

const db = {
  mongoUser: env.MONGO_USER,
  mongoPassword: env.MONGO_PASSWORD,
  mongoDbName: env.MONGO_DB_NAME
}

export default db