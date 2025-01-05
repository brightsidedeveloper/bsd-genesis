package main

import (
	"fmt"
	"os/exec"
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
