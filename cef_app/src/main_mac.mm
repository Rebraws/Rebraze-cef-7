// Copyright (c) 2025 Rebraze. All rights reserved.
// macOS-specific implementation

#include "client_handler.h"

#import <Cocoa/Cocoa.h>

#include "include/cef_browser.h"

// CRITICAL FIX: Patch NSApplication to handle the isHandlingSendEvent selector
// This selector is expected by CEF but missing in the standard NSApplication on some macOS versions/configurations,
// leading to a crash when closing browsers or handling certain events.
@interface NSApplication (RebrazeFix)
- (BOOL)isHandlingSendEvent;
@end

@implementation NSApplication (RebrazeFix)
- (BOOL)isHandlingSendEvent {
    return NO;
}
@end

void ClientHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                                       const CefString& title) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(
      browser->GetHost()->GetWindowHandle());
  NSWindow* window = [view window];
  std::string titleStr(title);
  NSString* str = [NSString stringWithUTF8String:titleStr.c_str()];
  [window setTitle:str];
}

void ClientHandler::PlatformCustomizeWindow(CefRefPtr<CefBrowser> browser) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(
      browser->GetHost()->GetWindowHandle());
  NSWindow* window = [view window];

  if (!window) {
    NSLog(@"Failed to get window for customization");
    return;
  }

  // Enable full-size content view (content extends under titlebar)
  [window setStyleMask:[window styleMask] | NSWindowStyleMaskFullSizeContentView];

  // Make titlebar transparent so our React UI shows through
  [window setTitlebarAppearsTransparent:YES];

  // Hide the title text (we'll show our own in the React UI)
  [window setTitleVisibility:NSWindowTitleHidden];

  // Keep the traffic light buttons visible and in standard position
  // They will appear over our content in the top-left corner

  NSLog(@"macOS window customized with unified titlebar");
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

void ClientHandler::PlatformShowMeetingView(CefRefPtr<CefBrowser> browser) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(browser->GetHost()->GetWindowHandle());
  if (view) {
    [view setHidden:NO];
  }
}

void ClientHandler::PlatformHideMeetingView(CefRefPtr<CefBrowser> browser) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(browser->GetHost()->GetWindowHandle());
  if (view) {
    [view setHidden:YES];
  }
}

void ClientHandler::PlatformCloseMeetingView(CefRefPtr<CefBrowser> browser) {
  NSView* view = CAST_CEF_WINDOW_HANDLE_TO_NSVIEW(browser->GetHost()->GetWindowHandle());
  if (view) {
    // Just hide it to be visually instant. 
    // Don't remove from superview manually; let CloseBrowser handle destruction.
    // Manual removal might interfere with CEF's internal cleanup.
    [view setHidden:YES];
  }
}
