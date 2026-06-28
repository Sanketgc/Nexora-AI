import React from "react";
import { Route, Routes } from "react-router-dom";
import Home from './pages/Home'
import Layout from './pages/Layout'
import Dashboard from './pages/Dashboard'
import WriteArticle from './pages/WriteArticle'
import BlogTitle from './pages/BlogTitle'
import Generateimage from './pages/Generateimage'
import Removebackground from './pages/Removebg'
import RemoveObject from './pages/Removeobject'
import ReviewResume from './pages/ReviewResume'
import { Show, SignInButton, SignUpButton, UserButton } from '@clerk/react'

const App =( ) =>{
    return<>
     <header>
        <Show when="signed-out">
          <SignInButton />
          <SignUpButton />
        </Show>
        <Show when="signed-in">
          <UserButton />
        </Show>
      </header>
    <div>
        <Routes>
            <Route path="/" element={<Home />} />
            <Route path='/ai' element={ <Layout/>} >
                <Route index element={<Dashboard />} />
                <Route path="write-article" element={<WriteArticle />} />
                <Route path="blog-title" element={<BlogTitle />} />
                <Route path="generate-images" element={<Generateimage />} />
                <Route path="remove-background" element={<Removebackground />} />
                <Route path="remove-object" element={<RemoveObject />} />
                <Route path="review-resume" element={<ReviewResume />} />
            </Route> 
        </Routes>
    </div>
    </>
}

export default App;