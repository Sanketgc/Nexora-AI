import sql from "../config/db.js"

export const getUsercCreations = async(req, res)=>{
    try{
        const {userId}= req.auth()
        const creations=  await sql `select * from creations where user_id = ${userId}
        order by created_at DESC`

        res.json({success: true, message: creations})
    } catch(error){
         res.json({success: false, message: error.message})
    }
}



export const getPublishedCreations = async(req, res)=>{
    try{
        const creations=  await sql `select * from creations where
        publish = true order by created_at DESC`

        res.json({success: true, creations})
    } catch(error){
         res.json({success: false, message: error.message})
    }
}


export const toggleLikeCreation = async(req, res)=>{
    try{
        const {userId} = req.auth
        const {id}= req.body

        const [creation]= await sql `select * from creations where id=${id}`

        if(!creation){
            return res.json({success: false, message: "creation not found"})
        }

        const currentLikes= creation.likes;
        const userIdstr = userId.toString();
        let updatedlikes;
        let message;

        if(currentLikes.includes(userIdstr)){
            updatedlikes = currentLikes.filter((user)=> user != userIdstr);
            message = 'creations unliked'
        } else{
            updatedlikes= [...currentLikes, userIdstr]
            message = 'Creations Liked'
        }

        const formattedarray= `{${updatedlikes.json(',')}}`

        await sql `update creations set likes= ${formattedarray}:text[]
        where id= ${id}`

        res.json({success: true, message})
    } catch(error){
         res.json({success: false, message: error.message})
    }
}