import React, { useState, useEffect } from 'react';
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
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert
} from '@mui/material';
import api from '../../lib/api';

const ReportManagementTab = () => {
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    try {
      setLoading(true);
      console.log('신고 목록 조회 시작...');
      const response = await api.get('/post/reports');
      console.log('API 응답:', response);
      if (response.data.success) {
        setReports(response.data.reports);
        console.log('신고 목록 설정됨:', response.data.reports);
      } else {
        console.log('API 응답이 성공이 아님:', response.data);
      }
    } catch (error) {
      console.error('신고 목록 조회 실패:', error);
      console.error('에러 상세:', error.response?.data);
      setSnackbar({
        open: true,
        message: '신고 목록을 불러오는데 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (reportId, newStatus) => {
    try {
      const response = await api.put(`/post/reports/${reportId}/status?status=${newStatus}`);
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '신고 상태가 업데이트되었습니다.',
          severity: 'success'
        });
        // 목록 새로고침
        fetchReports();
      }
    } catch (error) {
      console.error('상태 업데이트 실패:', error);
      setSnackbar({
        open: true,
        message: '상태 업데이트에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'PENDING':
        return '대기중';
      case 'INVESTIGATING':
        return '조사중';
      case 'RESOLVED':
        return '해결됨';
      case 'DISMISSED':
        return '기각됨';
      default:
        return status;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'INVESTIGATING':
        return 'info';
      case 'RESOLVED':
        return 'success';
      case 'DISMISSED':
        return 'error';
      default:
        return 'default';
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleString('ko-KR');
  };

  const handleSnackbarClose = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  if (loading) {
    return (
      <Card>
        <CardContent>
          <Typography>로딩 중...</Typography>
        </CardContent>
      </Card>
    );
  }

  // 테스트용 더미 데이터 (API 호출 실패 시 사용) - 주석 처리
  /*
  const dummyReports = [
    {
      id: 1,
      report_type_info: '게시글: 테스트 게시글 제목',
      reporter_nickname: '테스트신고자',
      reason: '허위 정보',
      status: 'PENDING',
      date: new Date().toISOString()
    },
    {
      id: 2,
      report_type_info: '작성자: 테스트작성자',
      reporter_nickname: '다른신고자',
      reason: '부적절한 내용',
      status: 'INVESTIGATING',
      date: new Date().toISOString()
    }
  ];
  */

  // 실제 API 데이터 사용
  const displayReports = reports;

  return (
    <>
      <Card>
        <CardContent>
          <Typography variant="h6" gutterBottom>신고 목록</Typography>
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>신고타입(작성자:작성자ID/게시글:게시글title)</TableCell>
                  <TableCell>신고자</TableCell>
                  <TableCell>신고 사유</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>신고일</TableCell>
                  <TableCell>작업(상태변경)</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {displayReports.map((report) => (
                  <TableRow key={report.id}>
                    <TableCell>{report.id}</TableCell>
                    <TableCell>{report.report_type_info}</TableCell>
                    <TableCell>{report.reporter_nickname}</TableCell>
                    <TableCell>{report.reason}</TableCell>
                    <TableCell>
                      <Chip 
                        label={getStatusText(report.status)} 
                        color={getStatusColor(report.status)} 
                        size="small" 
                      />
                    </TableCell>
                    <TableCell>{formatDate(report.date)}</TableCell>
                    <TableCell>
                      <FormControl size="small" sx={{ minWidth: 120 }}>
                        <Select
                          value={report.status}
                          onChange={(e) => handleStatusChange(report.id, e.target.value)}
                          displayEmpty
                        >
                          <MenuItem value="PENDING">대기중</MenuItem>
                          <MenuItem value="INVESTIGATING">조사중</MenuItem>
                          <MenuItem value="RESOLVED">해결됨</MenuItem>
                          <MenuItem value="DISMISSED">기각됨</MenuItem>
                        </Select>
                      </FormControl>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert onClose={handleSnackbarClose} severity={snackbar.severity}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default ReportManagementTab;
