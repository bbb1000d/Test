import { Box, Button, Chip, Container, Stack, Typography } from '@mui/material';
import AutoStoriesIcon from '@mui/icons-material/AutoStories';
import SparklesIcon from '@mui/icons-material/AutoAwesome';

const heroHighlights = [
  'Trusted-source knowledge synthesis',
  'Adaptive memory diagnostics',
  'Assessment blueprints that mirror your class',
];

function HeroSection() {
  return (
    <Box
      sx={{
        background: 'linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%)',
        color: 'white',
        py: { xs: 10, md: 16 },
      }}
    >
      <Container maxWidth="lg">
        <Stack spacing={4} alignItems={{ xs: 'flex-start', md: 'center' }}>
          <Chip
            icon={<SparklesIcon fontSize="small" />}
            label="Pathfinder AI Workspace"
            sx={{
              bgcolor: 'rgba(255,255,255,0.15)',
              color: 'white',
              backdropFilter: 'blur(12px)',
              fontWeight: 600,
            }}
          />
          <Typography
            variant="h2"
            textAlign={{ xs: 'left', md: 'center' }}
            sx={{ fontWeight: 700, maxWidth: '60rem' }}
          >
            Study smarter with an AI mentor that learns alongside you.
          </Typography>
          <Typography
            variant="h6"
            textAlign={{ xs: 'left', md: 'center' }}
            sx={{ opacity: 0.85, maxWidth: '50rem' }}
          >
            Upload lecture decks, notes, and practice exams to craft an adaptive
            learning journey. Pathfinder surfaces your blind spots, generates
            vivid explanations, and designs tests that feel like your
            instructor wrote them.
          </Typography>
          <Stack
            direction={{ xs: 'column', sm: 'row' }}
            spacing={2}
            alignItems={{ xs: 'stretch', sm: 'center' }}
          >
            <Button
              variant="contained"
              color="secondary"
              size="large"
              endIcon={<AutoStoriesIcon />}
            >
              Launch your workspace
            </Button>
            <Button variant="outlined" color="inherit" size="large">
              Explore product tour
            </Button>
          </Stack>
          <Stack direction={{ xs: 'column', md: 'row' }} spacing={3}>
            {heroHighlights.map((highlight) => (
              <Stack
                key={highlight}
                direction="row"
                spacing={2}
                alignItems="center"
                sx={{
                  bgcolor: 'rgba(255,255,255,0.08)',
                  px: 3,
                  py: 2,
                  borderRadius: 3,
                  backdropFilter: 'blur(14px)',
                }}
              >
                <Box
                  sx={{
                    width: 10,
                    height: 10,
                    borderRadius: '50%',
                    bgcolor: '#FDE68A',
                    boxShadow: '0 0 0 6px rgba(253, 230, 138, 0.2)',
                  }}
                />
                <Typography variant="body1" fontWeight={600}>
                  {highlight}
                </Typography>
              </Stack>
            ))}
          </Stack>
        </Stack>
      </Container>
    </Box>
  );
}

export default HeroSection;
