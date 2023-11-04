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
/**
 * access token will be created in 2 case, the first time is when the user login, the second time is when the access token is expirated.
 * 
 * @param {*} username 
 * @returns 
 */
const createAccessToken = async (username) => {
  // check if username is in database, incase 
  const user = await collection.findOne({username: username})
  if(!user) { //if user doesn't exist
    return ['', new Error("User doesn't exist.")]
  }
  const token = jwt.sign({user: username}, 'secretkey', { expiresIn: '1m' })
  return [token, null]
}
const createRefreshToken = async (username) => {
  // check if username is in database, incase 
  const user = await collection.findOne({username: username})
  if(!user) { //if user doesn't exist
    return ['', new Error("User doesn't exist.")]
  }
  const token = jwt.sign({user: username}, 'secretkey', { expiresIn: '10m' })
  return [token, null]
}

app.post('/register', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  const confirmPassword = req.body.confirmPassword
  if (username && password) {
    if (password == confirmPassword) {
      // check if the username is exist
      const user = await collection.findOne({username: username})
      if (!user) { 
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

app.post('/isAuth', async (req, res) => {
  // check if accessToken does not expirate
  const accessToken = req.header('accessToken')
  const refreshToken = req.header('refreshToken')
  console.log(accessToken)

    
  jwt.verify(accessToken, 'secretkey', (err, decoded) => {
    // if expirate or something wrong with accessToken
    if(err) {
      try {
        const refreshTokens = jwt.verify(refreshToken, 'secretkey')
        // use refreshToken to create new accessToken and refreshToken
        res.json(refreshTokens)
      } catch(err) {
        res.status(406).json("Invalid token")
      }
    }
  })
})

app.post('/login', async (req, res) => {
  const username = req.body.username
  const password = req.body.password
  // check if user exist or not
  const user = await collection.findOne({username: username})
  console.log(user)
  if (user) {
    // check password match after hash    
    const match = await bcrypt.compare(password, user.password)
    if (match) {
      // return refresh token and access token
      const [accessToken, error] = await createAccessToken(username)
      const [refreshToken, error1] = await createRefreshToken(username)
      console.log(accessToken)
      console.log(refreshToken)

      // save the refresh token to database and send access token and refresh token to user cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
      })

      res.status(200).json(accessToken)
    }
  else {
    return res.status(406).json({
      message: "Invalid credentials"
    })
  }
  }
  // return user
  // check the hash password with the password
})

app.listen(PORT, () => {
  console.log(`app is listening at http://localhost:${PORT}`)
})
