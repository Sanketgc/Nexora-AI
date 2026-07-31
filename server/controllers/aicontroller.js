import OpenAI from "openai";
import sql from '../config/db.js'
import { clerkClient } from "@clerk/express";
import axios from "axios";
import { v2 as cloudinary } from 'cloudinary'
import fs from "fs";
// import pdf from 'pdf-parse'


const AI = new OpenAI({
    apiKey: process.env.GEMINI_API_KEY,
    baseURL: "https://generativelanguage.googleapis.com/v1beta/openai/"
});

const extractContent = (response) => {
    const content = response?.choices?.[0]?.message?.content;

    if (typeof content === 'string') return content.trim();
    if (Array.isArray(content)) {
        return content.map((part) => typeof part === 'string' ? part : part?.text || '').join('').trim();
    }

    return '';
};

const isRetryableAIError = (error) => {
    const status = error?.status ?? error?.response?.status;
    const message = `${error?.message || ''} ${error?.response?.data?.error?.message || ''}`.toLowerCase();

    return status === 429 || status === 500 || status === 502 || status === 503 || status === 504 ||
        message.includes('rate limit') || message.includes('temporarily unavailable') ||
        message.includes('timeout');
};

const getFriendlyAIMessage = (error) => {
    const status = error?.status ?? error?.response?.status;
    if (status === 429 || `${error?.message || ''}`.toLowerCase().includes('429')) {
        return 'The AI service is temporarily rate-limited. Please try again in a moment.';
    }

    return error?.message || 'Unable to generate content right now.';
};

const createFallbackBlogTitle = (prompt) => {
    const source = typeof prompt === 'string' ? prompt.trim() : '';
    const keywordMatch = source.match(/keyword\s+(.+?)(?:\s+in\s+the\s+category|$)/i);
    const keyword = keywordMatch ? keywordMatch[1].trim() : source;
    const cleanKeyword = keyword.replace(/^generate\s+a\s+blog\s+title\s+for\s+/i, '').trim();

    if (!cleanKeyword) return 'A Fresh Perspective on Your Topic';

    return `1. How ${cleanKeyword} Can Transform Your Strategy\n2. The Future of ${cleanKeyword} You Should Know About\n3. 
    Why ${cleanKeyword} Matters More Than Ever\n4. ${cleanKeyword}: A Practical Guide for Modern Readers`;
};

const createFallbackArticle = (topic, targetWordCount) => {
    const safeTopic = typeof topic === 'string' && topic.trim() ? topic.trim() : 'this topic';
    const targetWords = Number.isFinite(targetWordCount) ? Math.max(250, targetWordCount) : 600;
    const paragraphBase = `The rise of ${safeTopic} has become one of the most important conversations in modern business and technology. It represents a shift in how people solve problems, make decisions, and create value in a highly connected world. As more organizations embrace new tools and ideas, understanding ${safeTopic} becomes essential for staying relevant and competitive. The impact is not limited to one industry because the same principles can be applied across education, healthcare, finance, manufacturing, and everyday life.`;

    const secondParagraph = `One reason ${safeTopic} is so significant is that it helps people move faster while improving accuracy. Instead of relying only on manual effort, teams can use smart systems to gather insights, automate repetitive tasks, and focus on creativity and strategy. In practical terms, this means better services, lower costs, and stronger outcomes. When used thoughtfully, ${safeTopic} can also support personalization, giving users experiences that feel more tailored and responsive to their needs.`;

    const thirdParagraph = `At the same time, ${safeTopic} brings important questions around trust, ethics, and responsibility. Organizations must not only ask what is possible, but also what is fair, safe, and sustainable. Building strong systems requires clear governance, quality data, and human oversight. These factors ensure that the benefits of ${safeTopic} are realized without creating avoidable risks or long-term challenges.`;

    const fourthParagraph = `Looking ahead, the future of ${safeTopic} will likely be shaped by innovation, collaboration, and continuous learning. Those who understand the opportunities and limitations of this space will be better prepared to adapt as the landscape changes. In that sense, ${safeTopic} is not just a trend, but a practical force that is changing how ideas are created, decisions are made, and progress is measured.`;

    const paragraphs = [paragraphBase, secondParagraph, thirdParagraph, fourthParagraph];
    const paragraphText = paragraphs.join('\n\n');

    if (paragraphText.split(/\s+/).filter(Boolean).length >= targetWords) {
        return paragraphText;
    }

    return `${paragraphText}\n\nIn the years ahead, ${safeTopic} will continue to influence how individuals and organizations think about growth, efficiency, and innovation. By approaching it with curiosity, discipline, and responsibility, people can turn its potential into lasting value rather than short-term excitement.`;
};

