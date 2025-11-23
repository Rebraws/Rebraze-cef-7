#include "utils.h"

#if defined(__linux__)
#include <unistd.h>
#include <linux/limits.h>
#elif defined(_WIN32)
#include <windows.h>
#elif defined(__APPLE__)
#include <mach-o/dyld.h>
#endif

std::string GetExecutableDirectory() {
#if defined(__linux__)
  char result[PATH_MAX];
  ssize_t count = readlink("/proc/self/exe", result, PATH_MAX);
  if (count != -1) {
    std::string path(result, count);
    size_t pos = path.find_last_of("/\\");
    return path.substr(0, pos);
  }
  return "";
#elif defined(_WIN32)
  char result[MAX_PATH];
  GetModuleFileNameA(NULL, result, MAX_PATH);
  std::string path(result);
  size_t pos = path.find_last_of("/\\");
  return path.substr(0, pos);
#elif defined(__APPLE__)
  char result[PATH_MAX];
  uint32_t size = sizeof(result);
  if (_NSGetExecutablePath(result, &size) == 0) {
    std::string path(result);
    size_t pos = path.find_last_of("/\\");
    return path.substr(0, pos);
  }
  return "";
#else
  return "";
#endif
}
