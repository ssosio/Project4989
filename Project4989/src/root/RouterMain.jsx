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
import Post from '../board/Post'
import AuctionMain from '../auction/auction_main/AuctionMain'
import AuctionDetail from '../auction/auction_main/AuctionDetail'
import Chat from '../chat/ChatMain'
import Map from '../chat/KakaoMap'
import GoodsDetail from '../board/GoodsDetail'
import CarDetail from '../board/CarDetail'
import Real_estateDtail from '../board/Real_estateDtail'

const RouterMain = () => {
  return (
    <div>
      <Routes>
        <Route element={<MainLayout />} >
          <Route path='/' element={<MainPage />} />
          <Route path='/chat' element={<Chat />} />
          <Route path='/cars' element={<Cars />} />
          <Route path='/goods' element={<Goods />} />
          <Route path='/real-estate' element={<Real_estate />} />
          <Route path='/auction' element={<AuctionMain />} />
          <Route path='/auction/detail/:postId' element={<AuctionDetail />} />
          <Route path='/login' element={<LoginForm />} />
          <Route path='/signup' element={<SignupForm />} />
          <Route path='/board/post' element={<Post />} />
          <Route path='/board/post' element={<Post />} />
          <Route path='/board/GoodsDetail' element={<GoodsDetail />} />
          <Route path='/board/CarDetail' element={<CarDetail />} />
          <Route path='/board/estateDetail' element={<Real_estateDtail />} />
        </Route>
      </Routes>
    </div>
  )
}

export default RouterMain