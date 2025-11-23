// Copyright (c) 2025 Rebraze. All rights reserved.
// macOS-specific implementation

#include "client_handler.h"

#import <Cocoa/Cocoa.h>

#include "include/cef_browser.h"

void ClientHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                                       const CefString& title) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(
      browser->GetHost()->GetWindowHandle());
  NSWindow* window = [view window];
  std::string titleStr(title);
  NSString* str = [NSString stringWithUTF8String:titleStr.c_str()];
  [window setTitle:str];
}
