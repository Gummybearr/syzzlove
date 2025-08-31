using Microsoft.AspNetCore.Mvc;
using CorrelationAnalysisAPI.Models;
using CorrelationAnalysisAPI.Services;

namespace CorrelationAnalysisAPI.Controllers
{
    [ApiController]
    [Route("api/feature-importance")]
    public class FeatureImportanceController : ControllerBase
    {
        private readonly IFeatureImportanceService _featureImportanceService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<FeatureImportanceController> _logger;

        public FeatureImportanceController(
            IFeatureImportanceService featureImportanceService,
            IConfiguration configuration,
            ILogger<FeatureImportanceController> logger)
        {
            _featureImportanceService = featureImportanceService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeFeatureImportance([FromBody] FeatureImportanceRequest request)
        {
            try
            {
                if (request == null)
                {
                    return BadRequest("Request body cannot be null");
                }

                if (request.ModelIds == null || !request.ModelIds.Any())
                {
                    return BadRequest("At least one model ID must be provided");
                }

                if (request.DateFrom >= request.DateTo)
                {
                    return BadRequest("DateFrom must be earlier than DateTo");
                }

                var dataPath = _configuration["DataPath"] ?? ".";
                var defectRatePath = Path.Combine(dataPath, "defect_rate.csv");
                var parametersPath = Path.Combine(dataPath, "params.csv");

                if (!System.IO.File.Exists(defectRatePath))
                {
                    return NotFound($"Defect rate file not found at: {defectRatePath}");
                }

                if (!System.IO.File.Exists(parametersPath))
                {
                    return NotFound($"Parameters file not found at: {parametersPath}");
                }

                var result = await _featureImportanceService.AnalyzeFeatureImportanceAsync(
                    request, defectRatePath, parametersPath);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing feature importance");
                return StatusCode(500, new { error = "An error occurred while analyzing feature importance", details = ex.Message });
            }
        }
    }
}