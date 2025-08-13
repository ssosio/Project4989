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

const ReportModal = ({ open, onClose, content, onChange, onSubmit, submitting }) => {

  return (
    <Modal open={open} onClose={onClose} aria-labelledby="report-title">
      <Box sx={style}>
        <Typography id="report-title" variant="h6">신고/문의</Typography>
        <textarea
          name="content"
          style={{ width: 330, height: 150, marginTop: 12 }}
          value={content}
          onChange={onChange}
        />
        <div style={{ marginTop: 12, display: 'flex', gap: 8 }}>
          <Button variant="contained" onClick={onSubmit} disabled={submitting || !content.trim()}>
            {submitting ? '전송 중...' : 'Send'}
          </Button>
          <Button variant="outlined" onClick={onClose} disabled={submitting}>Close</Button>
        </div>
      </Box>
    </Modal>
  )
}

export default ReportModal