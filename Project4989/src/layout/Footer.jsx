import React from 'react';
import { Box, Typography, Link, Container } from '@mui/material';

export const Footer = () => {
  return (
    <Box component="footer" sx={{ 
      background: '#fff', 
      borderTop: '1px solid #f0f2f5', 
      py: 4, 
      mt: 8,
      height: '120px',
      width: '100%',
      minHeight: '120px'
    }}>
      <Container maxWidth="md" sx={{ textAlign: 'center' }}>
        <Typography variant="body2" color="#7b858e" sx={{ mb: 1 }}>
          © 2024 Toss마켓. All rights reserved.
        </Typography>
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mb: 1 }}>
          <Link href="#" underline="hover" color="#7b858e" fontSize={14}>
            이용약관
          </Link>
          <Link href="#" underline="hover" color="#7b858e" fontSize={14}>
            개인정보처리방침
          </Link>
          <Link href="#" underline="hover" color="#7b858e" fontSize={14}>
            고객센터
          </Link>
        </Box>
        <Typography variant="caption" color="#b0b8c1">
          (주)토스마켓 | 사업자등록번호 123-45-67890 | 서울특별시 강남구 테헤란로 123
        </Typography>
      </Container>
    </Box>
  );
}

export default Footer
