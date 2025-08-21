import React from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography
} from '@mui/material';
import {
  People as PeopleIcon,
  PostAdd as PostAddIcon,
  Chat as ChatIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const StatsCards = ({ stats }) => {
  return (
    <Grid container spacing={3} sx={{ mb: 4 }}>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <CardContent>
            <PeopleIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {stats.totalUsers.toLocaleString()}
            </Typography>
            <Typography variant="body2">총 회원 수</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <CardContent>
            <PostAddIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {stats.totalPosts.toLocaleString()}
            </Typography>
            <Typography variant="body2">총 게시글</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <CardContent>
            <ChatIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {stats.activeChats}
            </Typography>
            <Typography variant="body2">활성 채팅</Typography>
          </CardContent>
        </Card>
      </Grid>
      <Grid item xs={12} sm={6} md={3}>
        <Card sx={{ 
          background: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
          color: 'white',
          textAlign: 'center'
        }}>
          <CardContent>
            <ReportIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h4" component="div" sx={{ fontWeight: 'bold' }}>
              {stats.totalReports}
            </Typography>
            <Typography variant="body2">신고 건수</Typography>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default StatsCards;
