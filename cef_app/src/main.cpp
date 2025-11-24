// Copyright (c) 2025 Rebraze. All rights reserved.

#include "app.h"
#include "client_handler.h"

#include "include/cef_app.h"

#if defined(OS_WIN)
#include "include/cef_sandbox_win.h"
#endif

#if defined(OS_MACOSX)
#include "include/wrapper/cef_library_loader.h"
#endif

// Entry point function for all processes
int main(int argc, char* argv[]) {
#if defined(OS_MACOSX)
  // Load the CEF framework library at runtime instead of linking directly
  // as required by the macOS app bundle structure.
  CefScopedLibraryLoader library_loader;
  if (!library_loader.LoadInMain())
    return 1;
#endif

  // Provide CEF with command-line arguments
  CefMainArgs main_args(argc, argv);

  // Create the app instance - needed for both browser and renderer processes
  CefRefPtr<App> app(new App);

  // CEF applications have multiple sub-processes (render, plugin, GPU, etc)
  // This function checks the command-line and, if this is a sub-process,
  // executes the appropriate logic
  int exit_code = CefExecuteProcess(main_args, app.get(), nullptr);
  if (exit_code >= 0) {
    // The sub-process has completed so return here
    return exit_code;
  }

  // Specify CEF global settings here
  CefSettings settings;

  // Set to true to use a single process (not recommended for production)
  settings.multi_threaded_message_loop = false;

  // Set to true to disable the sandbox (not recommended for production)
  settings.no_sandbox = true;

  // Set log level
  settings.log_severity = LOGSEVERITY_WARNING;

  // Optionally specify a custom cache path
  // CefString(&settings.cache_path).FromASCII("");

  // Set resources directory path (locales, resources, etc.)
  // CefString(&settings.resources_dir_path).FromASCII("");

  // Enable remote debugging for OAuth debugging
  settings.remote_debugging_port = 9222;

  // SimpleApp implements application-level callbacks for the browser process
  // It will create the first browser instance in OnContextInitialized() after
  // CEF has been initialized
  // Note: app instance already created above for use in both browser and renderer processes

  // Initialize CEF
  CefInitialize(main_args, settings, app.get(), nullptr);

  // Run the CEF message loop. This will block until CefQuitMessageLoop() is
  // called
  CefRunMessageLoop();

  // Shut down CEF
  CefShutdown();

  return 0;
}
