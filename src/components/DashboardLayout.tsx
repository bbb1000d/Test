import { Box, Container, Paper } from '@mui/material';
import { PropsWithChildren } from 'react';

function DashboardLayout({ children }: PropsWithChildren) {
  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 10 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 4, md: 6 },
          borderRadius: 5,
          bgcolor: 'rgba(255,255,255,0.88)',
          backdropFilter: 'blur(20px)',
          boxShadow: '0 20px 60px rgba(79,70,229,0.1)',
        }}
      >
        <Box display="flex" flexDirection="column" gap={5}>
          {children}
        </Box>
      </Paper>
    </Container>
  );
}

export default DashboardLayout;
