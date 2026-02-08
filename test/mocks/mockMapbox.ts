/**
 * Mock Mapbox GL for tests to prevent WebGL initialization errors
 */

import { vi } from "vitest";

// Mock the entire mapbox-gl module
vi.mock("mapbox-gl", () => {
  const MockMap = vi.fn().mockImplementation(() => ({
    addControl: vi.fn(),
    on: vi.fn(),
    off: vi.fn(),
    remove: vi.fn(),
    setCenter: vi.fn(),
    setZoom: vi.fn(),
  }));

  const MockMarker = vi.fn().mockImplementation(() => ({
    setLngLat: vi.fn().mockReturnThis(),
    setPopup: vi.fn().mockReturnThis(),
    addTo: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }));

  const MockPopup = vi.fn().mockImplementation(() => ({
    setDOMContent: vi.fn().mockReturnThis(),
    on: vi.fn().mockReturnThis(),
    remove: vi.fn(),
  }));

  const MockNavigationControl = vi.fn();

  return {
    default: {
      Map: MockMap,
      Marker: MockMarker,
      Popup: MockPopup,
      NavigationControl: MockNavigationControl,
      accessToken: "",
    },
    Map: MockMap,
    Marker: MockMarker,
    Popup: MockPopup,
    NavigationControl: MockNavigationControl,
  };
});
