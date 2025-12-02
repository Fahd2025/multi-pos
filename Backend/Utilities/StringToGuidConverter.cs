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

            // Allow empty strings to fail gracefully
            if (string.IsNullOrWhiteSpace(stringValue))
            {
                throw new JsonException($"Cannot convert empty or whitespace string to Guid.");
            }

            if (Guid.TryParse(stringValue, out var guid))
            {
                return guid;
            }

            throw new JsonException($"Unable to convert \"{stringValue}\" to Guid. Expected a valid GUID format (e.g., '550e8400-e29b-41d4-a716-446655440000').");
        }

        // Handle number tokens - reject them with a clear message
        if (reader.TokenType == JsonTokenType.Number)
        {
            throw new JsonException($"Cannot convert number to Guid. Expected a string in GUID format, but received a number.");
        }

        throw new JsonException($"Unexpected token type: {reader.TokenType}. Expected String token for Guid deserialization.");
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
