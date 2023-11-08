import { connectDB } from '../services/db.service.js'

const db = await connectDB()
db.createCollection("user", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "User Object Validation",
      required: ["username", "password"],
      properties: {
        username: {
          bsonType: "string",
          description: "'username' must be a string and is required"
        },
        password: {
          bsonType: "string",
          description: "'password' must be a string and is required"
        }
      }
    }
  }
})

export const userSchema = ["user", {
  validator: {
    $jsonSchema: {
      bsonType: "object",
      title: "User Object Validation",
      required: ["username", "password"],
      properties: {
        username: {
          bsonType: "string",
          description: "'username' must be a string and is required"
        },
        password: {
          bsonType: "string",
          description: "'password' must be a string and is required"
        }
      }
    }
  }
}]
