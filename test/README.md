# Anthropic API Mock System

This testing framework provides a comprehensive mock system for the Anthropic API, allowing you to control responses based on message patterns during testing.

## Quick Start

```typescript
import { 
  mockAnthropicResponse, 
  clearAnthropicMocks, 
  quickMockResponse 
} from "./helpers/anthropic.mock.helpers";

// In your test
beforeEach(() => {
  clearAnthropicMocks(); // Clear previous mocks
});

it("should respond to clothing queries", async () => {
  // Set up a mock response
  mockAnthropicResponse(/clothing|fashion/, quickMockResponse(
    "Here are some great clothing store locations!"
  ));
  
  // Your test code here...
});
```

## Features

### 🎯 Pattern Matching
- **String patterns**: Simple substring matching
- **Regex patterns**: Full regex support for complex matching
- **Case insensitive**: Built-in case-insensitive matching

### 📡 Streaming Responses
- **Real streaming**: Mimics Anthropic's Server-Sent Events format
- **Configurable delays**: Control response timing
- **Chunked delivery**: Simulates real streaming behavior

### 🛠️ Flexible Configuration
- **Custom responses**: Define your own response patterns
- **Pre-built scenarios**: Common test scenarios included
- **Error simulation**: Test error handling with mock errors

## Core Functions

### Setting Up Mock Responses

```typescript
// Simple response
mockAnthropicResponse(/restaurant/, {
  content: "Great restaurant locations available!",
  delay: 200
});

// Multiple responses at once
mockAnthropicResponses([
  {
    pattern: /clothing/i,
    response: { content: "Clothing store spaces..." }
  },
  {
    pattern: /food/i,
    response: { content: "Restaurant locations..." }
  }
]);

// Error response
mockAnthropicError(/error test/, {
  type: "rate_limit_error",
  message: "Too many requests"
});
```

### Helper Functions

```typescript
// Quick response (just content + default delay)
quickMockResponse("Simple response text");

// Long streaming response
longMockResponse("Very long response that will stream in chunks...");

// Clear all custom mocks
clearAnthropicMocks();
```

### Test Scenarios

Pre-built scenarios for common use cases:

```typescript
import { applyTestScenario, testScenarios } from "./helpers/anthropic.mock.helpers";

// Apply a pre-built scenario
applyTestScenario('fashionBoutique');
applyTestScenario('restaurant');
applyTestScenario('budgetInquiry');

// Available scenarios:
// - fashionBoutique: Clothing/fashion queries
// - restaurant: Food service queries  
// - budgetInquiry: Price/budget questions
// - apiError: Simulates API errors
// - slowResponse: Tests loading states
```

## Default Responses

The mock system includes intelligent default responses for common patterns:

- **Greetings** (`/hello|hi|hey/i`) → Welcome message
- **Location queries** (`/downtown|city center/i`) → Downtown locations
- **Fashion/clothing** (`/clothing|fashion|boutique/i`) → Clothing store spaces
- **Food/restaurants** (`/food|restaurant|cafe/i`) → Restaurant locations
- **Budget questions** (`/price|cost|budget/i`) → Pricing information
- **Size queries** (`/size|square feet/i`) → Space size recommendations
- **Availability** (`/available|when|timing/i`) → Lease terms and timing

## Response Configuration

Each mock response supports these options:

```typescript
interface MockResponse {
  content: string;           // Response text
  delay?: number;           // Delay before streaming starts (default: 100ms)
  streaming?: boolean;      // Enable streaming simulation (default: true)
  error?: {                 // Simulate API errors
    type: string;
    message: string;
  };
}
```

## Example Test File

```typescript
import { expect, type Page } from "playwright/test";
import { beforeEach, afterEach, describe, it } from "vitest";
import { launchBrowser, URL } from "./helpers/launchBrowser";
import {
  mockAnthropicResponse,
  clearAnthropicMocks,
  quickMockResponse,
  applyTestScenario
} from "./helpers/anthropic.mock.helpers";

describe("Chat functionality", () => {
  let page: Page;

  beforeEach(async () => {
    page = await launchBrowser();
    clearAnthropicMocks(); // Important: Clear previous mocks
  });

  afterEach(async () => {
    await page.close();
    clearAnthropicMocks(); // Clean up
  });

  it("should handle custom responses", async () => {
    // Set up mock
    mockAnthropicResponse(/tech store/, quickMockResponse(
      "Perfect for tech retail! Here are high-tech locations."
    ));

    await page.goto(`${URL}/chat`);
    
    // Send message
    await page.fill("input[type='text']", "I need a tech store location");
    await page.press("input[type='text']", "Enter");
    
    // Verify response
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /Perfect for tech retail/ })
    ).toBeVisible();
  });

  it("should use predefined scenarios", async () => {
    applyTestScenario('fashionBoutique');
    
    await page.goto(`${URL}/chat`);
    await page.fill("input[type='text']", "fashion boutique space");
    await page.press("input[type='text']", "Enter");
    
    await expect(
      page.locator(".chat-bubble").filter({ hasText: /fashion boutique/ })
    ).toBeVisible();
  });
});
```

## Best Practices

### 1. Always Clear Mocks
```typescript
beforeEach(() => {
  clearAnthropicMocks(); // Prevents test interference
});

afterEach(() => {
  clearAnthropicMocks(); // Clean up after tests
});
```

### 2. Use Specific Patterns
```typescript
// Good: Specific pattern
mockAnthropicResponse(/clothing boutique downtown/, response);

// Avoid: Too broad pattern that might match unintended messages
mockAnthropicResponse(/.*/, response);
```

### 3. Test Different Scenarios
```typescript
// Test normal responses
mockAnthropicResponse(/normal query/, quickMockResponse("Normal response"));

// Test error handling  
mockAnthropicError(/error trigger/, { type: "error", message: "Test error" });

// Test slow responses
mockAnthropicResponse(/slow query/, {
  content: "Slow response",
  delay: 2000
});
```

### 4. Use Descriptive Content
```typescript
// Good: Clear, testable content
mockAnthropicResponse(/restaurant/, quickMockResponse(
  "Food service locations with commercial kitchens available."
));

// Avoid: Generic content that's hard to test
mockAnthropicResponse(/restaurant/, quickMockResponse("OK"));
```

## Troubleshooting

### Mock Not Working?
1. Make sure you're calling `clearAnthropicMocks()` in beforeEach
2. Check that your pattern matches the actual message text
3. Verify the pattern is added before the request is made

### Response Not Appearing?
1. Increase wait times in tests (`await page.waitForTimeout(3000)`)
2. Check browser console for errors
3. Verify your CSS selectors match the actual DOM structure

### Pattern Not Matching?
1. Test your regex pattern in isolation
2. Remember that string patterns use `includes()` (case-insensitive)
3. Check the exact message text being sent to the API

## Advanced Usage

### Custom Stream Processing
```typescript
import { createStreamingResponse } from "./mocks/anthropic.stream";

// Create custom streaming response
const customStream = createStreamingResponse({
  content: "Custom streaming content",
  delay: 500
});
```

### Dynamic Response Selection
```typescript
// Set up multiple patterns with priority
mockAnthropicResponses([
  { pattern: /urgent retail space/, response: { content: "Urgent: Here are immediate options!" }},
  { pattern: /retail space/, response: { content: "Here are retail options..." }},
]);
// The more specific pattern will match first
```

This mock system gives you complete control over API responses during testing, making your tests predictable, fast, and comprehensive.