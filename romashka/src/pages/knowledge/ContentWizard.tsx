import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Paper, TextField, Tabs, Tab } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import Dropzone from 'react-dropzone';

const steps = ['Input Method', 'Content', 'Preview', 'SEO'];

export default function ContentWizard() {
  const [activeStep, setActiveStep] = useState(0);
  const [inputMethod, setInputMethod] = useState<'url' | 'file' | 'manual'>('manual');
  const [url, setUrl] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [content, setContent] = useState('');
  const [tab, setTab] = useState(0);

  const handleNext = () => setActiveStep(s => s + 1);
  const handleBack = () => setActiveStep(s => s - 1);

  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 4 }}>
        {steps.map(label => <Step key={label}><StepLabel>{label}</StepLabel></Step>)}
      </Stepper>
      {activeStep === 0 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" mb={2}>Choose Input Method</Typography>
          <Tabs value={tab} onChange={(_, v) => { setTab(v); setInputMethod(['manual', 'url', 'file'][v] as 'manual' | 'url' | 'file'); }}>
            <Tab label="Manual" />
            <Tab label="URL" />
            <Tab label="File" />
          </Tabs>
        </Paper>
      )}
      {activeStep === 1 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          {inputMethod === 'manual' && (
            <TextField label="Content (Markdown supported)" multiline minRows={6} fullWidth value={content} onChange={e => setContent(e.target.value)} />
          )}
          {inputMethod === 'url' && (
            <TextField label="Paste URL" fullWidth value={url} onChange={e => setUrl(e.target.value)} />
          )}
          {inputMethod === 'file' && (
            <Dropzone onDrop={accepted => setFile(accepted[0])} multiple={false}>
              {({ getRootProps, getInputProps }) => (
                <Paper {...getRootProps()} sx={{ p: 3, textAlign: 'center', cursor: 'pointer', bgcolor: 'grey.100', mt: 2 }}>
                  <input {...getInputProps()} />
                  {file ? file.name : 'Drag & drop or click to select a file'}
                </Paper>
              )}
            </Dropzone>
          )}
        </Paper>
      )}
      {activeStep === 2 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" mb={2}>Preview</Typography>
          <Box sx={{ bgcolor: 'grey.50', p: 2, borderRadius: 2 }}>
            <ReactMarkdown>{content || 'Nothing to preview.'}</ReactMarkdown>
          </Box>
        </Paper>
      )}
      {activeStep === 3 && (
        <Paper sx={{ p: 3, mb: 2 }}>
          <Typography variant="h6" mb={2}>SEO Suggestions</Typography>
          <ul>
            <li>Use clear, concise titles</li>
            <li>Add relevant tags and keywords</li>
            <li>Structure content with headings</li>
            <li>Keep answers short and actionable</li>
          </ul>
        </Paper>
      )}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
        <Button disabled={activeStep === 0} onClick={handleBack}>Back</Button>
        <Button variant="contained" onClick={handleNext} disabled={activeStep === steps.length - 1}>Next</Button>
      </Box>
    </Box>
  );
} 