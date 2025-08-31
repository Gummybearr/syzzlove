namespace CorrelationAnalysisAPI.Models
{
    public class CorrelationRequest
    {
        public DateTime DateFrom { get; set; }
        public DateTime DateTo { get; set; }
        public List<string> ModelIds { get; set; } = new List<string>();
    }
}