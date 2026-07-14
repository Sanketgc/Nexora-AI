import React, { useState } from 'react'
import {Sparkles} from 'lucide-react'

const WriteArticle =()=>{

    // const articlelength =[
    //     {length:800, text: 'short (500-800 words)'},
    //     {length:1200, text: 'Medium (800-1200 words)'},
    //     {length:1600, text: 'Long (1200+ words)'},
    // ]

    const [selectedlength, setselectedlength] = useState(articlelength(0))
    const [input, setInput] = useState()



    return <>

     <div className='h-full overflow-y-scroll p-6 flex items-start flex-wrap
    gap-4 text-slate-700 ml-70'>

        {/* left col */}
        <form className='w-full max-w-lg p-4 bg-white rounded-lg border
        border-gray-200'>
            <div className='flex items-center gap-3'>
               <Sparkles className='w-6 text-[#4A7AFF]' />
               <h1 className='text-xl font-semibold '>Article Configuration</h1>
            </div>
            <p className='mt-6 text-sm font-medium'>Article Topic</p>
            <input type="text" className='w-full p-2 px-3 mt-2 outline-none
            text-sm rounded-md border border-gray-300' placeholder='The future of artificial intelligence is ... '
            required/>

            <p className='mt-4 text-sm font-medium'>Article Length</p>

        </form>
        
    </div>
    </>
}

export default WriteArticle