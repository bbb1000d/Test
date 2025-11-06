import {
  Box,
  Button,
  Container,
  IconButton,
  PaletteMode,
  Stack,
  Typography,
} from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import LightModeIcon from '@mui/icons-material/LightMode';

type HeroSectionProps = {
  mode: PaletteMode;
  onToggleMode: () => void;
};

const heroHighlights = [
  'Trusted materials only',
  'Personal diagnostics',
  'Class-style assessments',
];

function HeroSection({ mode, onToggleMode }: HeroSectionProps) {
  return (
    <Box
      component="header"
      sx={{
        bgcolor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg" sx={{ py: { xs: 5, md: 7 } }}>
        <Stack spacing={6}>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            justifyContent="space-between"
            alignItems={{ xs: 'flex-start', sm: 'center' }}
            spacing={2}
          >
            <Box>
              <Typography variant="h5" fontWeight={700}>
                Pathfinder study workspace
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Learn with an AI guide that mirrors your study habits.
              </Typography>
            </Box>
            <Stack direction="row" spacing={2} alignItems="center">
              <Button
                variant="contained"
                color="secondary"
                size="medium"
                startIcon={<AutoStoriesIcon />}
              >
                Start a session
              </Button>
              <IconButton
                color="inherit"
                onClick={onToggleMode}
                aria-label="Toggle light and dark mode"
                sx={{ border: '1px solid', borderColor: 'divider' }}
              >
                {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
              </IconButton>
            </Stack>
          </Stack>

          <Stack spacing={2} maxWidth="48rem">
            <Typography variant="h3" fontWeight={700}>
              A calm, focused place to prepare for your next assessment
            </Typography>
            <Typography variant="body1" color="text.secondary">
              Upload documents, share how you learn, and Pathfinder will surface
              key explanations, discover gaps, and craft short practice blocks
              that feel like your instructor&apos;s materials.
            </Typography>
          </Stack>

          <Stack direction="row" flexWrap="wrap" gap={1.5}>
            {heroHighlights.map((highlight) => (
              <Box
                key={highlight}
                sx={{
                  px: 2.5,
                  py: 1,
                  borderRadius: 999,
                  border: '1px solid',
                  borderColor: 'divider',
                  color: 'text.secondary',
                  fontWeight: 600,
                  fontSize: '0.9rem',
                }}
              >
                {highlight}
              </Box>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default HeroSection;
