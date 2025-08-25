import React, { useState, useEffect, useContext } from 'react';
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
  Button,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Snackbar,
  Box,
  Pagination,
  InputAdornment
} from '@mui/material';
import {
  Visibility as VisibilityIcon,
  Block as BlockIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Refresh as RefreshIcon,
  Calculate as CalculateIcon
} from '@mui/icons-material';
import api from '../../lib/api';
import { AuthContext } from '../../context/AuthContext';
import CreditTierDisplay from '../CreditTierDisplay';

const UserManagementTab = () => {
  const { userInfo } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isBanOpen, setIsBanOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [editForm, setEditForm] = useState({});
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [recalculatingTier, setRecalculatingTier] = useState(false);

  // 회원 목록 조회
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/admin/members?page=${page}&search=${searchTerm}`);
      setUsers(response.data.content || response.data);
      setTotalPages(response.data.totalPages || 1);
    } catch (error) {
      console.error('회원 목록 조회 실패:', error);
      setSnackbar({
        open: true,
        message: '회원 목록을 불러오는데 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [page, searchTerm]);

  // 회원 상세 정보 조회
  const handleUserDetail = async (user) => {
    try {
      const response = await api.get(`/api/admin/members/${user.memberId}`);
      setSelectedUser(response.data);
      setIsDetailOpen(true);
    } catch (error) {
      console.error('회원 상세 정보 조회 실패:', error);
      setSnackbar({
        open: true,
        message: '회원 상세 정보를 불러오는데 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 회원 수정
  const handleEdit = (user) => {
    setEditForm({
      member_id: user.memberId,
      login_id: user.loginId,
      nickname: user.nickname,
      email: user.email,
      phone_number: user.phoneNumber || '',
      tier: user.tier
    });
    setIsEditOpen(true);
  };

  const handleEditSubmit = async () => {
    try {
      await api.put(`/api/admin/members/${editForm.member_id}`, editForm);
      
      // 로그 기록
      console.log('전송할 액션 로그 데이터:', {
        adminId: userInfo.memberId,
        actionType: 'USER_UPDATE',
        targetEntityType: 'MEMBER',
        targetEntityId: editForm.member_id,
        details: '회원 정보 수정'
      });
      console.log('userInfo:', userInfo);
      console.log('userInfo.memberId:', userInfo.memberId);
      
      await api.post('/api/admin/action-logs', {
        adminId: userInfo.memberId,
        actionType: 'USER_UPDATE',
        targetEntityType: 'MEMBER',
        targetEntityId: editForm.member_id,
        details: '회원 정보 수정'
      });

      setSnackbar({
        open: true,
        message: '회원 정보가 수정되었습니다.',
        severity: 'success'
      });
      setIsEditOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('회원 수정 실패:', error);
      setSnackbar({
        open: true,
        message: '회원 정보 수정에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 회원 상태 변경 (밴/해제)
  const handleStatusChange = async (userId, newStatus) => {
    try {
      const actionType = newStatus === 'BANNED' ? 'USER_BAN' : 'USER_UNBAN';
      const details = newStatus === 'BANNED' ? `밴 사유: ${banReason}` : '밴 해제';
      
      await api.put(`/api/admin/members/${userId}/status`, {
        status: newStatus,
        reason: banReason
      });

      // 로그 기록
      await api.post('/api/admin/action-logs', {
        adminId: userInfo.memberId,
        actionType: actionType,
        targetEntityType: 'MEMBER',
        targetEntityId: userId,
        details: details
      });

      setSnackbar({
        open: true,
        message: newStatus === 'BANNED' ? '회원이 밴되었습니다.' : '밴이 해제되었습니다.',
        severity: 'success'
      });
      setIsBanOpen(false);
      setBanReason('');
      fetchUsers();
    } catch (error) {
      console.error('상태 변경 실패:', error);
      setSnackbar({
        open: true,
        message: '상태 변경에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  // 신용도 등급 재계산
  const handleRecalculateTier = async (userId) => {
    try {
      setRecalculatingTier(true);
      const response = await api.post(`/api/credit-tier/${userId}/recalculate`);
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '신용도 등급이 재계산되었습니다.',
          severity: 'success'
        });
        
        // 로그 기록
        await api.post('/api/admin/action-logs', {
          adminId: userInfo.memberId,
          actionType: 'CREDIT_TIER_RECALCULATE',
          targetEntityType: 'MEMBER',
          targetEntityId: userId,
          details: '신용도 등급 재계산'
        });
        
        fetchUsers(); // 목록 새로고침
      }
    } catch (error) {
      console.error('신용도 등급 재계산 실패:', error);
      setSnackbar({
        open: true,
        message: '신용도 등급 재계산에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setRecalculatingTier(false);
    }
  };

  // 전체 신용도 등급 일괄 업데이트
  const handleUpdateAllCreditTiers = async () => {
    if (!window.confirm('모든 회원의 신용도 등급을 일괄 업데이트하시겠습니까? 이 작업은 시간이 오래 걸릴 수 있습니다.')) {
      return;
    }

    try {
      setRecalculatingTier(true);
      const response = await api.post('/api/credit-tier/update-all');
      
      if (response.data.success) {
        setSnackbar({
          open: true,
          message: '모든 회원의 신용도 등급이 업데이트되었습니다.',
          severity: 'success'
        });
        
        // 로그 기록
        await api.post('/api/admin/action-logs', {
          adminId: userInfo.memberId,
          actionType: 'CREDIT_TIER_BULK_UPDATE',
          targetEntityType: 'SYSTEM',
          targetEntityId: 0,
          details: '전체 회원 신용도 등급 일괄 업데이트'
        });
        
        fetchUsers(); // 목록 새로고침
      }
    } catch (error) {
      console.error('전체 신용도 등급 업데이트 실패:', error);
      setSnackbar({
        open: true,
        message: '전체 신용도 등급 업데이트에 실패했습니다.',
        severity: 'error'
      });
    } finally {
      setRecalculatingTier(false);
    }
  };

  // 회원 삭제
  const handleDelete = async (userId) => {
    try {
      await api.delete(`/api/admin/members/${userId}`);

      // 로그 기록
      await api.post('/api/admin/action-logs', {
        adminId: userInfo.memberId,
        actionType: 'USER_DELETE',
        targetEntityType: 'MEMBER',
        targetEntityId: userId,
        details: '회원 삭제'
      });

      setSnackbar({
        open: true,
        message: '회원이 삭제되었습니다.',
        severity: 'success'
      });
      setIsDeleteOpen(false);
      fetchUsers();
    } catch (error) {
      console.error('회원 삭제 실패:', error);
      setSnackbar({
        open: true,
        message: '회원 삭제에 실패했습니다.',
        severity: 'error'
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'ACTIVE': return 'success';
      case 'BANNED': return 'error';
      default: return 'default';
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case 'ACTIVE': return '활성';
      case 'BANNED': return '밴';
      default: return status;
    }
  };

  const getTierText = (tier) => {
    switch (tier) {
      case '초보상인': return '초보상인';
      case '거래꾼': return '거래꾼';
      case '장인': return '장인';
      case '마스터': return '마스터';
      case '거래왕': return '거래왕';
      default: return tier;
    }
  };

  return (
    <>
      <Card>
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">회원 관리</Typography>
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Button
                variant="outlined"
                startIcon={<CalculateIcon />}
                onClick={handleUpdateAllCreditTiers}
                disabled={recalculatingTier}
                color="secondary"
              >
                전체 등급 업데이트
              </Button>
              <Button
                variant="outlined"
                startIcon={<RefreshIcon />}
                onClick={fetchUsers}
                disabled={loading}
              >
                새로고침
              </Button>
            </Box>
          </Box>

          {/* 검색 및 필터 */}
          <Box sx={{ mb: 2 }}>
            <TextField
              fullWidth
              placeholder="닉네임, 이메일, 로그인 ID로 검색..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{ maxWidth: 400 }}
            />
          </Box>

          {/* 회원 목록 테이블 */}
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ID</TableCell>
                  <TableCell>로그인 ID</TableCell>
                  <TableCell>닉네임</TableCell>
                  <TableCell>이메일</TableCell>
                  <TableCell>전화번호</TableCell>
                  <TableCell>등급</TableCell>
                  <TableCell>상태</TableCell>
                  <TableCell>가입일</TableCell>
                  <TableCell>작업</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {users && users.length > 0 ? (
                  users.map((user) => (
                    <TableRow key={user.memberId}>
                      <TableCell>{user.memberId || 'N/A'}</TableCell>
                      <TableCell>{user.loginId || 'N/A'}</TableCell>
                      <TableCell>{user.nickname || 'N/A'}</TableCell>
                      <TableCell>{user.email || 'N/A'}</TableCell>
                      <TableCell>{user.phoneNumber || '-'}</TableCell>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <CreditTierDisplay memberId={user.memberId} showDetails={false} />
                          <IconButton 
                            size="small" 
                            color="secondary"
                            onClick={() => handleRecalculateTier(user.memberId)}
                            disabled={recalculatingTier}
                            title="신용도 등급 재계산"
                          >
                            <CalculateIcon />
                          </IconButton>
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Chip 
                          label={getStatusText(user.status)} 
                          color={getStatusColor(user.status)} 
                          size="small" 
                        />
                      </TableCell>
                      <TableCell>
                        {user.createdAt ? new Date(user.createdAt).toLocaleDateString('ko-KR') : 'N/A'}
                      </TableCell>
                      <TableCell>
                        <IconButton size="small" onClick={() => handleUserDetail(user)}>
                          <VisibilityIcon />
                        </IconButton>
                        <IconButton size="small" color="primary" onClick={() => handleEdit(user)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color={user.status === 'ACTIVE' ? 'warning' : 'success'}
                          onClick={() => {
                            setSelectedUser(user);
                            setIsBanOpen(true);
                          }}
                        >
                          <BlockIcon />
                        </IconButton>
                        <IconButton 
                          size="small" 
                          color="error"
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteOpen(true);
                          }}
                        >
                          <DeleteIcon />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={8} align="center">
                      {loading ? '로딩 중...' : '데이터가 없습니다.'}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </TableContainer>

          {/* 페이지네이션 */}
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={totalPages}
              page={page}
              onChange={(e, value) => setPage(value)}
              color="primary"
            />
          </Box>
        </CardContent>
      </Card>

      {/* 회원 상세 정보 모달 */}
      <Dialog open={isDetailOpen} onClose={() => setIsDetailOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>회원 상세 정보</DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Typography><strong>ID:</strong> {selectedUser.memberId}</Typography>
              <Typography><strong>로그인 ID:</strong> {selectedUser.loginId}</Typography>
              <Typography><strong>닉네임:</strong> {selectedUser.nickname}</Typography>
              <Typography><strong>이메일:</strong> {selectedUser.email}</Typography>
              <Typography><strong>전화번호:</strong> {selectedUser.phoneNumber || '-'}</Typography>
              <Typography><strong>등급:</strong> {getTierText(selectedUser.tier)}</Typography>
              <Typography><strong>상태:</strong> {getStatusText(selectedUser.status)}</Typography>
              <Typography><strong>가입일:</strong> {new Date(selectedUser.createdAt).toLocaleString('ko-KR')}</Typography>
              <Typography><strong>수정일:</strong> {new Date(selectedUser.updatedAt).toLocaleString('ko-KR')}</Typography>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDetailOpen(false)}>닫기</Button>
        </DialogActions>
      </Dialog>

      {/* 회원 수정 모달 */}
      <Dialog open={isEditOpen} onClose={() => setIsEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>회원 정보 수정</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <TextField
              fullWidth
              label="닉네임"
              value={editForm.nickname || ''}
              onChange={(e) => setEditForm({...editForm, nickname: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="이메일"
              value={editForm.email || ''}
              onChange={(e) => setEditForm({...editForm, email: e.target.value})}
              margin="normal"
            />
            <TextField
              fullWidth
              label="전화번호"
              value={editForm.phone_number || ''}
              onChange={(e) => setEditForm({...editForm, phone_number: e.target.value})}
              margin="normal"
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>등급</InputLabel>
              <Select
                value={editForm.tier || ''}
                onChange={(e) => setEditForm({...editForm, tier: e.target.value})}
                label="등급"
              >
                <MenuItem value="초보상인">초보상인</MenuItem>
                <MenuItem value="거래꾼">거래꾼</MenuItem>
                <MenuItem value="장인">장인</MenuItem>
                <MenuItem value="마스터">마스터</MenuItem>
                <MenuItem value="거래왕">거래왕</MenuItem>
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsEditOpen(false)}>취소</Button>
          <Button onClick={handleEditSubmit} variant="contained">수정</Button>
        </DialogActions>
      </Dialog>

      {/* 회원 상태 변경 모달 */}
      <Dialog open={isBanOpen} onClose={() => setIsBanOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {selectedUser?.status === 'ACTIVE' ? '회원 밴' : '밴 해제'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            {selectedUser?.status === 'ACTIVE' && (
              <TextField
                fullWidth
                label="밴 사유"
                value={banReason}
                onChange={(e) => setBanReason(e.target.value)}
                margin="normal"
                multiline
                rows={3}
                placeholder="밴 사유를 입력하세요..."
              />
            )}
            <Alert severity="warning" sx={{ mt: 2 }}>
              {selectedUser?.status === 'ACTIVE' 
                ? `'${selectedUser?.nickname}' 회원을 밴하시겠습니까?` 
                : `'${selectedUser?.nickname}' 회원의 밴을 해제하시겠습니까?`
              }
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsBanOpen(false)}>취소</Button>
          <Button 
            onClick={() => handleStatusChange(
              selectedUser?.memberId, 
              selectedUser?.status === 'ACTIVE' ? 'BANNED' : 'ACTIVE'
            )}
            variant="contained"
            color={selectedUser?.status === 'ACTIVE' ? 'warning' : 'success'}
          >
            {selectedUser?.status === 'ACTIVE' ? '밴' : '해제'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* 회원 삭제 확인 모달 */}
      <Dialog open={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogTitle>회원 삭제 확인</DialogTitle>
        <DialogContent>
          <Alert severity="error" sx={{ mt: 2 }}>
            <strong>'{selectedUser?.nickname}'</strong> 회원을 삭제하시겠습니까?<br/>
            이 작업은 되돌릴 수 없습니다.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setIsDeleteOpen(false)}>취소</Button>
          <Button 
            onClick={() => handleDelete(selectedUser?.memberId)}
            variant="contained"
            color="error"
          >
            삭제
          </Button>
        </DialogActions>
      </Dialog>

      {/* 스낵바 */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({...snackbar, open: false})}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar({...snackbar, open: false})}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
};

export default UserManagementTab;