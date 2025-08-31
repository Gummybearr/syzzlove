namespace CorrelationAnalysisAPI.Models
{
    public class CorrelationResult
    {
        public string ParameterType { get; set; } = string.Empty;
        public double CorrelationCoefficient { get; set; }
        public double PValue { get; set; }
        public int SampleSize { get; set; }
        public string Interpretation { get; set; } = string.Empty;
    }

    public class CorrelationResponse
    {
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public List<string> ModelIds { get; set; } = new List<string>();
        public int TotalLots { get; set; }
        public List<CorrelationResult> Results { get; set; } = new List<CorrelationResult>();
        public string Summary { get; set; } = string.Empty;
    }
}