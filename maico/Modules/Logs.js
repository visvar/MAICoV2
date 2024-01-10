//import { Schema, model } from "mongoose";
import pkg from 'mongoose';
const { Schema, model  } = pkg;

const LogSchema = new Schema({
    date:{
        type: String,
        required:true
    },
    actions:{
        type: String,
        required:true
    }
})

const Log = model("log", LogSchema)

export default Log