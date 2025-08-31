namespace CorrelationAnalysisAPI.Models
{
    public class FeatureImportanceResult
    {
        public string ParameterType { get; set; } = string.Empty;
        public double Importance { get; set; }
        public double AbsoluteImportance { get; set; }
        public int SampleSize { get; set; }
        public string Interpretation { get; set; } = string.Empty;
    }

    public class FeatureImportanceResponse
    {
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public List<string> ModelIds { get; set; } = new List<string>();
        public int TotalLots { get; set; }
        public List<FeatureImportanceResult> Results { get; set; } = new List<FeatureImportanceResult>();
        public string Summary { get; set; } = string.Empty;
    }
}