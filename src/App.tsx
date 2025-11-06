import {
  Box,
  CssBaseline,
  ThemeProvider,
  createTheme,
  PaletteMode,
} from '@mui/material';
import { useMemo, useState } from 'react';
import HeroSection from './components/HeroSection';
import DashboardLayout from './components/DashboardLayout';
import StudyFlow from './components/StudyFlow';
import InsightPanel from './components/InsightPanel';
import PersonaSurvey from './components/PersonaSurvey';
import useSessionStore from './hooks/useSessionStore';

function App() {
  const { surveyComplete } = useSessionStore();
  const [mode, setMode] = useState<PaletteMode>('light');

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode,
          primary: {
            main: mode === 'light' ? '#1f2937' : '#cbd5f5',
          },
          secondary: {
            main: '#6366f1',
          },
          background: {
            default: mode === 'light' ? '#f8fafc' : '#0b1120',
            paper: mode === 'light' ? '#ffffff' : '#111827',
          },
        },
        typography: {
          fontFamily: 'Inter, system-ui, sans-serif',
        },
        shape: {
          borderRadius: 16,
        },
        components: {
          MuiCard: {
            styleOverrides: {
              root: {
                boxShadow: 'none',
                border: '1px solid',
                borderColor: mode === 'light' ? '#e5e7eb' : '#1f2937',
              },
            },
          },
        },
      }),
    [mode]
  );

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh" bgcolor="background.default">
        <HeroSection
          mode={mode}
          onToggleMode={() => setMode((prev) => (prev === 'light' ? 'dark' : 'light'))}
        />
        <DashboardLayout>
          {!surveyComplete ? (
            <PersonaSurvey />
          ) : (
            <Box display="grid" gridTemplateColumns={{ md: '2fr 1fr' }} gap={{ xs: 4, md: 6 }}>
              <Box display="flex" flexDirection="column" gap={4}>
                <StudyFlow />
              </Box>
              <InsightPanel />
            </Box>
          )}
        </DashboardLayout>
      </Box>
    </ThemeProvider>
  );
}

export default App;
