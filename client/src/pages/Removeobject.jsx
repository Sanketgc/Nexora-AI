import { useAuth } from '@clerk/react';
import { Scissors, Sparkles } from 'lucide-react'
import React, { useState } from 'react'
import toast from 'react-hot-toast';
import axios from 'axios'

const Removeobject = () => {

    const [input, setInput] = useState('')
    const [object, setObject] = useState('')
    const [loading, setLoading] = useState(false)
    const [content, setContent] = useState('')

    const { getToken } = useAuth()

    // const isRenderableImage = (value) => {
    //     return typeof value === 'string' && /^(https?:\/\/|data:image\/|blob:)/i.test(value)
    // }

    const onSubmitHandler = async (e) => {
        e.preventDefault();
        try {
            setLoading(true)
            if (object.split(' ').length > 1) {
                setLoading(false)
                return toast('please enter only one object name')
            }

            const formData = new FormData()
            formData.append('image', input)
            formData.append('object', object)

            const { data } = await axios.post('/api/ai/remove-image-object', formData,
                { headers: { Authorization: `Bearer ${await getToken()}` } })

                 if (data.success) {
                setContent(data.content)
            } else {
                toast.error(data.message || 'Unable to generate a title right now.')
            }

            // if (data.success && isRenderableImage(data.content)) {
                // setContent(data.content)
            // } else {
                // setContent('')
                // toast.error(data.message || 'Unable to process the image right now.')
            // }

        } catch (error) {
            setContent('')
            toast.error(error.message || 'Unable to process the image right now.')
        } finally {
            setLoading(false)
        }
    }
    return <>
        <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap
    gap-4 text-slate-700 ml-70'>

            <form onSubmit={onSubmitHandler} className='w-full max-w-lg p-4 bg-white rounded-lg border
        border-gray-200'>
                <div className='flex items-center gap-3'>
                    <Sparkles className='w-6 text-[#4a7aff]' />
                    <h1 className='text-xl font-semibold '>Object Removal</h1>
                </div>
                <p className='mt-6 text-sm font-medium'>Upload Image</p>

                <input onChange={(e) => setInput(e.target.files[0])} type="file" accept='image/*'
                    className='w-full p-2 px-3 mt-2 outline-none
            text-sm rounded-md border border-gray-300 text-gray-600'
                    required />

                <p className='text-xs text-gray-500 font-light mt-1'>
                Supports JPG, JPEG, PNG and other image formats </p>

                <p className='mt-6 text-sm font-medium'>Describe object name to remove</p>

                <textarea onChange={(e) => setObject(e.target.value)} value={object} rows={4} type="text" className='w-full p-2 px-3 mt-2 outline-none
            text-sm rounded-md border border-gray-300' placeholder='e.g., watch or spoon, only single object name' required />

                <button disabled={loading} className='w-full flex justify-center items-center gap-2
            bg-linear-to-r from-[#417df6] to-[#8e37eb] text-white px-4 py-2
            mt-6 text-sm rounded-lg cursor-pointer'>
                    {
                        loading ? <span className='w-4 h-4 my-1 rounded-full border-2 border-t-transparent
                animate-spin'></span> : <Scissors className='w-5' />
                    }
                    Remove Object
                </button>
            </form>




            <div className='w-full max-w-lg p-4 bg-white rounded-lg flex flex-col border
        border-gray-200 min-h-96  max-h-150'>
                <div className='flex items-center gap-3'>
                    <Scissors className='w-5 h-5 text-[#ff4938]' />
                    <h1 className='text-xl font-semibold'>Processed Image</h1>
                </div>
                {!content ? (
                    <div className='flex-1 flex justify-center items-center'>
                        <div className='text-sm flex flex-col items-center gap-5 text-gray-400'>
                            <Scissors className='w-9 h-9 ' />
                            <p>Upload an image and click "Remove Object" to get started</p>
                        </div>
                    </div>
                ) : (
                    <div className='mt-3 h-full'>
                        <img src={content} alt="image" />
                    </div>
                )}

            </div>



        </div>
    </>
}

export default Removeobject