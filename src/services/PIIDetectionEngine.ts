import * as ort from "onnxruntime-web";
import type {
  OCRWord,
  PIIDetection,
  PIIDetectionEngine,
} from "../types/redaction";
import { PIIType } from "../types/redaction";

/**
 * Regex patterns for detecting common PII types
 */
const PII_PATTERNS = {
  // Email: standard email format
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,

  // Phone: Various US phone formats
  // Matches: (123) 456-7890, 123-456-7890, 123.456.7890, 1234567890
  phone:
    /\b(?:\+?1[-.\s]?)?\(?([0-9]{3})\)?[-.\s]?([0-9]{3})[-.\s]?([0-9]{4})\b/g,

  // SSN: XXX-XX-XXXX format
  ssn: /\b\d{3}-\d{2}-\d{4}\b/g,

  // Credit Card: 13-19 digits with optional spaces or dashes
  // Matches major card formats (Visa, MasterCard, Amex, Discover)
  creditCard: /\b(?:\d{4}[-\s]?){3}\d{4}|\b\d{13,19}\b/g,

  // Date of Birth: Various date formats
  // Matches: MM/DD/YYYY, MM-DD-YYYY, Month DD, YYYY
  dateOfBirth:
    /\b(?:\d{1,2}[-/]\d{1,2}[-/]\d{2,4}|\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4})\b/gi,
};

/**
 * PIIDetectionEngine implementation using regex patterns
 * Provides fallback detection when ONNX models are not available
 */
/**
 * NER label mapping to PII types
 * Used for mapping ONNX model entity labels to our PII types
 * TODO: Implement in detectWithONNX when model-specific decoding is added
 */
const NER_LABEL_TO_PII_TYPE: Record<string, PIIType> = {
  PER: PIIType.NAME,
  PERSON: PIIType.NAME,
  LOC: PIIType.ADDRESS,
  LOCATION: PIIType.ADDRESS,
  ORG: PIIType.OTHER,
  ORGANIZATION: PIIType.OTHER,
  DATE: PIIType.DATE_OF_BIRTH,
  EMAIL: PIIType.EMAIL,
  PHONE: PIIType.PHONE,
  SSN: PIIType.SSN,
  CREDIT_CARD: PIIType.CREDIT_CARD,
};

// Prevent unused variable warning - this will be used when ONNX decoding is implemented
void NER_LABEL_TO_PII_TYPE;

export class PIIDetectionEngineImpl implements PIIDetectionEngine {
  private isInitialized = false;
  private onnxSession: ort.InferenceSession | null = null;
  private useONNX = false;

