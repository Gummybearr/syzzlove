'use client';

import { useState } from 'react';
import { apiClient } from '@/lib/api';
import { 
  Box, 
  Container, 
  Typography, 
  Paper, 
  Button, 
  TextField, 
  Grid, 
  Alert, 
  CircularProgress,
  ThemeProvider,
  createTheme,
  CssBaseline,
  AppBar,
  Toolbar,
  Card,
  CardContent,
  CardHeader,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  OutlinedInput
} from '@mui/material';
import { 
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
  components: {
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: '#ffffff',
          color: '#000000',
          boxShadow: '0px 1px 3px rgba(0, 0, 0, 0.12)',
        },
      },
    },
  },
});

const modelOptions = Array.from({ length: 50 }, (_, i) => 
  `Model${String(i + 1).padStart(3, '0')}`
);

export default function Home() {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [selectedModels, setSelectedModels] = useState<string[]>(['Model001', 'Model002']);
  
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [correlationResult, setCorrelationResult] = useState<any>(null);
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureResult, setFeatureResult] = useState<any>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    const data = {
      dateFrom,
      dateTo,
      modelIds: selectedModels,
    };

    // Correlation Analysis
    setCorrelationLoading(true);
    setCorrelationError(null);
    setCorrelationResult(null);

    // Feature Importance Analysis
    setFeatureLoading(true);
    setFeatureError(null);
    setFeatureResult(null);

    // Run both APIs simultaneously
    const correlationPromise = apiClient.analyzeCorrelation(data)
      .then(result => {
        setCorrelationResult(result);
      })
      .catch(err => {
        setCorrelationError(err instanceof Error ? err.message : 'An error occurred');
      })
      .finally(() => {
        setCorrelationLoading(false);
      });

    const featurePromise = apiClient.analyzeFeatureImportance(data)
      .then(result => {
        setFeatureResult(result);
      })
      .catch(err => {
        setFeatureError(err instanceof Error ? err.message : 'An error occurred');
      })
      .finally(() => {
        setFeatureLoading(false);
      });

    await Promise.all([correlationPromise, featurePromise]);
  };

  const AnalysisResultCard = ({ 
    title, 
    icon, 
    loading, 
    error, 
    result 
  }: {
    title: string;
    icon: React.ReactNode;
    loading: boolean;
    error: string | null;
    result: any;
  }) => (
    <Card sx={{ height: '100%' }}>
      <CardHeader
        title={title}
        avatar={icon}
        sx={{ pb: 1 }}
      />
      <CardContent>
        {loading && (
          <Box display="flex" alignItems="center" gap={2}>
            <CircularProgress size={24} />
            <Typography>분석 중...</Typography>
          </Box>
        )}
        
        {error && !loading && (
          <Alert severity="error">
            {error}
          </Alert>
        )}
        
        {result && !loading && !error && (
          <Alert severity="success">
            <Typography variant="subtitle2" gutterBottom>
              분석 결과:
            </Typography>
            <Box
              component="pre"
              sx={{
                fontSize: '0.75rem',
                overflow: 'auto',
                backgroundColor: 'rgba(0, 0, 0, 0.05)',
                p: 2,
                borderRadius: 1,
                maxHeight: 300,
                whiteSpace: 'pre-wrap',
              }}
            >
              {JSON.stringify(result, null, 2)}
            </Box>
          </Alert>
        )}
        
        {!loading && !error && !result && (
          <Typography variant="body2" color="text.secondary">
            분석 결과가 여기에 표시됩니다.
          </Typography>
        )}
      </CardContent>
    </Card>
  );

  return (
    <ThemeProvider theme={lightTheme}>
      <CssBaseline />
      
      {/* Header */}
      <AppBar position="static" elevation={1}>
        <Toolbar>
          <Typography variant="h6" component="h1" sx={{ flexGrow: 1 }}>
            DAS
          </Typography>
          <Button 
            sx={{ color: '#000000' }} 
            startIcon={<Analytics />}
          >
            분석
          </Button>
        </Toolbar>
      </AppBar>

      {/* Main Content */}
      <Container maxWidth="lg" sx={{ py: 4 }}>
        {/* Analysis Form */}
        <Paper sx={{ p: 3, mb: 4 }}>
          <Typography variant="h5" gutterBottom>
            분석 조건 설정
          </Typography>
          
          <Grid container spacing={3}>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="시작 날짜"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                fullWidth
                type="date"
                label="종료 날짜"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth>
                <InputLabel>모델 ID</InputLabel>
                <Select
                  multiple
                  value={selectedModels}
                  onChange={(e) => setSelectedModels(e.target.value as string[])}
                  input={<OutlinedInput label="모델 ID" />}
                  renderValue={(selected) => (
                    <Box sx={{ display: 'flex', flexWrap: 'nowrap', gap: 0.5, overflow: 'hidden' }}>
                      {selected.slice(0, 3).map((value) => (
                        <Chip key={value} label={value} size="small" />
                      ))}
                      {selected.length > 3 && (
                        <Chip label={`+${selected.length - 3}`} size="small" color="primary" />
                      )}
                    </Box>
                  )}
                >
                  {modelOptions.map((model) => (
                    <MenuItem key={model} value={model}>
                      {model}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                color="primary"
                onClick={handleAnalysis}
                startIcon={<Analytics />}
                size="large"
                disabled={correlationLoading || featureLoading}
              >
                분석 실행
              </Button>
            </Grid>
          </Grid>
        </Paper>

        {/* Results */}
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <AnalysisResultCard
              title="상관관계 분석"
              icon={<Analytics color="primary" />}
              loading={correlationLoading}
              error={correlationError}
              result={correlationResult}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <AnalysisResultCard
              title="특성 중요도 분석"
              icon={<TrendingUp color="secondary" />}
              loading={featureLoading}
              error={featureError}
              result={featureResult}
            />
          </Grid>
        </Grid>
      </Container>
    </ThemeProvider>
  );
}

