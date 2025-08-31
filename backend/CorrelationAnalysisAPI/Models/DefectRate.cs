namespace CorrelationAnalysisAPI.Models
{
    public class DefectRate
    {
        public string ModelId { get; set; } = string.Empty;
        public string LotId { get; set; } = string.Empty;
        public double Rate { get; set; }
    }
}