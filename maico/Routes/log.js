import { Router } from "express";
import Log from "../Modules/Logs.js";

export const router = Router()

router.get("/", async (req,res) =>{
    try{
        const log = await Log.find()
        if(!log){
            throw new Error("No logs")
        }
        res.status(200).json(log)
    } catch(e){
        res.status(400).json({message: e.message})
    }
})

router.post("/", async (req,res) =>{
    const value = req.body
    const newLog = new Log(value)
    try{
        const log = await newLog.save()
        if(!log){
            throw new Error("something went wrong")
        }
        res.status(200).json(log)
    } catch(e){
        res.status(500).json({message: e.message})
    }
})

export function route(){
    return router
}