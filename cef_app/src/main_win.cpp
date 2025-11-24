// Copyright (c) 2025 Rebraze. All rights reserved.
// Windows-specific implementation

#include "client_handler.h"

#include <windows.h>
#include <string>

#include "include/cef_browser.h"

void ClientHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                                       const CefString& title) {
  CefWindowHandle hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    SetWindowText(hwnd, std::wstring(title).c_str());
  }
}

void ClientHandler::PlatformOpenURL(const std::string& url) {
  ShellExecuteA(NULL, "open", url.c_str(), NULL, NULL, SW_SHOWNORMAL);
}

void ClientHandler::PlatformUpdateMeetingBounds(CefRefPtr<CefBrowser> browser, int x, int y, int width, int height) {
  HWND hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    // Content browser stays on TOP (above UI browser)
    SetWindowPos(hwnd, HWND_TOP, x, y, width, height, SWP_NOACTIVATE);
  }
}

void ClientHandler::PlatformShowMeetingView(CefRefPtr<CefBrowser> browser) {
  HWND hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    ShowWindow(hwnd, SW_SHOW);
    // Ensure it's on top
    SetWindowPos(hwnd, HWND_TOP, 0, 0, 0, 0, SWP_NOMOVE | SWP_NOSIZE);
  }
}

void ClientHandler::PlatformHideMeetingView(CefRefPtr<CefBrowser> browser) {
  HWND hwnd = browser->GetHost()->GetWindowHandle();
  if (hwnd) {
    ShowWindow(hwnd, SW_HIDE);
  }
}

void ClientHandler::PlatformCloseMeetingView(CefRefPtr<CefBrowser> browser) {
  // No special handling needed on Windows
}