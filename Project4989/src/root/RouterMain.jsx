import React from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import MainPage from '../main/MainPage'
import Chat from '../chat/chat'
const RouterMain = () => {
  return (
    <div>
      <Routes>
        <Route element={<MainLayout/>} >
            <Route path='/' element={<MainPage/>}/>
            <Route path='/chat' element={<Chat/>}/>
            
        </Route>

        
      </Routes>
    </div>
  )
}

export default RouterMain
