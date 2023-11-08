import { connectDB } from '../services/db.service.js'
import Joi from 'joi'

const USER_COLLECTION_SCHEMA = Joi.object({
  username: Joi.string().alphanum().min(3).max(30).required(),
  password: Joi.string().pattern(new RegExp('^[a-zA-Z0-9]{3,30}$'))
})

const dbConnect = await connectDB()
const db = dbConnect.collection('user')

const validateUserBeforeCreate = async (data) => {
  try {
    const validData = await USER_COLLECTION_SCHEMA.validateAsync(data)
    return validData
  } catch(err) {
    console.log(err)
  }
}

const createUser = async (data) => {
  const validData = await validateUserBeforeCreate(data)
  db.collections
}
