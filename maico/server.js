import express from "express"
const app = express()
import mongoose from "mongoose"
import get from "./config.js"
import cors from "cors"
//import pkg from 'body-parser';
//const { bodyParser } = pkg;
import { router } from "./Routes/log.js"

const con = get()

app.use(cors())

app.use(express.json())

mongoose.connect(con.mongoURI,{
    useNewUrlParser:true,
    useCreateIndex:true,
    useUnifiedTopology:true
})
.then(()=>console.log("mongoDB connected"))
.catch((err) => console.log(err))

app.use("/api/logs", router)

app.get("/", (req,res) => res.send("hello world"))

app.listen(con.port, ()=> console.log("Express is running on "+con.port))

