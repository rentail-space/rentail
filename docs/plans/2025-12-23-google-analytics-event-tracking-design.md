# Google Analytics Event Tracking Design

**Date:** 2025-12-23
**Status:** Approved

## Overview

Add Google Analytics event tracking for key user interactions:
- Message sends in chat conversations
- Header/sidebar navigation link clicks
- Response message link clicks
- Center detail page link clicks

## Requirements

- **Tracking Level:** Detailed tracking with event name, context, and session data
- **Implementation:** Manual tracking with explicit function calls
- **User Identity:** Session-based (session/chat ID) without personal information
- **Environment:** Production only (console logging in development)

## Architecture

### Core Tracking Module (`app/lib/analytics.ts`)

**Functions:**
- `useTrackingContext()` - React hook to extract session/chat/device context
- `trackEvent(name, params, context)` - Send events with standardized structure

**Event Structure:**
```typescript
{
  category: EventCategory,     // "chat", "navigation", "center_detail"
  action: EventAction,         // "message_sent", "link_clicked", etc.
  label?: string,              // link URL, center ID
  value?: number,              // message length, click count
  sessionId?: string,          // from root loader data
  chatId?: string,             // current chat ID from params
  deviceType?: string,         // "mobile" | "desktop"
  timestamp: number            // Date.now()
}
```

**Environment Handling:**
- Production: Send events to Google Analytics via ReactGA
- Development: Log events to console for debugging
- Uses existing ReactGA initialization from PageLayout.tsx

## Implementation Details

### 1. Message Sends (app/routes/chat/InputForm.tsx)

Add tracking after successful message send:
```typescript
const context = useTrackingContext();

const handleSubmit = async (message) => {
  await sendMessage(message);
  trackEvent("message_sent", {
    category: "chat",
    action: "send_message",
    value: message.length,
  }, context);
};
```

### 2. Header Navigation Links (app/components/layout/PageHeader.tsx)

Add onClick handler to NavLink components:
```typescript
const context = useTrackingContext();

<NavLink
  to={link.to}
  onClick={() => {
    trackEvent("navigation_click", {
      category: "navigation",
      action: "header_link_clicked",
      label: link.to,
    }, context);
  }}
>
  {link.label}
</NavLink>
```

### 3. Response Message Links (app/routes/chat/ResponseMessage.tsx)

Enhance Streamdown markdown renderer with custom link component:
```typescript
const context = useTrackingContext();

<Streamdown
  components={{
    a: ({ href, children }) => (
      <Link
        to={href}
        onClick={() => trackEvent("content_link_click", {
          category: "chat",
          action: "response_link_clicked",
          label: href,
        }, context)}
      >
        {children}
      </Link>
    )
  }}
/>
```

### 4. Center Details Links (app/routes/center.$id/)

Add tracking to website, phone, and navigation links in CenterInfo.tsx and Center.tsx:
```typescript
const context = useTrackingContext();

<a
  href={property.website}
  onClick={() => trackEvent("center_interaction", {
    category: "center_detail",
    action: "external_link_clicked",
    label: property.website,
    value: property.id,
  }, context)}
>
  Visit Website
</a>
```

## Data Flow & Context Extraction

### useTrackingContext Hook

```typescript
export function useTrackingContext(): TrackingContext {
  const { chatId } = useParams();
  const rootData = useRouteLoaderData("root");

  return {
    sessionId: rootData?.user?.id,
    chatId: chatId || rootData?.chat?.id,
    deviceType: rootData?.user?.isMobile ? "mobile" : "desktop",
    timestamp: Date.now()
  };
}
```

### trackEvent Function

```typescript
export function trackEvent(
  name: string,
  params: EventParams,
  context: TrackingContext
): void {
  try {
    // Development: console logging only
    if (process.env.NODE_ENV !== "production") {
      console.log("[Analytics]", name, { ...context, ...params });
      return;
    }

    // Validate required fields
    if (!name || !params.category || !params.action) {
      console.warn("[Analytics] Missing required fields", { name, params });
      return;
    }

    // Send to Google Analytics
    ReactGA.event({
      category: params.category,
      action: name,
      ...context,
      ...params
    });
  } catch (error) {
    // Don't break app if tracking fails
    console.error("[Analytics] Tracking failed:", error);
    captureException(error, { extra: { eventName: name, params } });
  }
}
```

## Type Safety

```typescript
export type EventCategory = "chat" | "navigation" | "center_detail";

export type EventAction =
  | "message_sent"
  | "header_link_clicked"
  | "response_link_clicked"
  | "external_link_clicked";

export interface TrackingContext {
  sessionId?: string;
  chatId?: string;
  deviceType?: "mobile" | "desktop";
  timestamp: number;
}

export interface EventParams {
  category: EventCategory;
  action: EventAction;
  label?: string;
  value?: number;
}
```

## Error Handling

**Graceful Failures:**
- Wrapped in try/catch to prevent app breakage
- Validates required fields before sending
- Logs warnings for debugging
- Optionally reports to Sentry

**Edge Cases:**
- **Anonymous users:** sessionId may be undefined (GA still tracks by client ID)
- **Missing chatId:** Undefined on non-chat pages (handled gracefully)
- **Ad blockers:** ReactGA calls may fail silently (caught by try/catch)
- **Rapid clicks:** GA handles deduplication automatically
- **SSR context:** Tracking only runs client-side (ReactGA is client-only)

## Testing Strategy

### Unit Tests
Mock ReactGA and verify correct parameters:
```typescript
test("trackEvent sends correct data", () => {
  const mockEvent = vi.spyOn(ReactGA, "event");
  trackEvent("test_event", {
    category: "chat",
    action: "message_sent"
  }, {
    timestamp: Date.now()
  });

  expect(mockEvent).toHaveBeenCalledWith(
    expect.objectContaining({
      category: "chat",
      action: "test_event"
    })
  );
});
```

### Integration Tests
Verify tracking calls in component tests:
```typescript
test("clicking link triggers tracking", async () => {
  render(<PageHeader />);
  await userEvent.click(screen.getByText("About"));

  expect(console.log).toHaveBeenCalledWith(
    "[Analytics]",
    "navigation_click",
    expect.any(Object)
  );
});
```

### Manual QA
- Check Google Analytics real-time reports in production
- Verify events appear with correct parameters
- Test on mobile and desktop devices
- Verify ad blocker doesn't break app

## Implementation Checklist

- [ ] Create `app/lib/analytics.ts` with types and functions
- [ ] Add tracking to chat message sends (InputForm.tsx)
- [ ] Add tracking to header navigation links (PageHeader.tsx)
- [ ] Add tracking to response message links (ResponseMessage.tsx)
- [ ] Add tracking to center detail links (CenterInfo.tsx, Center.tsx)
- [ ] Write unit tests for tracking functions
- [ ] Write integration tests for component tracking
- [ ] Test in development (console logs)
- [ ] Deploy and verify in production (GA real-time reports)
- [ ] Document event names in project documentation

## Files to Modify

1. `app/lib/analytics.ts` - New file with tracking utilities
2. `app/routes/chat/InputForm.tsx` - Add message send tracking
3. `app/components/layout/PageHeader.tsx` - Add header link tracking
4. `app/routes/chat/ResponseMessage.tsx` - Add response link tracking
5. `app/routes/center.$id/CenterInfo.tsx` - Add center detail tracking
6. `app/routes/center.$id/Center.tsx` - Add center detail tracking
7. `test/analytics.test.ts` - New test file for tracking functions
