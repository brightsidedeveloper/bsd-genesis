package main

import (
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
		if err := runCommandInDir(projectPath, "go", "mod", "init", "module_name"); err != nil {
			return fmt.Errorf("failed to initialize Go module: %v", err)
		}
	}

	// Install missing dependencies
	fmt.Println("📦 Installing Go dependencies...")
	if err := runCommandInDir(projectPath, "go", "mod", "tidy"); err != nil {
		return fmt.Errorf("failed to install dependencies: %v", err)
	}

	return nil
}

func runCommand(name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}

func runCommandInDir(dir, name string, args ...string) error {
	cmd := exec.Command(name, args...)
	cmd.Dir = dir // ✅ Set the working directory
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	return cmd.Run()
}
