using CsvHelper;
using CsvHelper.Configuration;
using System.Globalization;
using CorrelationAnalysisAPI.Models;

namespace CorrelationAnalysisAPI.Services
{
    public interface ICsvReaderService
    {
        Task<List<DefectRate>> ReadDefectRatesAsync(string filePath);
        Task<List<Parameter>> ReadParametersAsync(string filePath);
    }

    public class CsvReaderService : ICsvReaderService
    {
        public async Task<List<DefectRate>> ReadDefectRatesAsync(string filePath)
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true
            });
            
            var records = new List<DefectRate>();
            await foreach (var record in csv.GetRecordsAsync<dynamic>())
            {
                var dict = record as IDictionary<string, object>;
                if (dict != null)
                {
                    var modelId = dict.ContainsKey("ModelID") ? dict["ModelID"]?.ToString() ?? "" :
                                  dict.ContainsKey("model_id") ? dict["model_id"]?.ToString() ?? "" : "";
                    var lotId = dict.ContainsKey("LotID") ? dict["LotID"]?.ToString() ?? "" :
                                dict.ContainsKey("lot_id") ? dict["lot_id"]?.ToString() ?? "" : "";
                    var rate = dict.ContainsKey("DefectRate") ? Convert.ToDouble(dict["DefectRate"]) :
                               dict.ContainsKey("defect_rate") ? Convert.ToDouble(dict["defect_rate"]) : 0;
                    
                    records.Add(new DefectRate
                    {
                        ModelId = modelId,
                        LotId = lotId,
                        Rate = rate
                    });
                }
            }
            
            return records;
        }

        public async Task<List<Parameter>> ReadParametersAsync(string filePath)
        {
            using var reader = new StreamReader(filePath);
            using var csv = new CsvReader(reader, new CsvConfiguration(CultureInfo.InvariantCulture)
            {
                HasHeaderRecord = true
            });
            
            var records = new List<Parameter>();
            await foreach (var record in csv.GetRecordsAsync<dynamic>())
            {
                var dict = record as IDictionary<string, object>;
                if (dict != null)
                {
                    var lotId = dict.ContainsKey("LotID") ? dict["LotID"]?.ToString() ?? "" :
                                dict.ContainsKey("lot_id") ? dict["lot_id"]?.ToString() ?? "" : "";
                    var dateTime = dict.ContainsKey("DateTime") ? DateTime.Parse(dict["DateTime"]?.ToString() ?? DateTime.Now.ToString()) :
                                   dict.ContainsKey("datetime") ? DateTime.Parse(dict["datetime"]?.ToString() ?? DateTime.Now.ToString()) : DateTime.Now;
                    var type = dict.ContainsKey("Type") ? dict["Type"]?.ToString() ?? "" :
                               dict.ContainsKey("type") ? dict["type"]?.ToString() ?? "" : "";
                    var value = dict.ContainsKey("Value") ? Convert.ToDouble(dict["Value"]) :
                                dict.ContainsKey("value") ? Convert.ToDouble(dict["value"]) : 0;
                    
                    records.Add(new Parameter
                    {
                        LotId = lotId,
                        DateTime = dateTime,
                        Type = type,
                        Value = value
                    });
                }
            }
            
            return records;
        }
    }
}