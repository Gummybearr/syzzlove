'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Tabs, 
  Tab, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline
} from '@mui/material';
import { 
  HealthAndSafety, 
  Info, 
  DataUsage, 
  Analytics, 
  TrendingUp 
} from '@mui/icons-material';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: {
      main: '#1976d2',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#f5f5f5',
      paper: '#ffffff',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
  },
});

export default function Home() {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApiCall = async (apiCall: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await apiCall();
      setResult(response);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
  };

  const ResultDisplay = () => {
    if (loading) {
      return (
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <CircularProgress size={24} />
          <Typography>Loading...</Typography>
        </Box>
      );
    }

    if (error) {
      return (
        <Alert severity="error" sx={{ mt: 2 }}>
          {error}
        </Alert>
      );
    }

    if (result) {
      return (
        <Alert severity="success" sx={{ mt: 2 }}>
          <Typography variant="subtitle1" gutterBottom>
            Response:
          </Typography>
          <Box
            component="pre"
            sx={{
              fontSize: '0.875rem',
              overflow: 'auto',
              backgroundColor: 'rgba(255, 255, 255, 0.05)',
              p: 2,
              borderRadius: 1,
              maxHeight: 400,
            }}
          >
            {JSON.stringify(result, null, 2)}
          </Box>
        </Alert>
      );
    }

    return null;
  };

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h3" component="h1" gutterBottom align="center">
          API Test Dashboard
        </Typography>

        <Paper sx={{ mt: 4 }}>
          <Tabs 
            value={activeTab} 
            onChange={handleTabChange} 
            variant="fullWidth"
            sx={{ borderBottom: 1, borderColor: 'divider' }}
          >
            <Tab icon={<HealthAndSafety />} label="Health Check" />
            <Tab icon={<Info />} label="API Info" />
            <Tab icon={<DataUsage />} label="Process Data" />
            <Tab icon={<Analytics />} label="Correlation Analysis" />
            <Tab icon={<TrendingUp />} label="Feature Importance" />
          </Tabs>

          <Box sx={{ p: 3 }}>
            {activeTab === 0 && <HealthCheck onApiCall={handleApiCall} />}
            {activeTab === 1 && <ApiInfo onApiCall={handleApiCall} />}
            {activeTab === 2 && <ProcessData onApiCall={handleApiCall} />}
            {activeTab === 3 && <CorrelationAnalysis onApiCall={handleApiCall} />}
            {activeTab === 4 && <FeatureImportance onApiCall={handleApiCall} />}

            <ResultDisplay />
          </Box>
        </Paper>
      </Container>
    </ThemeProvider>
  );
}

const HealthCheck = ({ onApiCall }: { onApiCall: (call: () => Promise<any>) => void }) => (
  <Box>
    <Typography variant="h5" gutterBottom>
      Health Check
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Check if the API server is running and healthy.
    </Typography>
    <Button
      variant="contained"
      color="success"
      onClick={() => onApiCall(() => apiClient.healthCheck())}
      startIcon={<HealthAndSafety />}
    >
      Check Health
    </Button>
  </Box>
);

const ApiInfo = ({ onApiCall }: { onApiCall: (call: () => Promise<any>) => void }) => (
  <Box>
    <Typography variant="h5" gutterBottom>
      API Information
    </Typography>
    <Typography variant="body1" color="text.secondary" paragraph>
      Get general information about the API and available endpoints.
    </Typography>
    <Button
      variant="contained"
      color="primary"
      onClick={() => onApiCall(() => apiClient.getApiInfo())}
      startIcon={<Info />}
    >
      Get API Info
    </Button>
  </Box>
);

const ProcessData = ({ onApiCall }: { onApiCall: (call: () => Promise<any>) => void }) => {
  const [fromDate, setFromDate] = useState('2024-01-01');
  const [toDate, setToDate] = useState('2024-12-31');
  const [modelIds, setModelIds] = useState('model1,model2');

  const handleSubmit = () => {
    const data = {
      from: fromDate,
      to: toDate,
      modelIds: modelIds.split(',').map(id => id.trim()),
    };
    onApiCall(() => apiClient.processData(data));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Process Data
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="From Date"
            value={fromDate}
            onChange={(e) => setFromDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="To Date"
            value={toDate}
            onChange={(e) => setToDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Model IDs (comma-separated)"
            value={modelIds}
            onChange={(e) => setModelIds(e.target.value)}
            placeholder="model1,model2,model3"
            helperText="Enter model IDs separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="secondary"
            onClick={handleSubmit}
            startIcon={<DataUsage />}
            size="large"
          >
            Process Data
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const CorrelationAnalysis = ({ onApiCall }: { onApiCall: (call: () => Promise<any>) => void }) => {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [modelIds, setModelIds] = useState('model1,model2');

  const handleSubmit = () => {
    const data = {
      dateFrom,
      dateTo,
      modelIds: modelIds.split(',').map(id => id.trim()),
    };
    onApiCall(() => apiClient.analyzeCorrelation(data));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Correlation Analysis
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Model IDs (comma-separated)"
            value={modelIds}
            onChange={(e) => setModelIds(e.target.value)}
            placeholder="model1,model2,model3"
            helperText="Enter model IDs separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="info"
            onClick={handleSubmit}
            startIcon={<Analytics />}
            size="large"
          >
            Analyze Correlation
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};

const FeatureImportance = ({ onApiCall }: { onApiCall: (call: () => Promise<any>) => void }) => {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [modelIds, setModelIds] = useState('model1,model2');

  const handleSubmit = () => {
    const data = {
      dateFrom,
      dateTo,
      modelIds: modelIds.split(',').map(id => id.trim()),
    };
    onApiCall(() => apiClient.analyzeFeatureImportance(data));
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom>
        Feature Importance Analysis
      </Typography>
      <Grid container spacing={3}>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Date From"
            value={dateFrom}
            onChange={(e) => setDateFrom(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12} sm={6}>
          <TextField
            fullWidth
            type="date"
            label="Date To"
            value={dateTo}
            onChange={(e) => setDateTo(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
        </Grid>
        <Grid item xs={12}>
          <TextField
            fullWidth
            label="Model IDs (comma-separated)"
            value={modelIds}
            onChange={(e) => setModelIds(e.target.value)}
            placeholder="model1,model2,model3"
            helperText="Enter model IDs separated by commas"
          />
        </Grid>
        <Grid item xs={12}>
          <Button
            variant="contained"
            color="warning"
            onClick={handleSubmit}
            startIcon={<TrendingUp />}
            size="large"
          >
            Analyze Feature Importance
          </Button>
        </Grid>
      </Grid>
    </Box>
  );
};
