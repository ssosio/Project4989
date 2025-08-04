import React from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import MainPage from '../main/MainPage'
import Chat from '../chat/chat'
import LoginForm from '../login/LoginForm'
import SignupForm from '../login/SignupForm'
const RouterMain = () => {
  return (
    <div>
      <Routes>
        <Route element={<MainLayout/>} >
            <Route path='/' element={<MainPage/>}/>
            <Route path='/chat' element={<Chat/>}/>
            <Route path='/login' element={<LoginForm/>}/>
            <Route path='/signup' element={<SignupForm/>}/>
            
        </Route>

        
      </Routes>
    </div>
  )
}

export default RouterMain
