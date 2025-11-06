import {
  Avatar,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from '@mui/material';
import ScienceIcon from '@mui/icons-material/Science';
import QuizIcon from '@mui/icons-material/Quiz';
import InsightsIcon from '@mui/icons-material/Insights';
import WorkspacePremiumIcon from '@mui/icons-material/WorkspacePremium';
import useSessionStore from '../hooks/useSessionStore';
import { summarizePersona } from '../utils/generation';

const trustedSources = [
  {
    label: 'Textbook',
    value: 'Campbell Biology 12e',
  },
  {
    label: 'Lecture slides',
    value: 'Week 6 - Cellular Energy',
  },
  {
    label: 'Lab notes',
    value: 'Respiration enzyme experiments',
  },
];

const upcomingMilestones = [
  {
    label: 'Quiz - Bio 204',
    date: 'Mar 14',
    focus: 'Glycolysis vs. Krebs cycle',
  },
  {
    label: 'Lab practical',
    date: 'Mar 17',
    focus: 'Fermentation pathways',
  },
];

function InsightPanel() {
  const { persona } = useSessionStore();
  const personaSummary = summarizePersona(persona);

  return (
    <Stack spacing={3}>
      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 52, height: 52 }}>
                <InsightsIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Pathfinder insights
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Snapshot of your learning rhythm today.
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              {personaSummary}
            </Typography>
            <Stack direction="row" gap={1} flexWrap="wrap">
              {persona.interests.map((interest) => (
                <Chip
                  key={interest}
                  label={interest}
                  color="secondary"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                />
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                <ScienceIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                Trusted material vault
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {trustedSources.map((source) => (
                <Box key={source.value}>
                  <Typography fontWeight={600}>{source.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {source.value}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={3}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'primary.main', width: 48, height: 48 }}>
                <QuizIcon />
              </Avatar>
              <Typography variant="h6" fontWeight={700}>
                Upcoming checkpoints
              </Typography>
            </Stack>
            <Stack spacing={2}>
              {upcomingMilestones.map((milestone) => (
                <Box key={milestone.label}>
                  <Typography fontWeight={600}>{milestone.label}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {milestone.date} • {milestone.focus}
                  </Typography>
                </Box>
              ))}
            </Stack>
          </Stack>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <Stack spacing={2}>
            <Stack direction="row" spacing={2} alignItems="center">
              <Avatar sx={{ bgcolor: 'secondary.main', width: 48, height: 48 }}>
                <WorkspacePremiumIcon />
              </Avatar>
              <Box>
                <Typography variant="h6" fontWeight={700}>
                  Session quality pledge
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Built on vetted sources &amp; class-authentic prompts.
                </Typography>
              </Box>
            </Stack>
            <Typography variant="body2" color="text.secondary">
              Every Pathfinder recommendation is grounded in materials you trust.
              AI-generated summaries include citations back to your uploads and
              authoritative references like academic journals.
            </Typography>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default InsightPanel;
