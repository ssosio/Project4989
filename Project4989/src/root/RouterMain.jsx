import React from 'react'
import { Route, Routes } from 'react-router-dom'
import MainLayout from '../layout/MainLayout'
import MainPage from '../main/MainPage'
import Goods from '../board/Goods'
import Cars from '../board/Cars'
import Real_estate from '../board/Real_estate'
import Auction from '../board/Auction'
import LoginForm from '../login/LoginForm'
import SignupForm from '../login/SignupForm'
import KakaoMap from '../chat/KakaoMap'

const RouterMain = () => {
  return (
    <div>
      <Routes>
        <Route element={<MainLayout />} >
          <Route path='/' element={<MainPage />} />
          <Route path='/cars' element={<Cars />} />
          <Route path='/goods' element={<Goods />} />
          <Route path='/real-estate' element={<Real_estate />} />
          <Route path='/auction' element={<Auction />} />
          <Route path='/login' element={<LoginForm />} />
          <Route path='/signup' element={<SignupForm />} />
          <Route path='/map' element={<KakaoMap />} />
        </Route>


      </Routes>
    </div>
  )
}

export default RouterMain
