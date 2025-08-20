import React from 'react'
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Modal from '@mui/material/Modal';

const style = {
  position: 'absolute', top: '50%', left: '50%',
  transform: 'translate(-50%, -50%)', width: 400,
  bgcolor: 'background.paper', border: '2px solid #000',
  boxShadow: 24, p: 4,
};

const ReportModal = ({
  open, onClose,
  reason, onChangeReason,
  reportType, onChangeType,
  onSubmit, submitting
}) => {
  return (
    <Modal open={open} onClose={onClose} aria-labelledby="report-title">
      <Box sx={style}>
        <Typography id="report-title" variant="h6">신고/문의</Typography>

        <select
          name="reportType"
          value={reportType}               // ✅ controlled
          onChange={(e) => onChangeType(e.target.value)}
          style={{ width: 330, marginTop: 12 }}
        >
          <option value="" disabled>신고대상타입을 선택해주세요</option>
          <option value="POST">게시글</option>
          <option value="MEMBER">작성자</option>
        </select>

        <textarea
          name="reason"
          style={{ width: 330, height: 150, marginTop: 12 }}
          value={reason}
          onChange={onChangeReason}
        />

        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button
            variant="contained"
            onClick={onSubmit}
            disabled={submitting || !reason.trim() || !reportType}
          >
            {submitting ? '전송 중...' : 'Send'}
          </Button>
          <Button variant="outlined" onClick={onClose} disabled={submitting}>Close</Button>
        </div>
      </Box>
    </Modal>
  );
};

export default ReportModal;
