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
  Button
} from '@mui/material';

const ReportManagementTab = ({ reports, getStatusText, getStatusColor }) => {
  return (
    <Card>
      <CardContent>
        <Typography variant="h6" gutterBottom>신고 목록</Typography>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>게시글 ID</TableCell>
                <TableCell>신고자</TableCell>
                <TableCell>신고 사유</TableCell>
                <TableCell>상태</TableCell>
                <TableCell>신고일</TableCell>
                <TableCell>작업</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reports.map((report) => (
                <TableRow key={report.id}>
                  <TableCell>{report.id}</TableCell>
                  <TableCell>{report.postId}</TableCell>
                  <TableCell>{report.reporter}</TableCell>
                  <TableCell>{report.reason}</TableCell>
                  <TableCell>
                    <Chip 
                      label={getStatusText(report.status)} 
                      color={getStatusColor(report.status)} 
                      size="small" 
                    />
                  </TableCell>
                  <TableCell>{report.date}</TableCell>
                  <TableCell>
                    <Button size="small" variant="outlined" color="primary">
                      조사
                    </Button>
                    <Button size="small" variant="outlined" color="success" sx={{ ml: 1 }}>
                      해결
                    </Button>
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

export default ReportManagementTab;
