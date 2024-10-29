const express = require('express')
const app = express()
const cors = require('cors')
require('dotenv').config()

const mongoose = require('mongoose');
mongoose.connect(process.env.MONGO_URI)

app.use(express.urlencoded( {extended: true} ))
app.use(cors())
app.use(express.static('public'))
app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html')
});


const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port)
})

// const userSchema = new mongoose.Schema({
//   username: String
// }, {versionKey: false});


const userSchema = new mongoose.Schema({
  username: String,
  exercise: [{description: String, duration: Number, date: Date}],
}, {versionKey: false});

let User = mongoose.model('User', userSchema);

app.post('/api/users', async (req, res) => {
  const user = await User.create({username: req.body.username});
  res.json({username: user.username, _id: user._id});
})

app.get('/api/users', async (req, res) => {
  const result = await User.find().select({exercise: false});
  res.json(result);
})

app.post('/api/users/:_id/exercises', async (req, res) => {
  const date = req.body.date;
  let user = await User.findByIdAndUpdate(req.params._id, 
    {$push: {exercise: {
      description: req.body.description, 
      duration: req.body.duration,
      date: date? new Date(date): new Date(),
    }}},
    {returnDocument: 'after'});

  let last = user.exercise[user.exercise.length - 1];

  res.json({
    username: user.username,
    description: last.description,
    duration: last.duration,
    date: last.date.toDateString(),
    _id: user._id
  });
})


app.get('/api/users/:_id/logs', async (req, res) => {
  const { from, to, limit } = req.query;
  // let dateFilter = {};
  // if (from) {
  //   dateFilter["$gt"] = new Date(from);
  // }
  // if (to) {
  //   dateFilter["$lte"] = new Date(to);
  // }
  // let filter = {_id: req.params._id};
  // if (from || to) {
  //   filter["exercise"] = {date: { $gte: new Date(from)}};
  // }
  let user = await User.findById(req.params._id, {'exercise': 1, 'username': 1});
  //user = user[0];
  if (from) {
    user.exercise = user.exercise.filter(e => e.date >= new Date(from));
  }
  if (to){
    user.exercise = user.exercise.filter( e => e.date <= new Date(to));
  }
  if (limit) {
    user.exercise = user.exercise.slice(0, limit);
  }
  const log = user.exercise.map(e => ({
    description: e.description,
    duration: e.duration,
    date: e.date.toDateString()
  }))
  //console.log(filter);
  res.json({
    username: user.username,
    count: user.exercise.length,
    _id: user._id,
    log: log
  })

})
