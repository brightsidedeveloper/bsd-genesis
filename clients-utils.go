package main

import (
	"fmt"
	"os/exec"
	"regexp"
	"runtime"
	"strings"
)

// ✅ Helper function to check if a dev server is running in a specific planet folder
func isDevServerRunning(planetPath string) bool {
	cmd := exec.Command("ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		fmt.Println("⚠️ Error running `ps aux`:", err)
		return false
	}

	lines := strings.Split(string(output), "\n")
	for _, line := range lines {
		if strings.Contains(line, planetPath) {
			return true
		}
	}
	return false
}

// ✅ Function to extract the local URL from logs
func extractLocalURL(logs string) string {
	// Regex to match lines like "➜  Local:   http://localhost:5174/"
	re := regexp.MustCompile(`Local:\s+(http://localhost:\d+/?)`)
	matches := re.FindStringSubmatch(logs)
	if len(matches) > 1 {
		return matches[1] // ✅ Extracted URL
	}
	return "" // Default fallback if not found
}

// ✅ Function to open the browser
func openBrowser(url string) error {
	cmd := exec.Command("")
	switch runtime.GOOS {
	case "darwin":
		cmd = exec.Command("open", url)
	case "windows":
		cmd = exec.Command("rundll32", "url.dll,FileProtocolHandler", url)
	case "linux":
		cmd = exec.Command("xdg-open", url)
	default:
		return fmt.Errorf("unsupported platform")
	}
	return cmd.Start()
}
