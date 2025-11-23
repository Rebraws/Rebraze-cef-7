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
