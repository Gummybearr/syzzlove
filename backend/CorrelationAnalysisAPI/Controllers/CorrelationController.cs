using Microsoft.AspNetCore.Mvc;
using CorrelationAnalysisAPI.Models;
using CorrelationAnalysisAPI.Services;

namespace CorrelationAnalysisAPI.Controllers
{
    [ApiController]
    [Route("api/correlation")]
    public class CorrelationController : ControllerBase
    {
        private readonly ICorrelationAnalysisService _correlationService;
        private readonly IConfiguration _configuration;
        private readonly ILogger<CorrelationController> _logger;

        public CorrelationController(
            ICorrelationAnalysisService correlationService,
            IConfiguration configuration,
            ILogger<CorrelationController> logger)
        {
            _correlationService = correlationService;
            _configuration = configuration;
            _logger = logger;
        }

        [HttpPost("analyze")]
        public async Task<IActionResult> AnalyzeCorrelation([FromBody] CorrelationRequest request)
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

                var result = await _correlationService.AnalyzeCorrelationAsync(
                    request, defectRatePath, parametersPath);

                return Ok(result);
            }
            catch (Exception ex)
            {
                _logger.LogError(ex, "Error analyzing correlation");
                return StatusCode(500, new { error = "An error occurred while analyzing correlation", details = ex.Message });
            }
        }
    }
}