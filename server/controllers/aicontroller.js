import OpenAI from "openai";
import sql from '../config/db.js'
import { clerkClient } from "@clerk/express";

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


// export const generateImage=async(req, res)=>{
//     try{
//         const {userId }=req.auth()
//         const {prompt, length} = req.body
//         const plan = req.plan
//         const free_usage = req.free_usage

//         if(plan !== 'Premium' && free_usage >= 10){
//             return res.json({success: false, 
//                 message: "Free usage limit reached. Please upgrade to premium plan."})
//         } 
       
//         const response = await AI.chat.completions.create({
//     model: "gemini-3.5-flash",
//     messages: [
//         {
//             role: "user",
//             content: prompt,
//         },
//     ], 
//     temperature: 0.7,
//     max_tokens: length ,
// });

// const content = response.choices[0].message.content

// await sql`insert into creations (user_id, prompt, content, type)
//  values (${userId}, ${prompt}, ${content}, 'article')`

//  if(plan !== 'Premium'){
//     await clerkClient.users.updateUserMetadata(userId, {
//         privateMetadata: {
//             free_usage: free_usage + 1
//         }
//     })
//  }

//  res.json({success: true, content})


//     } catch(error){
//         res.json({success: false, message: error.message})
//         console.log(error.message);
        
//     }
// }