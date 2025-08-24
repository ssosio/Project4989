import React, { useState, useContext } from 'react';
import {
  Box,
  Typography,
  Container,
  Paper,
  Tabs,
  Tab
} from '@mui/material';
import {
  People as PeopleIcon,
  PostAdd as PostAddIcon,
  Chat as ChatIcon,
  Report as ReportIcon,
  Category as CategoryIcon,
  Dashboard as DashboardIcon,
  Settings as SettingsIcon,
  Feedback as FeedbackIcon,
  LocationOn as LocationOnIcon
} from '@mui/icons-material';
import { AuthContext } from '../context/AuthContext';

// 분리된 컴포넌트들 import
import StatsCards from '../components/admin/StatsCards';
import DashboardTab from '../components/admin/DashboardTab';
import UserManagementTab from '../components/admin/UserManagementTab';
import PostManagementTab from '../components/admin/PostManagementTab';
import ReportManagementTab from '../components/admin/ReportManagementTab';
import CategoryManagementTab from '../components/admin/CategoryManagementTab';
import SystemSettingsTab from '../components/admin/SystemSettingsTab';
import PostDetailModal from '../components/admin/PostDetailModal';
import UserDetailModal from '../components/admin/UserDetailModal';
import ChatReportManagementTab from '../components/admin/ChatReportManagementTab';
import AddressManagementTab from '../components/admin/AddressManagementTab';

// 탭 패널 컴포넌트
function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const AdminPage = () => {
  const { userInfo } = useContext(AuthContext);
  const [tabValue, setTabValue] = useState(0);
  const [selectedPost, setSelectedPost] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [isPostDetailOpen, setIsPostDetailOpen] = useState(false);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);

  // 더미 데이터 (실제로는 API에서 가져올 데이터)
  const [stats] = useState({
    totalUsers: 1250,
    totalPosts: 3420,
    totalReports: 23,
    activeChats: 156
  });

  const [recentPosts] = useState([
    { id: 1, title: '아이폰 14 Pro 팝니다', type: '중고거래', author: 'user123', status: 'active', reports: 0 },
    { id: 2, title: '현대 아반떼 2020년식', type: '자동차', author: 'caruser', status: 'active', reports: 1 },
    { id: 3, title: '강남구 원룸 월세', type: '부동산', author: 'realtor', status: 'pending', reports: 0 },
    { id: 4, title: '명품 가방 경매', type: '경매', author: 'auctionuser', status: 'active', reports: 2 }
  ]);

  const [recentUsers] = useState([
    { id: 1, nickname: 'user123', email: 'user123@email.com', status: 'active', joinDate: '2024-01-15', posts: 5 },
    { id: 2, nickname: 'caruser', email: 'car@email.com', status: 'active', joinDate: '2024-01-10', posts: 12 },
    { id: 3, nickname: 'realtor', email: 'realtor@email.com', status: 'suspended', joinDate: '2024-01-05', posts: 8 },
    { id: 4, nickname: 'auctionuser', email: 'auction@email.com', status: 'active', joinDate: '2024-01-01', posts: 3 }
  ]);

  const [reports] = useState([
    { id: 1, postId: 2, reporter: 'user456', reason: '허위 정보', status: 'pending', date: '2024-01-20' },
    { id: 2, postId: 4, reporter: 'user789', reason: '부적절한 내용', status: 'investigating', date: '2024-01-19' },
    { id: 3, postId: 4, reporter: 'user101', reason: '스팸', status: 'resolved', date: '2024-01-18' }
  ]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePostDetail = (post) => {
    setSelectedPost(post);
    setIsPostDetailOpen(true);
  };

  const handleUserDetail = (user) => {
    setSelectedUser(user);
    setIsUserDetailOpen(true);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'pending': return 'warning';
      case 'suspended': return 'error';
      case 'investigating': return 'info';
      case 'resolved': return 'default';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'active': return '활성';
      case 'pending': return '대기중';
      case 'suspended': return '정지';
      case 'investigating': return '조사중';
      case 'resolved': return '해결됨';
      default: return status;
    }
  };

  return (
    <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
      {/* 헤더 */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom sx={{ color: '#2E3C2E', fontWeight: 'bold' }}>
          🛡️ 관리자 페이지
        </Typography>
        <Typography variant="h6" color="text.secondary" sx={{ mb: 3 }}>
          {userInfo?.nickname}님, 환영합니다! 시스템을 관리하고 모니터링하세요.
        </Typography>
      </Box>

      {/* 통계 카드 */}
      <StatsCards stats={stats} />

      {/* 메인 컨텐츠 */}
      <Paper elevation={3} sx={{ borderRadius: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="admin tabs">
            <Tab icon={<DashboardIcon />} label="대시보드" />
            <Tab icon={<PeopleIcon />} label="회원 관리" />
            <Tab icon={<PostAddIcon />} label="게시글 관리" />
            <Tab icon={<ReportIcon />} label="게시글 신고 관리" />
            <Tab icon={<FeedbackIcon />} label="채팅 신고 관리" />
            <Tab icon={<CategoryIcon />} label="카테고리 관리" />
            <Tab icon={<SettingsIcon />} label="시스템 설정" />
            <Tab icon={<LocationOnIcon />} label="주소 관리" />
          </Tabs>
        </Box>

        {/* 대시보드 탭 */}
        <TabPanel value={tabValue} index={0}>
          <DashboardTab 
            recentPosts={recentPosts} 
            reports={reports} 
            getStatusText={getStatusText} 
            getStatusColor={getStatusColor} 
          />
        </TabPanel>

        {/* 회원 관리 탭 */}
        <TabPanel value={tabValue} index={1}>
          <UserManagementTab 
            recentUsers={recentUsers} 
            getStatusText={getStatusText} 
            getStatusColor={getStatusColor} 
            onUserDetail={handleUserDetail}
          />
        </TabPanel>

        {/* 게시글 관리 탭 */}
        <TabPanel value={tabValue} index={2}>
          <PostManagementTab 
            recentPosts={recentPosts} 
            getStatusText={getStatusText} 
            getStatusColor={getStatusColor} 
            onPostDetail={handlePostDetail}
          />
        </TabPanel>

        {/* 게시글 신고 관리 탭 */}
        <TabPanel value={tabValue} index={3}>
          <ReportManagementTab 
            reports={reports} 
            getStatusText={getStatusText} 
            getStatusColor={getStatusColor} 
          />
        </TabPanel>

        {/* 채팅 신고 관리 탭 */}
        <TabPanel value={tabValue} index={4}>
          <ChatReportManagementTab />
        </TabPanel>


        {/* 카테고리 관리 탭 */}
        <TabPanel value={tabValue} index={5}>
          <CategoryManagementTab />
        </TabPanel>


        {/* 시스템 설정 탭 */}
        <TabPanel value={tabValue} index={6}>
          <SystemSettingsTab />
        </TabPanel>
      </Paper>

          {/* 주소 관리 탭 */}
        <TabPanel value={tabValue} index={7}>
          <AddressManagementTab />
        </TabPanel>

      {/* 모달들 */}
      <PostDetailModal 
        open={isPostDetailOpen} 
        onClose={() => setIsPostDetailOpen(false)} 
        post={selectedPost} 
      />
      
      <UserDetailModal 
        open={isUserDetailOpen} 
        onClose={() => setIsUserDetailOpen(false)} 
        user={selectedUser} 
      />
    </Container>
  );
};

export default AdminPage;
