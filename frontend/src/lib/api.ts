const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export interface DataRequest {
  from: string;
  to: string;
  modelIds: string[];
}

export interface CorrelationRequest {
  dateFrom: string;
  dateTo: string;
  modelIds: string[];
}

export interface FeatureImportanceRequest {
  dateFrom: string;
  dateTo: string;
  modelIds: string[];
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
    }

    return response.json();
  }

  // Health check endpoint
  async healthCheck(): Promise<{ status: string; timestamp: string }> {
    return this.request('/api/data/health');
  }

  // Data processing endpoint
  async processData(data: DataRequest): Promise<any> {
    return this.request('/api/data/process', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Correlation analysis endpoint
  async analyzeCorrelation(data: CorrelationRequest): Promise<any> {
    return this.request('/api/correlation/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Feature importance analysis endpoint
  async analyzeFeatureImportance(data: FeatureImportanceRequest): Promise<any> {
    return this.request('/api/feature-importance/analyze', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Get API info
  async getApiInfo(): Promise<any> {
    return this.request('/');
  }
}

export const apiClient = new ApiClient();