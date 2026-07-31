import axios from 'axios';
import React, { useState } from 'react'
import Markdown from 'react-markdown'

const CreationItem = ({item}) => {

    const [expanded, setExpanded] =useState(false)

    const handleDownload = async (e) => {
        e?.stopPropagation();
        const imageUrl = item?.content;
        if (!imageUrl) return;

        try {
            const response = await axios.get(imageUrl, { responseType: 'blob' });
            const blobUrl = window.URL.createObjectURL(response.data);
            const link = document.createElement('a');
            link.setAttribute("target", "_blank")
            link.href = blobUrl;
            link.download = `processed-image-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(blobUrl);
        } catch (error) {
            console.error('Unable to download the image right now.', error);
        }
    };

  return (
    <div onClick={()=> setExpanded(!expanded)} className='p-4 max-w-5xl text-sm bg-white border-none
    border-b-gray-200 rounded-lg cursor-pointer'>
        <div className='flex justify-between items-center gap-4'>
            <div>
                <h2>{item.prompt}</h2>
                <p className='text-gray-500'>{item.type} - {new Date(item.created_at)
                .toLocaleDateString()}</p>
            </div>
            <button className='bg-[#EFF6FF] border border-[#BFDBFE] text-[#1E40AF]
            px-4 py-1 rounded-full'>{item.type}
            </button>

        </div>
        {
            expanded && (
                <div>
                    {item.type === 'image' ? (
                        <div className='w-2/3'>
                            <img src={item.content} alt="image" className='mt-3 w-full max-w-md' />
                            <button
                                type='button'
                                onClick={(e) => handleDownload(e)}
                                className='w-2/3 flex justify-center items-center gap-2
            bg-linear-to-r from-[#f6ab41] to-[#ff4938] text-white px-4 py-2
            mt-6 text-sm rounded-lg cursor-pointer'>Download Now</button>
                        </div>
                    ): (
                        <div className='mt-3 h-full overflow-y-scroll
                        text-sm text-slate-700'>
                            <div className='reset-tw'>
                                <Markdown>{item.content}</Markdown>
                                
                            </div>
                        </div>
                    )}
                </div>
            )
        }
      
    </div>
  )
}

export default CreationItem
