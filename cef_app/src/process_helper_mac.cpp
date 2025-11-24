// Copyright (c) 2025 Rebraze. All rights reserved.
// macOS helper process entry point

#include "include/cef_app.h"
#include "include/wrapper/cef_library_loader.h"
#include "app.h"

// Entry point function for sub-processes on macOS
int main(int argc, char* argv[]) {
  // Load the CEF framework library at runtime instead of linking directly
  CefScopedLibraryLoader library_loader;
  if (!library_loader.LoadInHelper())
    return 1;

  // Provide CEF with command-line arguments
  CefMainArgs main_args(argc, argv);

  // Create the app instance - needed for renderer process to handle IPC messages
  CefRefPtr<App> app(new App);

  // Execute the sub-process logic. This will block until the process exits
  return CefExecuteProcess(main_args, app.get(), nullptr);
}
