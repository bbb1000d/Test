import { Box, CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import HeroSection from './components/HeroSection';
import DashboardLayout from './components/DashboardLayout';
import StudyFlow from './components/StudyFlow';
import InsightPanel from './components/InsightPanel';
import PersonaSurvey from './components/PersonaSurvey';
import useSessionStore from './hooks/useSessionStore';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#4F46E5',
    },
    secondary: {
      main: '#EC4899',
    },
    background: {
      default: '#f7f9fc',
    },
  },
  typography: {
    fontFamily: 'Inter, sans-serif',
  },
});

function App() {
  const { surveyComplete } = useSessionStore();

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box display="flex" flexDirection="column" minHeight="100vh">
        <HeroSection />
        <DashboardLayout>
          {!surveyComplete ? (
            <PersonaSurvey />
          ) : (
            <Box display="grid" gridTemplateColumns={{ md: '2fr 1fr' }} gap={4}>
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
