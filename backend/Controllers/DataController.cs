using Microsoft.AspNetCore.Mvc;
using System;
using System.Collections.Generic;
using System.Linq;
using WebApi.Models;

namespace WebApi.Controllers
{
    [ApiController]
    [Route("api/data")]
    public class DataController : ControllerBase
    {
        [HttpPost("process")]
        public IActionResult ProcessData([FromBody] DataRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            if (request.From > request.To)
            {
                return BadRequest(new { error = "From date must be before or equal to To date" });
            }

            if (request.ModelIds == null || !request.ModelIds.Any())
            {
                return BadRequest(new { error = "At least one model ID is required" });
            }

            var response = new
            {
                message = "Data processed successfully",
                from = request.From,
                to = request.To,
                modelCount = request.ModelIds.Count,
                modelIds = request.ModelIds,
                processedAt = DateTime.UtcNow
            };

            return Ok(response);
        }

        [HttpGet("health")]
        public IActionResult HealthCheck()
        {
            return Ok(new { status = "healthy", timestamp = DateTime.UtcNow });
        }
    }
}