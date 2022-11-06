const express = require('express')
const mongoose = require('mongoose')
const Messages = require('./dbMessages')
const Pusher = require('pusher')
const { db } = require('./dbMessages')
const cors = require('cors')
require('dotenv').config()

const app = express()
const port = process.env.PORT || 9000

// Middlewares
app.use(express.json())
app.use(cors())

// Pusher 
const pusher = new Pusher({
    appId: "1502410",
    key: "416fefdad2dda197e926",
    secret: "4ac833b8cf82998f5ace",
    cluster: "ap2",
    useTLS: true
  });


// DB Config
mongoose.connect(process.env.DATABASE)

db.once('open',()=>{
    console.log("Database Connected !!")

    const msgCollection = db.collection('messagecontents')
    const changeStream = msgCollection.watch()

    changeStream.on('change',(change) =>{
        console.log(change)

        if(change.operationType === 'insert'){
            const messageDetails = change.fullDocument;
            pusher.trigger('messages','inserted',{
                name:messageDetails.name,
                message:messageDetails.message,
                timestamp:messageDetails.timestamp,
                received:messageDetails.received
            })
        }else{
            console.log("Error triggering pusher")
        }
    })
})

// Api Routes

// @Posting messages
app.post('/messages/new',(req,res)=>{
    const dbMessage = req.body

    Messages.create(dbMessage,(err,data)=>{
        if(err){
            res.status(500).send(err)
        }else{
            res.status(201).send(data)
        }
    })
})

// @Getting all messages
app.get('/messages/sync',(req,res)=>{
    Messages.find((err,data)=>{
        if(err) res.status(500).send(err)
        else{
            res.status(200).send(data)
        }
    })
})

// Listen PORT
app.listen(port,()=> console.log(`Listening to the port ${port}`))