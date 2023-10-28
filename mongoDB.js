import 'dotenv/config'
import { MongoClient } from 'mongodb'
const url = `mongodb+srv://${process.env.MONGO_USER}:${process.env.MONGO_PASSWORD}@cluster0.wbszohr.mongodb.net/?retryWrites=true&w=majority`
const client = new MongoClient(url)
const dbName = 'OAuth'
export const connectDB = async () => {
  await client.connect()
  console.log('Connected successfully to db')
  const db = client.db(dbName)
  return db
}
