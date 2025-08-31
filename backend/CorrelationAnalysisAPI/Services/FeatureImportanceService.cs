using CorrelationAnalysisAPI.Models;

namespace CorrelationAnalysisAPI.Services
{
    public interface IFeatureImportanceService
    {
        Task<FeatureImportanceResponse> AnalyzeFeatureImportanceAsync(
            FeatureImportanceRequest request,
            string defectRatePath,
            string parametersPath);
    }

    public class FeatureImportanceService : IFeatureImportanceService
    {
        private readonly ICsvReaderService _csvReaderService;

        public FeatureImportanceService(ICsvReaderService csvReaderService)
        {
            _csvReaderService = csvReaderService;
        }

        public async Task<FeatureImportanceResponse> AnalyzeFeatureImportanceAsync(
            FeatureImportanceRequest request,
            string defectRatePath,
            string parametersPath)
        {
            var defectRates = await _csvReaderService.ReadDefectRatesAsync(defectRatePath);
            var parameters = await _csvReaderService.ReadParametersAsync(parametersPath);

            var filteredDefectRates = defectRates
                .Where(dr => request.ModelIds.Contains(dr.ModelId))
                .ToList();

            var filteredParameters = parameters
                .Where(p => p.DateTime >= request.DateFrom && p.DateTime <= request.DateTo)
                .ToList();

            var commonLotIds = filteredDefectRates.Select(dr => dr.LotId)
                .Intersect(filteredParameters.Select(p => p.LotId).Distinct())
                .ToList();

            var response = new FeatureImportanceResponse
            {
                DateFrom = request.DateFrom,
                DateTo = request.DateTo,
                ModelIds = request.ModelIds,
                TotalLots = commonLotIds.Count,
                Results = new List<FeatureImportanceResult>()
            };

            var parameterTypes = filteredParameters
                .Select(p => p.Type)
                .Distinct()
                .ToList();

            var dataMatrix = new List<Dictionary<string, double>>();
            var defectRateList = new List<double>();

            // Build feature matrix
            foreach (var lotId in commonLotIds)
            {
                var defectRate = filteredDefectRates
                    .FirstOrDefault(dr => dr.LotId == lotId)?.Rate;
                
                if (!defectRate.HasValue)
                    continue;

                var features = new Dictionary<string, double>();
                bool hasAllFeatures = true;

                foreach (var paramType in parameterTypes)
                {
                    var matchingParams = filteredParameters
                        .Where(p => p.LotId == lotId && p.Type == paramType)
                        .ToList();
                    
                    if (!matchingParams.Any())
                    {
                        hasAllFeatures = false;
                        break;
                    }
                    
                    var paramValue = matchingParams.Average(p => p.Value);
                    
                    if (double.IsNaN(paramValue))
                    {
                        hasAllFeatures = false;
                        break;
                    }

                    features[paramType] = paramValue;
                }

                if (hasAllFeatures)
                {
                    dataMatrix.Add(features);
                    defectRateList.Add(defectRate.Value);
                }
            }

            if (dataMatrix.Count >= 2 && parameterTypes.Count > 0)
            {
                var importanceScores = CalculateFeatureImportance(dataMatrix, defectRateList, parameterTypes);
                
                foreach (var paramType in parameterTypes)
                {
                    if (importanceScores.ContainsKey(paramType))
                    {
                        var importance = importanceScores[paramType];
                        var result = new FeatureImportanceResult
                        {
                            ParameterType = paramType,
                            Importance = Math.Round(importance, 4),
                            AbsoluteImportance = Math.Round(Math.Abs(importance), 4),
                            SampleSize = dataMatrix.Count,
                            Interpretation = InterpretImportance(importance)
                        };

                        response.Results.Add(result);
                    }
                }
            }

            response.Results = response.Results
                .OrderByDescending(r => r.AbsoluteImportance)
                .ToList();

            response.Summary = GenerateSummary(response);
            return response;
        }

