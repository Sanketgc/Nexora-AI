import OpenAI from "openai";
import sql from '../config/db.js'
import { clerkClient } from "@clerk/express";
import axios from "axios";
import {v2 as cloudinary} from 'cloudinary' 

const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});



export const generateArticle = async(req, res)=>{
    try{
        const {userId }=req.auth()
        const {prompt, length} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !== 'Premium' && free_usage >= 10){
            return res.json({success: false, 
                message: "Free usage limit reached. Please upgrade to premium plan."})
        } 
       
        const response = await AI.chat.completions.create({
    model: "gemini-3.5-flash",
    messages: [
        {
            role: "user",
            content: prompt,
        },
    ], 
    temperature: 0.7,
    max_tokens: length ,
});

const content = response.choices[0].message.content

await sql`insert into creations (user_id, prompt, content, type)
 values (${userId}, ${prompt}, ${content}, 'article')`

 if(plan !== 'Premium'){
    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            free_usage: free_usage + 1
        }
    })
 }

 res.json({success: true, content})


    } catch(error){
        res.json({success: false, message: error.message})
        console.log(error.message);
        
    }
}


export const generateBlogTitle = async(req, res)=>{
    try{
        const {userId }=req.auth()
        const {prompt} = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if(plan !== 'Premium' && free_usage >= 10){
            return res.json({success: false, 
                message: "Free usage limit reached. Please upgrade to premium plan."})
        } 
       
        const response = await AI.chat.completions.create({
    model: "gemini-3.5-flash",
    messages: [{  role: "user", content: prompt,}, ], 
    temperature: 0.7,
    max_tokens: 100 ,
});

const content = response.choices[0].message.content

await sql`insert into creations (user_id, prompt, content, type)
 values (${userId}, ${prompt}, ${content}, 'blog-title')`

 if(plan !== 'Premium'){
    await clerkClient.users.updateUserMetadata(userId, {
        privateMetadata: {
            free_usage: free_usage + 1
        }
    })
 }

 res.json({success: true, content})


    } catch(error){
        res.json({success: false, message: error.message})
        console.log(error.message);
        
    }
}



// GENERATE IMAGE

export const generateImage = async(req, res)=>{
    try{
        const {userId }=req.auth()
        const {prompt, publish} = req.body
        const plan = req.plan

        if(plan !== 'Premium'){
            return res.json({success: false, 
                message: "This feature is only available for premium subscription."})
        } 


        const form = new FormData()
        form.append('prompt', 'shot of vaporwave fashion dog in miami')
        const {data} =await axios.post("'https://clipdrop-api.co/text-to-image/v1'", FormData, {
             headers: {'x-api-key': process.env.CLIPDROP_API_KEY},
             responseType: "arraybuffer"
        })

        const base64Image= `data:image/png;base64,${Buffer.from(data, 'binary').
            toString('base64')}`

       const {secure_url} = await cloudinary.uploader.upload(base64Image)

        await sql`insert into creations (user_id, prompt, content, type, publish)
    values (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;


 res.json({success: true, content: secure_url})


    } catch(error){
        res.json({success: false, message: error.message})
        console.log(error.message);
        
    }
}

