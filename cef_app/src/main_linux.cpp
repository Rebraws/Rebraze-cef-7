// Copyright (c) 2025 Rebraze. All rights reserved.
// Linux-specific implementation

#include "client_handler.h"

#include <X11/Xlib.h>

#include "include/base/cef_logging.h"
#include "include/cef_browser.h"

void ClientHandler::PlatformTitleChange(CefRefPtr<CefBrowser> browser,
                                       const CefString& title) {
  std::string titleStr(title);

  // Retrieve the X11 display shared with Chromium
  ::Display* display = cef_get_xdisplay();
  DCHECK(display);

  // Retrieve the X11 window handle for the browser
  ::Window window = browser->GetHost()->GetWindowHandle();
  DCHECK(window != kNullWindowHandle);

  // Set the window title
  XStoreName(display, window, titleStr.c_str());

  // Set the _NET_WM_NAME property for UTF-8 window titles
  Atom name_atom = XInternAtom(display, "_NET_WM_NAME", False);
  Atom utf8_atom = XInternAtom(display, "UTF8_STRING", False);
  XChangeProperty(display, window, name_atom, utf8_atom, 8, PropModeReplace,
                  (unsigned char*)titleStr.c_str(), titleStr.size());
}
