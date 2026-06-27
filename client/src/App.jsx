import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import WriteArticle from './pages/WriteArticle'
import BlogTitle from './pages/BlogTitle'

const App =( ) =>{
    return<>
    <div>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/ai' element={ <Layout/>} >
                <Route index element={<Dashboard />} />
                <Route path="write-article" element={<WriteArticle />} />
                <Route path="blog-title" element={<BlogTitle />} />
            </Route>

           
        </Routes>
    </div>
    </>
}

export default App6;