import express from 'express'
import 'dotenv/config'
import { connectDB } from './mongoDB.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
const saltRounds = 1;
const db = await connectDB()
const collection = db.collection('user')
const findResult = await collection.find({}).toArray()

const app = express()
const PORT = 8080
app.use(express.json())

app.get('/', (req, res) => {
  res.send('hello world')
})

app.post('/register', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  if (username && password) {
    if (password == confirmPassword) {
      // check if the username is exist
      const user = await collection.find({username: username}).toArray()
      if (!user.length) { 
        bcrypt.genSalt(saltRounds, function(err, salt) {
          if (err) throw err
          bcrypt.hash(password, salt, async (err, hash) => {
            if (err) throw err
            // Store hash in your password DB.
            await collection.insertOne({ username: username, password: hash})
          })
        })
        res.status(200).json('ok user')
      } else {
        res.status(400).json('user existed')
      }
    } 
    else {
      res.status(400).json('confirm password is not matched')
    }
  } 
  else {
    res.status(404).json('invalid username or password')
  }
})

app.post('/login', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const jwtToken = req.get('token')
  // check if user exist or not
  const user = await collection.findOne({username: username})
  console.log(user)
  if (user) {
    // check password match after hash    
    const match = await bcrypt.compare(password, user.password)
    if (match) {
      // create a jwt to save the session of user
      if (!jwtToken) {
        const token = jwt.sign({user: username}, 'secretkey', { expiresIn: 60 })
        res.status(200).json({rs:'matched', token: token, message: 'login without jwt'})
      } else {
        jwt.verify(jwtToken, 'secretkey', (err, decoded) => {
          // if there's some error with the jwt
          if (err) res.status(400).json(err)
          if (decoded?.user == username) res.status(200).json('login with jwt')
        })
      }
    }
  }
  // return user
  // check the hash password with the password
})

app.listen(PORT, () => {
  console.log(`app is listening at http://localhost:${PORT}`)
})
