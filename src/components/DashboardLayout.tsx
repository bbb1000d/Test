import { Box, Container, Paper, useTheme } from '@mui/material';
import { PropsWithChildren } from 'react';

function DashboardLayout({ children }: PropsWithChildren) {
  const theme = useTheme();

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 6, md: 8 } }}>
      <Paper
        elevation={0}
        sx={{
          p: { xs: 3, md: 5 },
          borderRadius: 4,
          bgcolor: 'background.paper',
          border: '1px solid',
          borderColor: theme.palette.divider,
        }}
      >
        <Box display="flex" flexDirection="column" gap={{ xs: 4, md: 6 }}>
          {children}
        </Box>
      </Paper>
    </Container>
  );
}

export default DashboardLayout;
