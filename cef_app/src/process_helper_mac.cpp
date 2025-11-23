// Copyright (c) 2025 Rebraze. All rights reserved.
// macOS helper process entry point

#include "include/cef_app.h"

// Entry point function for sub-processes on macOS
int main(int argc, char* argv[]) {
  // Provide CEF with command-line arguments
  CefMainArgs main_args(argc, argv);

  // Execute the sub-process logic. This will block until the process exits
  return CefExecuteProcess(main_args, nullptr, nullptr);
}