        private Dictionary<string, double> CalculateFeatureImportance(
            List<Dictionary<string, double>> dataMatrix,
            List<double> targetValues,
            List<string> parameterTypes)
        {
            var importanceScores = new Dictionary<string, double>();
            
            if (dataMatrix.Count < 2 || parameterTypes.Count == 0)
                return importanceScores;

            // Calculate mean of target
            var targetMean = targetValues.Average();
            
            // Calculate variance of target
            var targetVariance = targetValues.Select(y => Math.Pow(y - targetMean, 2)).Average();
            
            if (targetVariance == 0)
            {
                foreach (var paramType in parameterTypes)
                {
                    importanceScores[paramType] = 0;
                }
                return importanceScores;
            }

            foreach (var paramType in parameterTypes)
            {
                var featureValues = dataMatrix.Select(row => row[paramType]).ToList();
                
                // Calculate correlation-based importance
                var correlationImportance = CalculateCorrelationImportance(featureValues, targetValues);
                
                // Calculate variance-based importance
                var varianceImportance = CalculateVarianceImportance(featureValues, targetValues, targetMean, targetVariance);
                
                // Combine both measures (weighted average)
                var combinedImportance = 0.6 * correlationImportance + 0.4 * varianceImportance;
                
                importanceScores[paramType] = combinedImportance;
            }

            // Normalize importance scores to sum to 1
            var totalAbsImportance = importanceScores.Values.Select(Math.Abs).Sum();
            if (totalAbsImportance > 0)
            {
                var normalizedScores = new Dictionary<string, double>();
                foreach (var kvp in importanceScores)
                {
                    normalizedScores[kvp.Key] = kvp.Value / totalAbsImportance;
                }
                return normalizedScores;
            }

            return importanceScores;
        }

        private double CalculateCorrelationImportance(List<double> featureValues, List<double> targetValues)
        {
            var n = featureValues.Count;
            if (n < 2) return 0;

            var featureMean = featureValues.Average();
            var targetMean = targetValues.Average();
            
            var numerator = featureValues.Zip(targetValues, (x, y) => (x - featureMean) * (y - targetMean)).Sum();
            var denomX = Math.Sqrt(featureValues.Select(x => Math.Pow(x - featureMean, 2)).Sum());
            var denomY = Math.Sqrt(targetValues.Select(y => Math.Pow(y - targetMean, 2)).Sum());
            
            if (denomX == 0 || denomY == 0) return 0;
            
            var correlation = numerator / (denomX * denomY);
            return Math.Abs(correlation);
        }

        private double CalculateVarianceImportance(List<double> featureValues, List<double> targetValues, 
            double targetMean, double targetVariance)
        {
            // Split data based on feature value (above/below median)
            var featureMedian = featureValues.OrderBy(x => x).Skip(featureValues.Count / 2).First();
            
            var belowMedian = new List<double>();
            var aboveMedian = new List<double>();
            
            for (int i = 0; i < featureValues.Count; i++)
            {
                if (featureValues[i] <= featureMedian)
                    belowMedian.Add(targetValues[i]);
                else
                    aboveMedian.Add(targetValues[i]);
            }
            
            if (belowMedian.Count == 0 || aboveMedian.Count == 0)
                return 0;
            
            var belowMean = belowMedian.Average();
            var aboveMean = aboveMedian.Average();
            
            // Calculate weighted variance reduction
            var totalCount = featureValues.Count;
            var belowWeight = (double)belowMedian.Count / totalCount;
            var aboveWeight = (double)aboveMedian.Count / totalCount;
            
            var belowVariance = belowMedian.Select(y => Math.Pow(y - belowMean, 2)).Average();
            var aboveVariance = aboveMedian.Select(y => Math.Pow(y - aboveMean, 2)).Average();
            
            var weightedVariance = belowWeight * belowVariance + aboveWeight * aboveVariance;
            var varianceReduction = targetVariance - weightedVariance;
            
            return Math.Max(0, varianceReduction / targetVariance);
        }

        private string InterpretImportance(double importance)
        {
            var absImportance = Math.Abs(importance);
            
            if (absImportance >= 0.3)
                return "High importance";
            else if (absImportance >= 0.15)
                return "Moderate importance";
            else if (absImportance >= 0.05)
                return "Low importance";
            else
                return "Very low importance";
        }

        private string GenerateSummary(FeatureImportanceResponse response)
        {
            if (!response.Results.Any())
                return "No feature importance analysis could be performed due to insufficient data.";

            var highImportanceFeatures = response.Results
                .Where(r => r.AbsoluteImportance >= 0.15)
                .ToList();

            if (highImportanceFeatures.Any())
            {
                var mostImportant = response.Results.First();
                return $"Found {highImportanceFeatures.Count} important features. " +
                       $"Most important: {mostImportant.ParameterType} " +
                       $"(importance: {mostImportant.AbsoluteImportance:F3}, {mostImportant.Interpretation}).";
            }

            return $"Analyzed {response.Results.Count} features. " +
                   "No highly important features found for predicting defect rate.";
        }
    }
}