const callGeminiWithRetry = async ({ prompt, maxTokens, model = 'gemini-2.0-flash-exp' }) => {
    let lastError;

    for (let attempt = 0; attempt < 3; attempt += 1) {
        try {
            return await AI.chat.completions.create({
                model,
                messages: [{ role: 'user', content: prompt }],
                temperature: 0.7,
                max_tokens: maxTokens,
            });
        } catch (error) {
            lastError = error;

            if (!isRetryableAIError(error) || attempt === 2) {
                throw error;
            }

            await new Promise((resolve) => setTimeout(resolve, 1000 * (attempt + 1)));
        }
    }

    throw lastError;
};


export const generateArticle = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { prompt, length } = req.body
        const plan = req.plan
        const free_usage = req.free_usage
        // const newprompt= `Write an article on ${prompt} with length of ${length} words`

        if (plan !== 'Premium' && free_usage >= 10) {
            return res.json({
                success: false,
                message: "Free usage limit reached. Please upgrade to premium plan."
            })
        }

        const requestedLength = Number(length);
        const targetWordCount = Number.isFinite(requestedLength)
            ? Math.min(Math.max(requestedLength, 250), 2200)
            : 800;
        const tokenBudget = Math.max(300, Math.round(targetWordCount * 1.35));
        const articlePrompt = `Write a complete, polished article about the following topic.\n\nTopic: ${prompt || 'this topic'}\n\nRequirements:\n- Write a clear article with an introduction, several body sections, and a conclusion.\n- Aim for approximately ${targetWordCount} words.\n- Use natural paragraphs and readable structure.\n- Do not mention these instructions or return placeholders.`;

        let content = '';

        try {
            const response = await callGeminiWithRetry({
                prompt: articlePrompt,
                maxTokens: tokenBudget,
                model: 'gemini-2.0-flash-exp'
            });
            content = extractContent(response);
        } catch (error) {
            content = createFallbackArticle(prompt, targetWordCount);
        }

        await sql`insert into creations (user_id, prompt, content, type)
 values (${userId}, ${prompt}, ${content}, 'article')`

        if (plan !== 'Premium') {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }

        res.json({ success: true, content: content })


    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message);

    }
}



//BLOGTITLE


export const generateBlogTitle = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { prompt } = req.body
        const plan = req.plan
        const free_usage = req.free_usage

        if (plan !== 'Premium' && free_usage >= 10) {
            return res.json({
                success: false,
                message: "Free usage limit reached. Please upgrade to premium plan."
            })
        }

        const titlePrompt = `Generate 5 catchy blog title options for the following 
        topic.\n\nTopic: ${prompt}\n\nRequirements:\n- Return only 5 distinct title 
        options.\n- Keep them concise, engaging, and suitable for a blog.\n- Put each 
        title on a new line and number them 1 to 5.`;

        let content = '';

        try {
            const response = await callGeminiWithRetry({
                prompt: titlePrompt,
                maxTokens: 140,
                model: 'gemini-2.0-flash-exp'
            });
            content = extractContent(response);
        } catch (error) {
            content = createFallbackBlogTitle(prompt);
        }

        await sql`insert into creations (user_id, prompt, content, type)
 values (${userId}, ${prompt}, ${content}, 'blog-title')`

        if (plan !== 'Premium') {
            await clerkClient.users.updateUserMetadata(userId, {
                privateMetadata: {
                    free_usage: free_usage + 1
                }
            })
        }

        res.json({ success: true, content })


    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message);

    }
}



// GENERATE IMAGE