  /**
   * Initialize the PII detection engine
   * Attempts to load ONNX model, falls back to regex-only if model loading fails
   */
  async initialize(modelPath: string): Promise<void> {
    this.isInitialized = true;

    // If no model path provided, use regex-only mode
    if (!modelPath || modelPath.trim() === "") {
      console.log("No model path provided, using regex-only PII detection");
      this.useONNX = false;
      return;
    }

    // Try to load ONNX model
    try {
      console.log(`Loading ONNX model from: ${modelPath}`);
      this.onnxSession = await ort.InferenceSession.create(modelPath, {
        executionProviders: ["wasm"],
      });
      this.useONNX = true;
      console.log("ONNX model loaded successfully");
    } catch (error) {
      console.warn(
        `Failed to load ONNX model: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
      console.log("Falling back to regex-only PII detection");
      this.useONNX = false;
      this.onnxSession = null;
    }
  }

  /**
   * Detect PII in extracted text using ONNX model or regex patterns
   * Maps detected patterns to OCR words and calculates bounding boxes
   * Automatically initializes if not already initialized (lazy loading)
   */
  async detectPII(
    text: string,
    words: OCRWord[],
    modelPath?: string,
  ): Promise<PIIDetection[]> {
    // Lazy initialization: initialize on first use
    if (!this.isInitialized) {
      await this.initialize(modelPath || "");
    }

    let detections: PIIDetection[] = [];

    // Try ONNX model first if available
    if (this.useONNX && this.onnxSession) {
      try {
        const onnxDetections = await this.detectWithONNX(text, words);
        detections = [...onnxDetections];
      } catch (error) {
        console.warn(
          `ONNX detection failed: ${error instanceof Error ? error.message : "Unknown error"}`,
        );
        console.log("Falling back to regex detection");
      }
    }

    // Always run regex detection (either as primary or supplementary)
    const regexDetections = await this.detectWithRegex(text, words);

    // Merge detections, avoiding duplicates
    detections = this.mergeDetections(detections, regexDetections);

    return detections;
  }

  /**
   * Detect PII using ONNX NER model
   * TODO: Implement word mapping when model-specific decoding is added
   */
  private async detectWithONNX(
    text: string,
    _words: OCRWord[],
  ): Promise<PIIDetection[]> {
    if (!this.onnxSession) {
      throw new Error("ONNX session not initialized");
    }

    // Tokenize text (simplified - real implementation would use model's tokenizer)
    const tokens = text.split(/\s+/);

    // For a real NER model, you would:
    // 1. Tokenize using the model's tokenizer (e.g., BERT tokenizer)
    // 2. Convert tokens to input IDs
    // 3. Create attention masks
    // 4. Run inference
    // 5. Decode predictions to entity labels

    // This is a placeholder for the actual ONNX inference
    // The actual implementation depends on the specific model being used
    const detections: PIIDetection[] = [];

    // Example inference structure (would need to be adapted to actual model)
    try {
      // Create input tensors (this is model-specific)
      const inputIds = new ort.Tensor(
        "int64",
        new BigInt64Array(tokens.length),
        [1, tokens.length],
      );

      // Run inference
      const feeds = { input_ids: inputIds };
      const results = await this.onnxSession.run(feeds);

      // Process results (this is model-specific)
      // The output format depends on the NER model architecture
      const predictions = results.logits?.data as Float32Array;

      if (predictions) {
        // Convert model predictions to PII detections
        // This would involve:
        // 1. Decoding entity labels from predictions
        // 2. Mapping entities to text positions
        // 3. Finding corresponding OCR words
        // 4. Creating PIIDetection objects

        // Placeholder - actual implementation depends on model output format
        console.log("ONNX predictions received, length:", predictions.length);
      }
    } catch (error) {
      console.error("ONNX inference error:", error);
      throw error;
    }

    return detections;
  }

  /**
   * Detect PII using regex patterns
   */
  private async detectWithRegex(
    text: string,
    words: OCRWord[],
  ): Promise<PIIDetection[]> {
    const detections: PIIDetection[] = [];

    // Process each PII type
    for (const [type, pattern] of Object.entries(PII_PATTERNS)) {
      const matches = this.findMatches(text, pattern);

      for (const match of matches) {
        const detection = this.mapMatchToWords(
          match.text,
          match.startIndex,
          match.endIndex,
          type as PIIType,
          words,
          text,
        );

        if (detection) {
          detections.push(detection);
        }
      }
    }

    return detections;
  }

  /**
   * Merge ONNX and regex detections, removing duplicates
   */
  private mergeDetections(
    onnxDetections: PIIDetection[],
    regexDetections: PIIDetection[],
  ): PIIDetection[] {
    const merged = [...onnxDetections];

    for (const regexDetection of regexDetections) {
      // Check if this detection overlaps with any ONNX detection
      const hasOverlap = onnxDetections.some((onnxDet) =>
        this.detectionsOverlap(onnxDet, regexDetection),
      );

      if (!hasOverlap) {
        merged.push(regexDetection);
      }
    }

    return merged;
  }

  /**
   * Check if two detections overlap
   */
  private detectionsOverlap(det1: PIIDetection, det2: PIIDetection): boolean {
    return det1.startIndex < det2.endIndex && det1.endIndex > det2.startIndex;
  }

  /**
   * Find all matches of a pattern in text
   */
  private findMatches(
    text: string,
    pattern: RegExp,
  ): Array<{ text: string; startIndex: number; endIndex: number }> {
    const matches: Array<{
      text: string;
      startIndex: number;
      endIndex: number;
    }> = [];

    // Reset regex state
    pattern.lastIndex = 0;

    let match: RegExpExecArray | null = pattern.exec(text);
    while (match !== null) {
      matches.push({
        text: match[0],
        startIndex: match.index,
        endIndex: match.index + match[0].length,
      });
      match = pattern.exec(text);
    }

    return matches;
  }

  /**
   * Map a text match to OCR words and calculate bounding boxes
   */
  private mapMatchToWords(
    matchText: string,
    startIndex: number,
    endIndex: number,
    type: PIIType,
    words: OCRWord[],
    fullText: string,
  ): PIIDetection | null {
    // Find OCR words that overlap with the matched text range
    const matchedWords = this.findOverlappingWords(
      startIndex,
      endIndex,
      words,
      fullText,
    );

    if (matchedWords.length === 0) {
      return null;
    }

    // Calculate confidence based on pattern type and match quality
    const confidence = this.calculateConfidence(type, matchText, matchedWords);

    return {
      text: matchText,
      type,
      confidence,
      startIndex,
      endIndex,
      words: matchedWords,
    };
  }

  /**
   * Find OCR words that overlap with a text range
   */
  private findOverlappingWords(
    startIndex: number,
    endIndex: number,
    words: OCRWord[],
    fullText: string,
  ): OCRWord[] {
    const matchedWords: OCRWord[] = [];
    let currentIndex = 0;

    for (const word of words) {
      // Find the word's position in the full text
      const wordStart = fullText.indexOf(word.text, currentIndex);

      if (wordStart === -1) {
        continue;
      }

      const wordEnd = wordStart + word.text.length;
      currentIndex = wordEnd;

      // More strict overlap check: word must be substantially within the match range
      // A word is included if at least 50% of it falls within the match range
      const overlapStart = Math.max(wordStart, startIndex);
      const overlapEnd = Math.min(wordEnd, endIndex);
      const overlapLength = Math.max(0, overlapEnd - overlapStart);
      const wordLength = wordEnd - wordStart;

      // Include word only if more than 50% of it overlaps with the match
      if (overlapLength > wordLength * 0.5) {
        matchedWords.push(word);
      }

      // Stop if we've passed the match range
      if (wordStart >= endIndex) {
        break;
      }
    }

    return matchedWords;
  }

  /**
   * Calculate confidence score for a PII detection
   */
  private calculateConfidence(
    type: PIIType,
    matchText: string,
    words: OCRWord[],
  ): number {
    // Base confidence by pattern type (more specific patterns = higher confidence)
    const baseConfidence: Record<string, number> = {
      email: 0.95,
      ssn: 0.98,
      creditCard: 0.9,
      phone: 0.85,
      dateOfBirth: 0.75,
    };

    let confidence = baseConfidence[type] || 0.7;

    // Adjust based on OCR word confidence
    if (words.length > 0) {
      const avgOCRConfidence =
        words.reduce((sum, w) => sum + w.confidence, 0) / words.length;
      // Blend pattern confidence with OCR confidence
      confidence = confidence * 0.7 + (avgOCRConfidence / 100) * 0.3;
    }

    // Additional validation for specific types
    if (type === PIIType.CREDIT_CARD) {
      // Luhn algorithm check for credit cards
      if (!this.isValidCreditCard(matchText)) {
        confidence *= 0.5; // Reduce confidence if Luhn check fails
      }
    }

    return Math.min(confidence, 1.0);
  }

  /**
   * Validate credit card number using Luhn algorithm
   */
  private isValidCreditCard(cardNumber: string): boolean {
    // Remove spaces and dashes
    const digits = cardNumber.replace(/[\s-]/g, "");

    if (!/^\d{13,19}$/.test(digits)) {
      return false;
    }

    let sum = 0;
    let isEven = false;

    // Loop through digits from right to left
    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = Number.parseInt(digits[i], 10);

      if (isEven) {
        digit *= 2;
        if (digit > 9) {
          digit -= 9;
        }
      }

      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  /**
   * Dispose of resources and clean up ONNX session
   */
  async dispose(): Promise<void> {
    if (this.onnxSession) {
      try {
        await this.onnxSession.release();
        console.log("ONNX session released");
      } catch (error) {
        console.warn("Error releasing ONNX session:", error);
      }
      this.onnxSession = null;
    }
    this.isInitialized = false;
    this.useONNX = false;
  }

  /**
   * Check if the engine is initialized
   */
  isReady(): boolean {
    return this.isInitialized;
  }
}
