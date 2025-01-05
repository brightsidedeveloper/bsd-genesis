package main

import (
	"bytes"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func setupGoModule(projectPath string) error {
	// Check if go.mod exists
	goModPath := filepath.Join(projectPath, "go.mod")
	if _, err := os.Stat(goModPath); os.IsNotExist(err) {
		fmt.Println("⚠️ go.mod missing, initializing Go module...")
		if err := runCommandWithError(projectPath, "go", "mod", "init", "module_name"); err != nil {
			return fmt.Errorf("failed to initialize Go module: %v", err)
		}
	}

	// Install missing dependencies
	fmt.Println("📦 Installing Go dependencies...")
	if err := runCommandWithError(projectPath, "go", "mod", "tidy"); err != nil {
		return fmt.Errorf("failed to install dependencies: %v", err)
	}

	return nil
}

func runCommandWithError(dir, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	return cmd.Run()
}

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func runCommandInDir(dir, name string, args ...string) string {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir

	var outBuffer, errBuffer bytes.Buffer
	cmd.Stdout = &outBuffer
	cmd.Stderr = &errBuffer

	// ✅ Run command
	err := cmd.Run()
	if err != nil {
		return fmt.Sprintf("❌ Command failed: %v\n%s\n%s", err, outBuffer.String(), errBuffer.String())
	}

	// ✅ Return both stdout and stderr
	return fmt.Sprintf("%s\n%s", outBuffer.String(), errBuffer.String())
}
