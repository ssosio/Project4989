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
  IconButton,
  Badge
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Delete as DeleteIcon,
  Report as ReportIcon
} from '@mui/icons-material';

const PostManagementTab = ({ recentPosts, getStatusText, getStatusColor, onPostDetail }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>게시글 목록</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>제목</TableCell>
                <TableCell>카테고리</TableCell>
                <TableCell>작성자</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {recentPosts.map((post) => (
                <TableRow key={post.id}>
                  <TableCell>{post.id}</TableCell>
                  <TableCell>{post.title}</TableCell>
                  <TableCell>{post.type}</TableCell>
                  <TableCell>{post.author}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(post.status)} 
                      color={getStatusColor(post.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>
                    {post.reports > 0 ? (
                      <Badge badgeContent={post.reports} color="error">
                        <ReportIcon color="action" />
                      </Badge>
                    ) : (
                      <Chip label="0" size="small" variant="outlined" />
                    )}
                  </TableCell>
                  <TableCell>
                    <IconButton size="small" onClick={() => onPostDetail(post)}>
                      <VisibilityIcon />
                    </IconButton>
                    <IconButton size="small" color="error">
                      <DeleteIcon />
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

export default PostManagementTab;
