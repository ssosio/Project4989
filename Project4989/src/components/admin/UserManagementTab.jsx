import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Block as BlockIcon
} from '@mui/icons-material';

const UserManagementTab = ({ recentUsers, getStatusText, getStatusColor, onUserDetail }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>회원 목록</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>닉네임</TableCell>
                <TableCell>이메일</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>가입일</TableCell>
                <TableCell>게시글 수</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentUsers.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>{user.id}</TableCell>
                  <TableCell>{user.nickname}</TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(user.status)} 
                      color={getStatusColor(user.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{user.joinDate}</TableCell>
                  <TableCell>{user.posts}</TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => onUserDetail(user)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="warning">
                      <BlockIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </CardContent>
    </Card>
  );
};

export default UserManagementTab;
