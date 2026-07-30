import React, { useEffect, useState } from 'react'
import { useAuth, useUser } from '@clerk/react'
import { Heart } from 'lucide-react'
import axios from 'axios'
import toast from 'react-hot-toast';


const Community = () => {

    const [creations, setcreations] = useState([])
    const { user } = useUser()
    const [loading, setloading] = useState(true)

    const { getToken } = useAuth()

    const fetchCraetions = async () => {
        try {
            const { data } = await axios.get('/api/user/get-published-creations',
                { headers: { Authorization: `Bearer ${await getToken()}` } })

            if (data.success) {
                setcreations(Array.isArray(data.creations) ? data.creations : [])
            } else{
                toast.error(data.message)
            }
        } catch (err) {
            toast.error(err.message)
        } finally {
            setloading(false)
        }
    }

    const imageLikeToggle= async (id)=>{
        try {
              const { data } = await axios.post('/api/user/toggle-like-creations', {id},
                { headers: { Authorization: `Bearer ${await getToken()}` } })

                if(data.success){
                    toast.success(data.message)
                    await fetchCraetions()
                } else{
                    toast.error(data.message)
                }
            
        } catch (error) {
            toast.error(error.message)
        }
    }

    useEffect(() => {
        if (user?.id) {
            fetchCraetions()
        }
    }, [user?.id])


    return !loading ? (
        <div className='flex-1 h-full flex flex-col gap-4 p-6 ml-70'>
            Creations
            <div className='bg-white h-full w-full rounded-xl overflow-y-scroll'>
                {loading ? (
                    <div className='p-6 text-sm text-gray-500'>Loading creations...</div>
                ) : creations.length === 0 ? (
                    <div className='p-6 text-sm text-gray-500'>No published creations yet.</div>
                ) : creations.map((creation, index) => {
                    const likes = Array.isArray(creation.likes) ? creation.likes : []

                    return (
                        <div key={index} className='relative group inline-block pl-3 pt-3 w-full
                    sm:max-w-1/2 lg:max-w-1/3'>
                            <img src={creation.content} alt="image" className='w-full
                        h-full object-cover rounded-lg'/>

                            <div className='absolute bottom-0 top-0 right-0 left-3 flex gap-2
                        items-end justify-end group-hover:justify-between p-3 
                        group-hover:bg-linear-to-b from-transparent to-black/80 text-white
                        rounded-lg'>
                                <p className='text-sm hidden group-hover:block'>{creation.prompt}</p>
                                <div className='flex gap-1 items-center'>
                                    <p>{creation.likes.length}</p>
                                    <Heart onClick={()=> imageLikeToggle(creation.id)} className={`min-w-5 h-5 hover:scale-110 cursor-pointer
                                   ${likes.includes(user?.id) ? 'fill-red-500' : 'text-white'} `} />
                                </div>
                            </div>
                        </div>
                    )
                })}
            </div>

        </div>
    ) : (
        <div className='flex justify-center items-center h-full'>
            <span className='w-10 h-10 my-1 rounded-full border-3 border-primary
            border-t-transparent animate-spin'></span>
        </div>
    )
}

export default Community