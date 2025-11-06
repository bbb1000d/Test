import {
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  LinearProgress,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import LightbulbIcon from '@mui/icons-material/Lightbulb';
import EmojiObjectsIcon from '@mui/icons-material/EmojiObjects';
import useSessionStore from '../hooks/useSessionStore';
import { useMemo, useState } from 'react';

const interestBadges = [
  'Active recall',
  'Practice tests',
  'Visual summaries',
  'Socratic dialogue',
  'Peer teaching',
  'Real-world cases',
];

const focusModes = [
  {
    label: 'Deep Work',
    helper: 'Long, immersive sessions to master complex theories.',
    icon: <LightbulbIcon color="primary" />,
  },
  {
    label: 'Momentum',
    helper: 'Short bursts to tackle dense reading or review assignments.',
    icon: <AccessTimeIcon color="primary" />,
  },
  {
    label: 'Confidence Builder',
    helper: 'Reinforce fundamentals before major assessments.',
    icon: <SchoolIcon color="primary" />,
  },
];

function PersonaSurvey() {
  const { persona, updatePersona, completeSurvey } = useSessionStore();
  const [selectedInterests, setSelectedInterests] = useState<string[]>(
    persona.interests
  );
  const [selectedMode, setSelectedMode] = useState<string>(persona.focusMode);

  const progress = useMemo(() => {
    let value = 0;
    if (persona.name) value += 30;
    if (selectedInterests.length > 0) value += 30;
    if (selectedMode) value += 40;
    return value;
  }, [persona.name, selectedInterests, selectedMode]);

  const handleSubmit = () => {
    updatePersona({
      interests: selectedInterests,
      focusMode: selectedMode,
    });
    completeSurvey();
  };

  return (
    <Stack spacing={6}>
      <Stack spacing={2}>
        <Typography variant="overline" fontWeight={700} color="primary">
          Personalize
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          Let&apos;s build your Pathfinder profile
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="40rem">
          Pathfinder adapts to your rhythms, strengths, and goals. Share how you
          prefer to learn so we can tailor diagnostics, explanations, and
          practice activities just for you.
        </Typography>
      </Stack>
      <Stack spacing={1}>
        <Typography variant="subtitle2" fontWeight={600}>
          Profile completion
        </Typography>
        <LinearProgress
          variant="determinate"
          value={progress}
          sx={{ height: 10, borderRadius: 5 }}
        />
      </Stack>
      <Grid container spacing={4}>
        <Grid item xs={12} md={6}>
          <TextField
            label="Your name"
            fullWidth
            value={persona.name}
            onChange={(event) => updatePersona({ name: event.target.value })}
            placeholder="e.g. Jordan, Chemistry major"
          />
        </Grid>
        <Grid item xs={12} md={6}>
          <TextField
            label="Current milestone"
            fullWidth
            value={persona.goal}
            onChange={(event) => updatePersona({ goal: event.target.value })}
            placeholder="e.g. Prepare for thermodynamics midterm"
          />
        </Grid>
      </Grid>
      <Stack spacing={3}>
        <Typography variant="subtitle1" fontWeight={600}>
          What learning modes energize you?
        </Typography>
        <Stack direction="row" flexWrap="wrap" gap={2}>
          {interestBadges.map((interest) => {
            const active = selectedInterests.includes(interest);
            return (
              <Chip
                key={interest}
                label={interest}
                onClick={() => {
                  setSelectedInterests((prev) =>
                    prev.includes(interest)
                      ? prev.filter((item) => item !== interest)
                      : [...prev, interest]
                  );
                }}
                color={active ? 'secondary' : 'default'}
                sx={{
                  px: 1,
                  py: 3,
                  borderRadius: 3,
                  fontSize: '1rem',
                  fontWeight: 600,
                  bgcolor: active ? 'secondary.light' : 'rgba(15,23,42,0.05)',
                }}
              />
            );
          })}
        </Stack>
      </Stack>
      <Divider />
      <Stack spacing={3}>
        <Typography variant="subtitle1" fontWeight={600}>
          Choose today&apos;s Pathfinder mode
        </Typography>
        <Grid container spacing={3}>
          {focusModes.map(({ label, helper, icon }) => {
            const selected = selectedMode === label;
            return (
              <Grid item xs={12} md={4} key={label}>
                <Box
                  onClick={() => setSelectedMode(label)}
                  sx={{
                    cursor: 'pointer',
                    borderRadius: 4,
                    border: '1px solid',
                    borderColor: selected ? 'primary.main' : 'rgba(15,23,42,0.08)',
                    p: 3,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 2,
                    transition: 'all 0.2s ease',
                    bgcolor: selected ? 'rgba(79,70,229,0.08)' : 'white',
                    boxShadow: selected
                      ? '0 20px 60px rgba(79,70,229,0.18)'
                      : '0 10px 30px rgba(15,23,42,0.06)',
                  }}
                >
                  <Stack direction="row" spacing={2} alignItems="center">
                    {icon}
                    <Typography variant="h6" fontWeight={700}>
                      {label}
                    </Typography>
                  </Stack>
                  <Typography variant="body2" color="text.secondary">
                    {helper}
                  </Typography>
                </Box>
              </Grid>
            );
          })}
        </Grid>
      </Stack>
      <Stack direction={{ xs: 'column', sm: 'row' }} justifyContent="space-between" spacing={3}>
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            We craft prompts that align with your teachers&apos; expectations and
            only reference material you share or trusted academic sources.
          </Typography>
        </Box>
        <Button
          variant="contained"
          size="large"
          color="primary"
          disabled={progress < 100}
          onClick={handleSubmit}
          startIcon={<EmojiObjectsIcon />}
        >
          Unlock personalized workspace
        </Button>
      </Stack>
    </Stack>
  );
}

export default PersonaSurvey;
