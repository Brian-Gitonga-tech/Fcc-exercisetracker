const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()
const mongoose = require('mongoose')
const mongodb = require('mongodb')
const bodyParser = require('body-parser')

mongoose.connect(process.env.DB_URI)

app.use(cors())
app.use(express.static('public'))
app.use(bodyParser.urlencoded({extended : true}))
app.use(bodyParser.json())

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});

const userSchema = new mongoose.Schema({
  username:String
})

const User = mongoose.model("User", userSchema)

const exerciseSchema = new mongoose.Schema({
  user_id: {type: String, require: true},
  duration: Number,
  description: String,
  date: Date
})

const Exercise = mongoose.model("Exercise", exerciseSchema)

app.post('/api/users', (req, res) => {

  const client_username = req.body.username
  const newUser = new User({
    username: client_username
  })

  newUser.save()
  .then(() => {
    return res.json(newUser)
  })
   .catch((error) => {
    console.error(error)
  }) 

})
app.get('/api/users', (req, res) => {
  User.find({__v: 0})
 .then((users) => {
   return res.json(users)
 })
 .catch((error) => {
   console.error(error)
 })
})
app.post('/api/users/:_id/exercises', async (req, res) => {
  const userid = req.params._id
  const duration = req.body.duration
  const date = req.body.date
  const description = req.body.description
  
  try{
   const user = await User.findById(userid);
   if(!user){
    res.send('Cannot find the user')
   }else {
    const exerciseobj = new Exercise({
      user_id: user._id,
      duration: duration,
      description: description,
      date: date ? new Date(date) : new Date()
    })
    const exercise = await exerciseobj.save();
    res.json({
      "_id": user._id,
      "username": user.username,
      "description": exercise.description,
      "duration": exercise.duration,
      "date": new Date(exercise.date).toDateString()
    })
   }
  }
  catch(err) {
   console.log(err)
  }
})

app.route('/api/users/:_id/logs').get( async (req, res) => {
  const userid =  req.params._id
  let limitquery = req.query.limit
  let toquery = req.query.to
  let fromquery = req.query.from

  const user = await User.findById(userid);
  if(!user) {
    res.json("could not find user")
    return;
  }else {
   let dataobj = {}
   if(fromquery){
    dataobj["$gte"] = new Date(fromquery)
   }
   if(toquery) {
    dataobj["$lte"] = new Date(toquery)
   }
   let filter = {
    user_id: userid
   }
   if(fromquery || toquery){
    filter.date = dataobj;
   }
   const exercises = await Exercise.find(filter).limit(+limitquery ?? 500);

   const log = exercises.map(e => ({
      description: e.description,
      duration: e.duration,
      date: e.date.toDateString()
   }))

   res.json({
    "username": user.username,
    "count": exercises.length,
    "_id": user._id,
    log
   })
  }
  

})

  

const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})
