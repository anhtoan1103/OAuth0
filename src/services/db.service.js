import { MongoClient } from 'mongodb'
import db from '../configs/db.config.js'

const url = `mongodb+srv://${db.mongoUser}:${db.mongoPassword}@cluster0.wbszohr.mongodb.net/?retryWrites=true&w=majority`

const client = new MongoClient(url)
export const connectDB = async () => {
  try {

    await client.connect()
    const connect = client.db(db.mongoDbName)
    console.log('Connected successfully to db')
    return connect
  } catch(err) {
    console.log(err)
  }
}
