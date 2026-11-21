import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { convertToUrdu, clearTranslationCache } from "./translateToUrdu";

// Mock axios for all API calls in this test file.
vi.mock("axios", () => ({
  default: {
    get: vi.fn(),
  },
}));

import axios from "axios";
const mockedAxiosGet = vi.mocked(axios.get);

beforeEach(() => {
  clearTranslationCache();
  vi.clearAllMocks();
});

afterEach(() => {
  clearTranslationCache();
});

describe("convertToUrdu()", () => {
  it("should return Urdu script text as is", async () => {
    const urduText = "الله تعالیٰ کے بارے میں بات";
    const result = await convertToUrdu(urduText);
    expect(result).toBe(urduText);
    expect(mockedAxiosGet).not.toHaveBeenCalled();
  });

  it("should translate English text to Urdu via MyMemory API", async () => {
    mockedAxiosGet.mockResolvedValueOnce({
      data: {
        responseData: { translatedText: "کیا حال ہے" },
      },
    });

    const result = await convertToUrdu("How are you");
    expect(result).toBe("کیا حال ہے");
    expect(mockedAxiosGet).toHaveBeenCalledWith(
      expect.stringContaining("langpair=en|ur"),
      expect.anything()
    );
  });

  it("should transliterate Roman Urdu via Google Input Tools API", async () => {
    // franc detects "und" for short/unclear text; isRomanUrdu returns true.
    mockedAxiosGet.mockResolvedValueOnce({
      data: [
        null,
        [[[null, ["کیا حال ہے"]]]],
      ],
    });

    const result = await convertToUrdu("kya hal hai");
    expect(result).toBe("کیا حال ہے");
  });

  it("should return original text when MyMemory API fails", async () => {
    mockedAxiosGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await convertToUrdu("Hello world");
    expect(result).toBe("Hello world");
  });

  it("should return original text when Google Input Tools API fails", async () => {
    // Force Roman Urdu path by using common words; API fails.
    mockedAxiosGet.mockRejectedValueOnce(new Error("Network error"));

    const result = await convertToUrdu("kya hal hai aap");
    expect(result).toBe("kya hal hai aap");
  });

  it("should cache translation results and avoid repeated API calls", async () => {
    mockedAxiosGet.mockResolvedValue({
      data: {
        responseData: { translatedText: "ترجمہ شدہ متن" },
      },
    });

    const result1 = await convertToUrdu("This is a test sentence for language detection");
    const result2 = await convertToUrdu("This is a test sentence for language detection");

    expect(result1).toBe("ترجمہ شدہ متن");
    expect(result2).toBe("ترجمہ شدہ متن");
    // API should only be called once due to caching.
    expect(mockedAxiosGet).toHaveBeenCalledTimes(1);
  });

  it("should return empty string for empty input", async () => {
    const result = await convertToUrdu("");
    expect(result).toBe("");
  });

  it("should handle whitespace-only input", async () => {
    const result = await convertToUrdu("   ");
    expect(result).toBe("   ");
  });
});