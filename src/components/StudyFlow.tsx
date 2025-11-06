import {
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  IconButton,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AddIcon from '@mui/icons-material/Add';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useEffect, useMemo, useState } from 'react';
import useSessionStore from '../hooks/useSessionStore';
import useTrustedUpload from '../hooks/useTrustedUpload';
import { generateRoadmap, generateSession } from '../utils/generation';

function StudyFlow() {
  const { persona, trustedSources, addTrustedSource, updateCurrentPrompt } =
    useSessionStore();
  const [topic, setTopic] = useState('Cellular respiration and metabolism');
  const [prompt, setPrompt] = useState("Help me prepare for next week's quiz.");
  const [loadingRoadmap, setLoadingRoadmap] = useState(false);
  const [loadingSession, setLoadingSession] = useState(false);
  const [roadmapViewed, setRoadmapViewed] = useState(false);
  const [sessionGenerated, setSessionGenerated] = useState(false);
  const { handleUpload, uploadError } = useTrustedUpload(addTrustedSource);

  const roadmap = useMemo(() => generateRoadmap(trustedSources, topic), [
    trustedSources,
    topic,
  ]);

  const session = useMemo(
    () => generateSession(trustedSources, topic, prompt, persona),
    [trustedSources, topic, prompt, persona]
  );

  useEffect(() => {
    if (loadingRoadmap) {
      const timer = window.setTimeout(() => {
        setLoadingRoadmap(false);
        setRoadmapViewed(true);
      }, 1200);
      return () => window.clearTimeout(timer);
    }
  }, [loadingRoadmap]);

  useEffect(() => {
    if (loadingSession) {
      const timer = window.setTimeout(() => {
        setLoadingSession(false);
        setSessionGenerated(true);
      }, 1500);
      return () => window.clearTimeout(timer);
    }
  }, [loadingSession]);

  return (
    <Stack spacing={5}>
      <Stack spacing={1}>
        <Typography variant="overline" fontWeight={700} color="primary">
          Workspace
        </Typography>
        <Typography variant="h4" fontWeight={700}>
          Curate your study sprint
        </Typography>
        <Typography variant="body1" color="text.secondary" maxWidth="42rem">
          Upload class materials, fine-tune Pathfinder&apos;s focus, and generate a
          personalized action plan that includes diagnostic questions, expansive
          notes, and exam-style practice.
        </Typography>
      </Stack>

      <Card sx={{ borderRadius: 4, boxShadow: '0 24px 60px rgba(15,23,42,0.08)' }}>
        <CardContent>
          <Stack spacing={4}>
            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                1. Ingest trusted materials
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Pathfinder analyzes only your uploaded files and verified
                academic sources. Drag PDFs, lecture decks, and study guides to
                enrich the knowledge base.
              </Typography>
              <Box
                component="label"
                htmlFor="trusted-upload"
                sx={{
                  border: '2px dashed rgba(79,70,229,0.3)',
                  borderRadius: 4,
                  p: 4,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 2,
                  alignItems: 'center',
                  justifyContent: 'center',
                  background: 'linear-gradient(145deg, rgba(79,70,229,0.08), rgba(236,72,153,0.08))',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                  },
                }}
              >
                <UploadFileIcon color="primary" fontSize="large" />
                <Stack spacing={1} alignItems="center">
                  <Typography fontWeight={600}>Drop materials here</Typography>
                  <Typography variant="body2" color="text.secondary">
                    PDF, DOCX, and TXT up to 20MB
                  </Typography>
                </Stack>
                <Button variant="contained" startIcon={<AddIcon />}>Browse files</Button>
              </Box>
              <input
                id="trusted-upload"
                type="file"
                multiple
                hidden
                onChange={handleUpload}
              />
              {uploadError && (
                <Typography color="error" variant="body2">
                  {uploadError}
                </Typography>
              )}
              <Stack direction="row" gap={1} flexWrap="wrap">
                {trustedSources.map((source) => (
                  <Chip
                    key={source.id}
                    label={source.title}
                    color={source.status === 'verified' ? 'primary' : 'default'}
                    variant={source.status === 'verified' ? 'filled' : 'outlined'}
                    icon={
                      source.status === 'verified' ? (
                        <CheckCircleIcon sx={{ fontSize: 18 }} />
                      ) : undefined
                    }
                    sx={{ borderRadius: 2 }}
                  />
                ))}
                {trustedSources.length === 0 && (
                  <Typography variant="body2" color="text.secondary">
                    No materials yet. Upload to unlock personalized insights.
                  </Typography>
                )}
              </Stack>
            </Stack>

            <Divider />

            <Stack spacing={2}>
              <Typography variant="h6" fontWeight={700}>
                2. Define the session focus
              </Typography>
              <Grid container spacing={3}>
                <Grid item xs={12} md={7}>
                  <TextField
                    label="Study topic"
                    fullWidth
                    value={topic}
                    onChange={(event) => setTopic(event.target.value)}
                    placeholder="e.g. Energy transfer in cellular respiration"
                  />
                </Grid>
                <Grid item xs={12} md={5}>
                  <TextField
                    label="What should Pathfinder help with?"
                    fullWidth
                    value={prompt}
                    onChange={(event) => {
                      setPrompt(event.target.value);
                      updateCurrentPrompt(event.target.value);
                    }}
                    placeholder="e.g. Create a quiz and explain weak spots"
                  />
                </Grid>
              </Grid>
              <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>
                <Button
                  variant="contained"
                  color="primary"
                  startIcon={<PlayArrowIcon />}
                  onClick={() => {
                    setSessionGenerated(false);
                    setLoadingSession(true);
                  }}
                  disabled={loadingSession}
                >
                  {loadingSession ? 'Building session…' : 'Generate session'}
                </Button>
                <Button
                  variant="outlined"
                  color="secondary"
                  endIcon={<ArrowForwardIcon />}
                  onClick={() => {
                    setRoadmapViewed(false);
                    setLoadingRoadmap(true);
                  }}
                  disabled={loadingRoadmap}
                >
                  {loadingRoadmap ? 'Drafting roadmap…' : 'Preview roadmap'}
                </Button>
              </Stack>
              {(sessionGenerated || roadmapViewed) && (
                <Typography variant="body2" color="primary">
                  {sessionGenerated && 'Session blueprint refreshed. '}
                  {roadmapViewed && 'Roadmap tailored to your materials.'}
                </Typography>
              )}
            </Stack>

            <Divider />

            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                3. Pathfinder roadmap
              </Typography>
              <Grid container spacing={3}>
                {roadmap.map((item) => (
                  <Grid item xs={12} md={4} key={item.title}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: '1px solid rgba(15,23,42,0.06)',
                        bgcolor: 'rgba(79,70,229,0.04)',
                        height: '100%',
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Typography variant="subtitle2" color="primary">
                            {item.category}
                          </Typography>
                          <Typography variant="h6" fontWeight={700}>
                            {item.title}
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            {item.description}
                          </Typography>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>

            <Divider />

            <Stack spacing={3}>
              <Typography variant="h6" fontWeight={700}>
                Session blueprint
              </Typography>
              <Grid container spacing={3}>
                {session.sections.map((section) => (
                  <Grid item xs={12} md={6} key={section.title}>
                    <Card
                      elevation={0}
                      sx={{
                        borderRadius: 4,
                        border: '1px solid rgba(15,23,42,0.08)',
                        height: '100%',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between">
                            <Typography variant="subtitle1" fontWeight={700}>
                              {section.title}
                            </Typography>
                            <IconButton size="small" color="primary">
                              <ArrowForwardIcon />
                            </IconButton>
                          </Stack>
                          <Typography variant="body2" color="text.secondary">
                            {section.summary}
                          </Typography>
                          <Stack spacing={1}>
                            {section.highlights.map((highlight) => (
                              <Typography
                                key={highlight}
                                variant="body2"
                                sx={{ display: 'flex', gap: 1 }}
                              >
                                <Box
                                  component="span"
                                  sx={{
                                    width: 6,
                                    height: 6,
                                    borderRadius: '50%',
                                    bgcolor: 'primary.main',
                                    mt: '10px',
                                  }}
                                />
                                {highlight}
                              </Typography>
                            ))}
                          </Stack>
                        </Stack>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </Stack>
          </Stack>
        </CardContent>
      </Card>
    </Stack>
  );
}

export default StudyFlow;
