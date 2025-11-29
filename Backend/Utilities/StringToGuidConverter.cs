using System.Text.Json;
using System.Text.Json.Serialization;

namespace Backend.Utilities;

/// <summary>
/// JSON converter that handles conversion from string to Guid
/// This allows the API to accept Guid values as strings from the frontend
/// </summary>
public class StringToGuidConverter : JsonConverter<Guid>
{
    public override Guid Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.String)
        {
            var stringValue = reader.GetString();
            if (Guid.TryParse(stringValue, out var guid))
            {
                return guid;
            }
            throw new JsonException($"Unable to convert \"{stringValue}\" to Guid.");
        }

        throw new JsonException($"Unexpected token type: {reader.TokenType}. Expected String.");
    }

    public override void Write(Utf8JsonWriter writer, Guid value, JsonSerializerOptions options)
    {
        writer.WriteStringValue(value.ToString());
    }
}

/// <summary>
/// JSON converter that handles conversion from string to nullable Guid
/// </summary>
public class StringToNullableGuidConverter : JsonConverter<Guid?>
{
    public override Guid? Read(ref Utf8JsonReader reader, Type typeToConvert, JsonSerializerOptions options)
    {
        if (reader.TokenType == JsonTokenType.Null)
        {
            return null;
        }

        if (reader.TokenType == JsonTokenType.String)
        {
            var stringValue = reader.GetString();

            if (string.IsNullOrEmpty(stringValue))
            {
                return null;
            }

            if (Guid.TryParse(stringValue, out var guid))
            {
                return guid;
            }
            throw new JsonException($"Unable to convert \"{stringValue}\" to Guid.");
        }

        throw new JsonException($"Unexpected token type: {reader.TokenType}. Expected String or Null.");
    }

    public override void Write(Utf8JsonWriter writer, Guid? value, JsonSerializerOptions options)
    {
        if (value.HasValue)
        {
            writer.WriteStringValue(value.Value.ToString());
        }
        else
        {
            writer.WriteNullValue();
        }
    }
}
