import express from 'express'
import 'dotenv/config'
import { connectDB } from './src/services/db.service.js'
import jwt from 'jsonwebtoken'
import bcrypt from 'bcrypt'
import cookies from 'cookie-parser'
import { userSchema } from './src/models/user.model.js'
const saltRounds = 1;
const db = await connectDB()
db.bsonOptions
const collection = db.collection('user')
const jwtRefresh = db.collection('jwtRefresh')
const findResult = await collection.find({}).toArray()

const app = express()
const PORT = 8080
app.use(express.json())
app.use(cookies())

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

/**
 * Check if access token can be used? if access token still ok, return true. else we will check the refresh token can generate new token
 */
app.post('/isAuth', async (req, res) => {
  // check if accessToken does not expirate
  const accessToken = req.header('accessToken')
  const refreshToken = req.cookies.refreshToken

    
  jwt.verify(accessToken, 'secretkey', (err, decoded) => {
    // if expirate or something wrong with accessToken
    if(err) {
      try {
        const refreshTokens = jwt.verify(refreshToken, 'secretkey')
        return res.redirect(307, '/refresh')
        // use refreshToken to create new accessToken and refreshToken
        // revoke old refresh token and create new access token and new refresh token

        res.json(refreshTokens)
      } catch(err) {
        // revoke all token
        return res.redirect(307, '/login')
      }
    } else {
      return res.status(200).json([true, accessToken])
    }
  })
})

/**
 * todo: create access token and update refresh token if refreshToken is valid, if not revoke all token
 */
app.post('/refresh', async (req, res) => {
  if (req.cookies?.refreshToken) {
    const refreshToken = req.cookies.refreshToken
    const jwtId = refreshToken.split('.')[2]
    const oldRefreshToken = await jwtRefresh.findOne({jwtId: jwtId})
    const currentUser = req.headers['username']

    if (oldRefreshToken) {
      jwt.verify(refreshToken, 'secretkey', async (err, decoded) => {
        if(err) { // remove current refresh token and redirect to login
          await jwtRefresh.findOneAndDelete({jwtId: jwtId})
          return res.status(406).json(err, 'redirect to login')
        } else {
          // update current refresh token and create new access token
          // check the current refresh token is in database?
  
          try {
            const [newRefreshToken, ] = await createRefreshToken(decoded.user)
            let newJwtId = newRefreshToken.split('.')[2]
            await jwtRefresh.updateOne({jwtId: jwtId}, {$set: {jwtId: newJwtId}})
            const [newAccessToken, ] = await createAccessToken(decoded.user)
            res.cookie('refreshToken', newRefreshToken, {
              httpOnly: true,
              sameSite: 'None',
              secure: true,
              maxAge: 24 * 60 * 60 * 1000
            })
            return res.status(200).json(newAccessToken)
          } catch(err) {
            console.log(err)
            return res.status(406).json('user does not exist')
          }
          // create new access token and refresh token
        }
      })
    } else {
      // revoke all refresh token
      await jwtRefresh.deleteMany({username: currentUser})
      res.status(406).json('used old refresh token, revoke all user, redirect to login')
    }

  }
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
      let [accessToken, createAccessErr] = await createAccessToken(username)
      if (createAccessErr) {
        res.status(401).json('user does not exist')
      }
      let [refreshToken, createRefreshErr] = await createRefreshToken(username)
      if (createRefreshErr) {
        res.status(401).json('user does not exist')
      }

      // save the refresh token to database and send access token and refresh token to user cookie
      res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        sameSite: 'None',
        secure: true,
        maxAge: 24 * 60 * 60 * 1000
      })
      console.log(refreshToken)
      const jwtId = refreshToken.split('.')[2]
      try {
        await jwtRefresh.insertOne({username: username, jwtId: jwtId})
      } catch(err) {
        res.status(406).json('error with refreshToken')
      }

      // save refresh token to db to check revoke token

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
