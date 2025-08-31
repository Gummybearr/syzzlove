namespace CorrelationAnalysisAPI.Models
{
    public class Parameter
    {
        public string LotId { get; set; } = string.Empty;
        public DateTime DateTime { get; set; }
        public string Type { get; set; } = string.Empty;
        public double Value { get; set; }
    }
}