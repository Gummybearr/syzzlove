'use client';

import { useState, useEffect } from 'react';
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
  OutlinedInput,
  List,
  ListItem,
  ListItemButton,
  ListItemText
} from '@mui/material';
import { 
  Analytics, 
  TrendingUp 
} from '@mui/icons-material';
import {
  ScatterChart,
  Scatter,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell
} from 'recharts';

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

type DefectRateData = {
  ModelID: string;
  LotID: string;
  DefectDate: string;
  DefectRate: number;
};

type ParamsData = {
  LotID: string;
  DateTime: string;
  Type: string;
  Value: number;
};

export default function Home() {
  const [dateFrom, setDateFrom] = useState('2024-01-01');
  const [dateTo, setDateTo] = useState('2024-12-31');
  const [selectedModels, setSelectedModels] = useState<string[]>([]);
  const [modelOptions, setModelOptions] = useState<string[]>([]);
  
  const [correlationLoading, setCorrelationLoading] = useState(false);
  const [correlationResult, setCorrelationResult] = useState<any>(null);
  const [correlationError, setCorrelationError] = useState<string | null>(null);
  
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureResult, setFeatureResult] = useState<any>(null);
  const [featureError, setFeatureError] = useState<string | null>(null);
  
  const [defectRateData, setDefectRateData] = useState<DefectRateData[]>([]);
  const [paramsData, setParamsData] = useState<ParamsData[]>([]);
  const [selectedParameter, setSelectedParameter] = useState<string>('');
  const [correlationFactors, setCorrelationFactors] = useState(['thickness', 'temperature', 'humidity']);

  useEffect(() => {
    loadModels();
    loadData();
  }, []);

  const loadModels = async () => {
    try {
      const response = await fetch('/api/models');
      const models = await response.json();
      setModelOptions(models);
      if (models.length > 0 && selectedModels.length === 0) {
        setSelectedModels(models.slice(0, 2));
      }
    } catch (error) {
      console.error('Error loading models:', error);
    }
  };

  const loadData = async (modelIds: string[] = selectedModels) => {
    try {
      const modelIdsParam = modelIds.join(',');
      
      const defectResponse = await fetch(`/api/defect-rate?modelIds=${modelIdsParam}`);
      const defectData = await defectResponse.json();
      setDefectRateData(defectData);
      
      const paramsResponse = await fetch(`/api/params?modelIds=${modelIdsParam}`);
      const paramData = await paramsResponse.json();
      setParamsData(paramData);
    } catch (error) {
      console.error('Error loading data:', error);
    }
  };

  const handleAnalysis = async () => {
    // 먼저 선택된 모델의 데이터를 다시 로드
    await loadData(selectedModels);
    
    const data = {
      dateFrom,
      dateTo,
      modelIds: selectedModels,
    };

    setCorrelationLoading(true);
    setCorrelationError(null);
    setCorrelationResult(null);

    setFeatureLoading(true);
    setFeatureError(null);
    setFeatureResult(null);

    const correlationPromise = apiClient.analyzeCorrelation(data)
      .then(result => {
        setCorrelationResult(result);
        if (result.results) {
          const sortedFactors = result.results
            .sort((a: any, b: any) => Math.abs(b.correlationCoefficient) - Math.abs(a.correlationCoefficient))
            .map((item: any) => item.parameterType);
          setCorrelationFactors(sortedFactors);
        }
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

  const getDefectRateChartData = () => {
    if (!Array.isArray(defectRateData) || defectRateData.length === 0) return [];
    const filteredData = defectRateData
      .filter(item => selectedModels.includes(item.ModelID))
      .map((item) => {
        const dateObj = new Date(item.DefectDate);
        return {
          lotId: item.LotID,
          defectRate: item.DefectRate,
          modelId: item.ModelID,
          date: item.DefectDate,
          dateObj: dateObj,
          dateTimestamp: dateObj.getTime()
        };
      })
      .sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    return filteredData;
  };

  const getParameterChartData = () => {
    if (!selectedParameter || !Array.isArray(paramsData) || !Array.isArray(defectRateData)) return [];
    
    const parameterData = paramsData.filter(item => item.Type === selectedParameter);
    const defectMap = new Map(defectRateData.map(item => [item.LotID, item.DefectRate]));
    
    return parameterData.map(item => ({
      paramValue: item.Value,
      defectRate: defectMap.get(item.LotID) || 0,
      lotId: item.LotID
    }));
  };

  const getFeatureImportanceChartData = () => {
    if (!featureResult || !featureResult.results) return [];
    
    return featureResult.results
      .sort((a: any, b: any) => b.importance - a.importance)
      .map((item: any) => ({
        name: item.parameterType,
        importance: item.importance,
        formattedImportance: (item.importance * 100).toFixed(1),
        interpretation: item.interpretation
      }));
  };

  const getParameterTimeSeriesData = () => {
    if (!selectedParameter || !Array.isArray(paramsData)) return [];
    
    const parameterData = paramsData
      .filter(item => item.Type === selectedParameter)
      .filter(item => selectedModels.some(modelId => item.LotID.includes(modelId)))
      .map((item) => {
        const dateObj = new Date(item.DateTime);
        return {
          lotId: item.LotID,
          paramValue: item.Value,
          date: item.DateTime,
          dateObj: dateObj,
          dateTimestamp: dateObj.getTime(),
          modelId: item.LotID.split('_')[0]
        };
      })
      .sort((a, b) => a.dateTimestamp - b.dateTimestamp);
    
    return parameterData;
  };

  const getModelColors = () => {
    const colors = ['#8884d8', '#82ca9d', '#ffc658', '#ff7c7c', '#8dd1e1'];
    return selectedModels.reduce((acc, model, index) => {
      acc[model] = colors[index % colors.length];
      return acc;
    }, {} as Record<string, string>);
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

        {/* 상단 Defect Rate 산점도 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            Defect Rate by Lot (선택된 모델)
          </Typography>
          <ResponsiveContainer width="100%" height={300}>
            <ScatterChart data={getDefectRateChartData()}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis 
                dataKey="dateTimestamp"
                type="number"
                scale="time"
                domain={[(dataMin) => dataMin - (86400000 * 10), (dataMax) => dataMax + (86400000 * 10)]}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getMonth() + 1}/${date.getDate()}`;
                }}
              />
              <YAxis dataKey="defectRate" type="number" />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    const data = payload[0].payload;
                    return (
                      <div style={{ 
                        backgroundColor: 'white', 
                        padding: '10px', 
                        border: '1px solid #ccc', 
                        borderRadius: '4px',
                        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                      }}>
                        <p style={{ margin: '2px 0' }}>{`Date: ${data.date}`}</p>
                        <p style={{ margin: '2px 0' }}>{`Lot: ${data.lotId}`}</p>
                        <p style={{ margin: '2px 0' }}>{`Model: ${data.modelId}`}</p>
                        <p style={{ margin: '2px 0' }}>{`Defect Rate: ${data.defectRate}%`}</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Legend />
              {selectedModels.map((modelId) => {
                const colors = getModelColors();
                return (
                  <Scatter
                    key={modelId}
                    name={modelId}
                    data={getDefectRateChartData().filter(item => item.modelId === modelId)}
                    fill={colors[modelId]}
                  />
                );
              })}
            </ScatterChart>
          </ResponsiveContainer>
        </Paper>

        {/* 상관관계 혐의인자 리스트 */}
        <Paper sx={{ p: 2, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            상관관계 혐의인자
          </Typography>
          <Grid container spacing={2}>
            {correlationFactors.map((factor) => {
              const correlationInfo = correlationResult?.results?.find(
                (r: any) => r.parameterType === factor
              );
              return (
                <Grid item key={factor}>
                  <Button
                    variant={selectedParameter === factor ? "contained" : "outlined"}
                    onClick={() => setSelectedParameter(factor)}
                    size="small"
                  >
                    {factor}
                    {correlationInfo && (
                      <Typography variant="caption" sx={{ ml: 1 }}>
                        (r={correlationInfo.correlationCoefficient.toFixed(3)})
                      </Typography>
                    )}
                  </Button>
                </Grid>
              );
            })}
          </Grid>
        </Paper>

        {/* 파라미터별 산점도 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedParameter ? `${selectedParameter} vs Defect Rate` : '파라미터를 선택하세요'}
          </Typography>
          {selectedParameter && (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={getParameterChartData()} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="paramValue" 
                  type="number"
                  name={selectedParameter}
                  label={{ value: selectedParameter, position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="defectRate" 
                  type="number"
                  name="Defect Rate"
                  label={{ value: 'Defect Rate (%)', angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  formatter={(value, name) => [value, name]}
                  labelFormatter={(label) => `Lot: ${label}`}
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div className="bg-white p-2 border border-gray-300 rounded shadow">
                          <p>{`Lot: ${data.lotId}`}</p>
                          <p>{`${selectedParameter}: ${data.paramValue}`}</p>
                          <p>{`Defect Rate: ${data.defectRate}%`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Scatter name="Data Points" data={getParameterChartData()} fill="#8884d8" />
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* 선택된 파라미터의 시계열 그래프 */}
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>
            {selectedParameter ? `${selectedParameter} Time Series` : '파라미터를 선택하세요'}
          </Typography>
          {selectedParameter && (
            <ResponsiveContainer width="100%" height={400}>
              <ScatterChart data={getParameterTimeSeriesData()} margin={{ top: 20, right: 30, bottom: 50, left: 20 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis 
                  dataKey="dateTimestamp"
                  type="number"
                  scale="time"
                  domain={[(dataMin) => dataMin - (86400000 * 5), (dataMax) => dataMax + (86400000 * 5)]}
                  tickFormatter={(value) => {
                    const date = new Date(value);
                    return `${date.getMonth() + 1}/${date.getDate()}`;
                  }}
                  tick={{ fontSize: 10 }}
                  label={{ value: 'Date', position: 'insideBottom', offset: -5 }}
                />
                <YAxis 
                  dataKey="paramValue" 
                  type="number"
                  label={{ value: selectedParameter, angle: -90, position: 'insideLeft' }}
                />
                <Tooltip 
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload;
                      return (
                        <div style={{ 
                          backgroundColor: 'white', 
                          padding: '10px', 
                          border: '1px solid #ccc', 
                          borderRadius: '4px',
                          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                        }}>
                          <p style={{ margin: '2px 0' }}>{`Date: ${data.date}`}</p>
                          <p style={{ margin: '2px 0' }}>{`Lot: ${data.lotId}`}</p>
                          <p style={{ margin: '2px 0' }}>{`Model: ${data.modelId}`}</p>
                          <p style={{ margin: '2px 0' }}>{`${selectedParameter}: ${data.paramValue}`}</p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend />
                {selectedModels.map((modelId) => {
                  const colors = getModelColors();
                  return (
                    <Scatter
                      key={modelId}
                      name={modelId}
                      data={getParameterTimeSeriesData().filter(item => item.modelId === modelId)}
                      fill={colors[modelId]}
                    />
                  );
                })}
              </ScatterChart>
            </ResponsiveContainer>
          )}
        </Paper>

        {/* Feature Importance 별도 섹션 */}
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Feature Importance
          </Typography>
          {featureResult && featureResult.results ? (
            <>
              <div style={{ fontSize: '12px', marginBottom: '10px' }}>
                {JSON.stringify(getFeatureImportanceChartData(), null, 2)}
              </div>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart 
                  data={getFeatureImportanceChartData()} 
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 80, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    type="number" 
                    domain={[0, 'dataMax']}
                  />
                  <YAxis 
                    dataKey="name" 
                    type="category" 
                    width={70}
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip 
                    content={({ active, payload }) => {
                      if (active && payload && payload.length) {
                        const data = payload[0].payload;
                        return (
                          <div style={{ 
                            backgroundColor: 'white', 
                            padding: '10px', 
                            border: '1px solid #ccc', 
                            borderRadius: '4px',
                            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                          }}>
                            <p style={{ margin: '2px 0' }}>{`Parameter: ${data.name}`}</p>
                            <p style={{ margin: '2px 0' }}>{`Importance: ${data.formattedImportance}%`}</p>
                            <p style={{ margin: '2px 0' }}>{`Level: ${data.interpretation}`}</p>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Bar dataKey="importance" fill="#82ca9d" />
                </BarChart>
              </ResponsiveContainer>
            </>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mt: 10 }}>
              분석을 실행하여 Feature Importance 결과를 확인하세요.
            </Typography>
          )}
        </Paper>

        {/* 기존 분석 결과 */}
        <Grid container spacing={3} sx={{ mt: 2 }}>
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

