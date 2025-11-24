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

void ClientHandler::PlatformOpenURL(const std::string& url) {
  // Use the 'open' command for maximum compatibility and reliability
  // This works across all macOS versions and properly opens URLs in the default browser
  std::string command = "open \"" + url + "\"";
  int result = system(command.c_str());
  if (result != 0) {
    NSLog(@"Failed to open URL: %s (exit code: %d)", url.c_str(), result);
  } else {
    NSLog(@"Successfully opened URL in system browser: %s", url.c_str());
  }
}

void ClientHandler::PlatformUpdateMeetingBounds(CefRefPtr<CefBrowser> browser, int x, int y, int width, int height) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(browser->GetHost()->GetWindowHandle());
  if (!view) return;
  
  // The view is a subview of the main window's contentView (or another view).
  // We need to flip coordinates because Cocoa uses bottom-left origin.
  NSView* parentView = [view superview];
  if (!parentView) return;
  
  NSRect parentBounds = [parentView bounds];
  CGFloat parentHeight = parentBounds.size.height;
  
  // Calculate Cocoa Y coordinate (bottom-left based)
  // y comes in as top-left based
  CGFloat cocoaY = parentHeight - y - height;
  
  [view setFrame:NSMakeRect(x, cocoaY, width, height)];
  [view setNeedsDisplay:YES];
}
