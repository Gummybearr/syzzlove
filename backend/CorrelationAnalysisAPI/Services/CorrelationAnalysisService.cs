using MathNet.Numerics.Statistics;
using CorrelationAnalysisAPI.Models;

namespace CorrelationAnalysisAPI.Services
{
    public interface ICorrelationAnalysisService
    {
        Task<CorrelationResponse> AnalyzeCorrelationAsync(
            CorrelationRequest request,
            string defectRatePath,
            string parametersPath);
    }

    public class CorrelationAnalysisService : ICorrelationAnalysisService
    {
        private readonly ICsvReaderService _csvReaderService;

        public CorrelationAnalysisService(ICsvReaderService csvReaderService)
        {
            _csvReaderService = csvReaderService;
        }

        public async Task<CorrelationResponse> AnalyzeCorrelationAsync(
            CorrelationRequest request,
            string defectRatePath,
            string parametersPath)
        {
            var defectRates = await _csvReaderService.ReadDefectRatesAsync(defectRatePath);
            var parameters = await _csvReaderService.ReadParametersAsync(parametersPath);

            Console.WriteLine($"Total defect rates loaded: {defectRates.Count}");
            Console.WriteLine($"Total parameters loaded: {parameters.Count}");

            var filteredDefectRates = defectRates
                .Where(dr => request.ModelIds.Contains(dr.ModelId))
                .ToList();

            Console.WriteLine($"Filtered defect rates: {filteredDefectRates.Count}");
            if (filteredDefectRates.Any())
            {
                Console.WriteLine($"First defect rate LotId: {filteredDefectRates.First().LotId}");
            }

            var filteredParameters = parameters
                .Where(p => p.DateTime >= request.DateFrom && p.DateTime <= request.DateTo)
                .ToList();

            Console.WriteLine($"Filtered parameters: {filteredParameters.Count}");
            if (filteredParameters.Any())
            {
                Console.WriteLine($"First parameter LotId: {filteredParameters.First().LotId}");
            }

            var commonLotIds = filteredDefectRates.Select(dr => dr.LotId)
                .Intersect(filteredParameters.Select(p => p.LotId).Distinct())
                .ToList();

            Console.WriteLine($"Common LotIds: {commonLotIds.Count}");

            var response = new CorrelationResponse
            {
                DateFrom = request.DateFrom,
                DateTo = request.DateTo,
                ModelIds = request.ModelIds,
                TotalLots = commonLotIds.Count,
                Results = new List<CorrelationResult>()
            };

            var parameterTypes = filteredParameters
                .Select(p => p.Type)
                .Distinct()
                .ToList();

            foreach (var paramType in parameterTypes)
            {
                var correlationData = new List<(double defectRate, double paramValue)>();
                int missingDefectRate = 0;
                int missingParams = 0;
                int nanParamValues = 0;

                foreach (var lotId in commonLotIds)
                {
                    var defectRate = filteredDefectRates
                        .FirstOrDefault(dr => dr.LotId == lotId)?.Rate;
                    
                    var matchingParams = filteredParameters
                        .Where(p => p.LotId == lotId && p.Type == paramType)
                        .ToList();
                    
                    if (!matchingParams.Any())
                    {
                        missingParams++;
                        Console.WriteLine($"Missing {paramType} parameter for LotId: {lotId}");
                        continue;
                    }
                        
                    var paramValue = matchingParams.Average(p => p.Value);

                    if (!defectRate.HasValue)
                    {
                        missingDefectRate++;
                        continue;
                    }

                    if (double.IsNaN(paramValue))
                    {
                        nanParamValues++;
                        continue;
                    }

                    correlationData.Add((defectRate.Value, paramValue));
                }

                Console.WriteLine($"Parameter {paramType}: Total lots={commonLotIds.Count}, Missing defect rate={missingDefectRate}, Missing params={missingParams}, NaN param values={nanParamValues}, Valid samples={correlationData.Count}");

                if (correlationData.Count >= 2)
                {
                    var defectRateValues = correlationData.Select(cd => cd.defectRate).ToArray();
                    var paramValues = correlationData.Select(cd => cd.paramValue).ToArray();

                    var correlation = Correlation.Pearson(defectRateValues, paramValues);
                    
                    var result = new CorrelationResult
                    {
                        ParameterType = paramType,
                        CorrelationCoefficient = Math.Round(correlation, 4),
                        SampleSize = correlationData.Count,
                        PValue = CalculatePValue(correlation, correlationData.Count),
                        Interpretation = InterpretCorrelation(correlation)
                    };

                    response.Results.Add(result);
                }
            }

            response.Summary = GenerateSummary(response);
            return response;
        }