export const generateImage = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { prompt, publish } = req.body
        const plan = req.plan

        if (plan !== 'Premium') {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscription."
            })
        }


        const form = new FormData();
        form.append('prompt', prompt || 'shot of vaporwave fashion dog in miami');

        const { data } = await axios.post('https://clipdrop-api.co/text-to-image/v1', form, {
            headers: {
                'x-api-key': process.env.CLIPDROP_API_KEY,
            },
            responseType: 'arraybuffer',
        });

        const base64Image = `data:image/png;base64,${Buffer.from(data, 'binary').
            toString('base64')}`

        const { secure_url } = await cloudinary.uploader.upload(base64Image)

        await sql`insert into creations (user_id, prompt, content, type, publish)
    values (${userId}, ${prompt}, ${secure_url}, 'image', ${publish ?? false})`;


        res.json({ success: true, content: secure_url })


    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message);

    }
}


//REMOVEBG

export const removeImageBackground = async (req, res) => {
    try {
        const { userId } = req.auth()
        const image = req.file;
        const plan = req.plan;

        if (plan !== 'Premium') {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscription."
            })
        }

        const { secure_url } = await cloudinary.uploader.upload(image.path, {
            transformation: [{
                effect: "background_removal"
            }]
        })

        await sql`insert into creations (user_id, prompt, content, type)
    values (${userId}, 'Remove background from image', ${secure_url}, 'image')`;


        res.json({ success: true, content: secure_url })


    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message);

    }
}



//Remove OBject

export const removeImageObject = async (req, res) => {
    try {
        const { userId } = req.auth()
        const { object } = req.body;
        const image = req.file;
        const plan = req.plan;

        if (plan !== 'Premium') {
            return res.json({
                success: false,
                message: "This feature is only available for premium subscription."
            })
        }

        const safeObject = String(object || '').trim().replace(/\s+/g, '_');
        const uploadResult = await cloudinary.uploader.upload(image.path, {
            transformation: [{ effect: `gen_remove:${safeObject}` }],
            resource_type: 'image'
        })

        const imageUrl = uploadResult?.secure_url || cloudinary.url(uploadResult?.public_id || '', {
            transformation: [{ effect: `gen_remove:${safeObject}` }],
            resource_type: 'image'
        })

        await sql`insert into creations (user_id, prompt, content, type)
    values (${userId}, ${`Removed ${safeObject} from image`}, ${imageUrl}, 'image')`;


        res.json({ success: true, content: imageUrl })


    } catch (error) {
        res.json({ success: false, message: error.message })
        console.log(error.message);

    }
}



//RESUME REVIEW


// export const resumeReview = async (req, res) => {
//     try {
//         const { userId } = req.auth()
//         const resume = req.file;
//         const plan = req.plan;

//         if (plan !== 'Premium') {
//             return res.json({
//                 success: false,
//                 message: "This feature is only available for premium subscription."
//             })
//         }

//         if (resume.size > 5 * 1024 * 1024) {
//             return res.json({ success: false, message: 'Resume file size exceeds, allowed size (5MB)' })
//         }


//         const dataBuffer = fs.readFileSync(resume.path);
//         const pdfData = await PDFParse(dataBuffer);
//         const resumeText = typeof pdfData?.text === 'string' ? pdfData.text.trim() : '';

//         if (!resumeText) {
//             return res.json({ success: false, message: 'No readable text could be extracted from the uploaded PDF resume.' })
//         }

//         const resumeprompt = `Review the following resume and provide constructive
//        feedback on its strengths, weaknesses, and areas for improvement. Resume 
//        content: \n\n${resumeText}`

//         const response = await AI.chat.completions.create({
//             model: "gemini-3.5-flash",
//             messages: [{ role: "user", content: resumeprompt }],
//             temperature: 0.7,
//             max_tokens: 1000,
//         });

//         const content = extractContent(response)

//         await sql`insert into creations (user_id, prompt, content, type)
//         values (${userId}, 'Review the uploaded resume' , ${content}, 'resume-review')`;


//         res.json({ success: true, content: content })


//     } catch (error) {
//         res.json({ success: false, message: error.message })
//         console.log(error.message);

//     }
// }