        private double CalculatePValue(double correlation, int sampleSize)
        {
            if (sampleSize <= 2) return 1.0;
            
            var t = correlation * Math.Sqrt((sampleSize - 2) / (1 - correlation * correlation));
            var df = sampleSize - 2;
            
            return 2 * (1 - StudentT(Math.Abs(t), df));
        }

        private double StudentT(double t, int df)
        {
            if (df <= 0) return 0.5;
            
            var x = df / (df + t * t);
            var a = df / 2.0;
            var b = 0.5;
            
            return 1 - 0.5 * IncompleteBeta(x, a, b);
        }

        private double IncompleteBeta(double x, double a, double b)
        {
            if (x <= 0) return 0;
            if (x >= 1) return 1;
            
            var bt = Math.Exp(GammaLn(a + b) - GammaLn(a) - GammaLn(b) +
                              a * Math.Log(x) + b * Math.Log(1 - x));
            
            if (x < (a + 1) / (a + b + 2))
                return bt * BetaContinuedFraction(x, a, b) / a;
            else
                return 1 - bt * BetaContinuedFraction(1 - x, b, a) / b;
        }

        private double GammaLn(double x)
        {
            var coefficients = new[] {
                76.18009172947146, -86.50532032941677,
                24.01409824083091, -1.231739572450155,
                0.1208650973866179e-2, -0.5395239384953e-5
            };
            
            var y = x;
            var tmp = x + 5.5;
            tmp -= (x + 0.5) * Math.Log(tmp);
            
            var ser = 1.000000000190015;
            for (int j = 0; j < coefficients.Length; j++)
                ser += coefficients[j] / ++y;
            
            return -tmp + Math.Log(2.5066282746310005 * ser / x);
        }

        private double BetaContinuedFraction(double x, double a, double b)
        {
            const int maxIterations = 100;
            const double epsilon = 1e-10;
            
            var qab = a + b;
            var qap = a + 1;
            var qam = a - 1;
            var c = 1.0;
            var d = 1 - qab * x / qap;
            
            if (Math.Abs(d) < epsilon) d = epsilon;
            d = 1 / d;
            var h = d;
            
            for (int m = 1; m <= maxIterations; m++)
            {
                var m2 = 2 * m;
                var aa = m * (b - m) * x / ((qam + m2) * (a + m2));
                d = 1 + aa * d;
                if (Math.Abs(d) < epsilon) d = epsilon;
                c = 1 + aa / c;
                if (Math.Abs(c) < epsilon) c = epsilon;
                d = 1 / d;
                h *= d * c;
                
                aa = -(a + m) * (qab + m) * x / ((a + m2) * (qap + m2));
                d = 1 + aa * d;
                if (Math.Abs(d) < epsilon) d = epsilon;
                c = 1 + aa / c;
                if (Math.Abs(c) < epsilon) c = epsilon;
                d = 1 / d;
                var del = d * c;
                h *= del;
                
                if (Math.Abs(del - 1) < epsilon) break;
            }
            
            return h;
        }

        private string InterpretCorrelation(double correlation)
        {
            var absCorr = Math.Abs(correlation);
            var direction = correlation >= 0 ? "Positive" : "Negative";
            
            if (absCorr >= 0.9)
                return $"Very strong {direction.ToLower()} correlation";
            else if (absCorr >= 0.7)
                return $"Strong {direction.ToLower()} correlation";
            else if (absCorr >= 0.5)
                return $"Moderate {direction.ToLower()} correlation";
            else if (absCorr >= 0.3)
                return $"Weak {direction.ToLower()} correlation";
            else
                return "Very weak or no correlation";
        }

        private string GenerateSummary(CorrelationResponse response)
        {
            if (!response.Results.Any())
                return "No correlation analysis could be performed due to insufficient data.";

            var strongCorrelations = response.Results
                .Where(r => Math.Abs(r.CorrelationCoefficient) >= 0.5)
                .OrderByDescending(r => Math.Abs(r.CorrelationCoefficient))
                .ToList();

            if (strongCorrelations.Any())
            {
                var strongest = strongCorrelations.First();
                return $"Found {strongCorrelations.Count} significant correlations. " +
                       $"Strongest: {strongest.ParameterType} ({strongest.CorrelationCoefficient:F3}, {strongest.Interpretation}).";
            }

            return $"Analyzed {response.Results.Count} parameters. " +
                   "No strong correlations found with defect rate.";
        }
    }
}