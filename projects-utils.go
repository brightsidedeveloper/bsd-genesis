package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
)

func ensureDir(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		fmt.Println("📁 Creating missing directory:", dir)
		return os.MkdirAll(dir, os.ModePerm)
	}
	return nil
}

func getSolarDir(projectDir string) string {
	return filepath.Join(projectDir, "genesis", "solar-systems")
}

// getProjectMetadata scans the directory and loads project metadata
func getProjectMetadata(dir string) ([]ProjectInfo, error) {
	var projects []ProjectInfo

	fmt.Println("📂 Reading directory:", dir)
	entries, err := os.ReadDir(dir)
	if err != nil {
		fmt.Println("❌ Error reading directory:", err)
		return nil, err
	}

	if len(entries) == 0 {
		fmt.Println("⚠️ No entries found in:", dir)
	}

	for _, entry := range entries {
		if entry.IsDir() {
			projectPath := filepath.Join(dir, entry.Name(), "project.json")

			fmt.Println("📖 Checking for project.json in:", projectPath)

			data, err := readProjectJSON(projectPath)
			if err != nil {
				fmt.Println("⚠️ Skipping", entry.Name(), "- Error reading project.json:", err)
				continue
			}

			projects = append(projects, ProjectInfo{
				Dir:     entry.Name(),
				Project: data,
			})
		} else {
			fmt.Println("🚨 Warning: Found non-directory entry:", entry.Name())
		}
	}

	return projects, nil
}

// readProjectJSON reads and parses a project.json file
func readProjectJSON(filePath string) (ProjectData, error) {
	file, err := os.ReadFile(filePath)
	if err != nil {
		return ProjectData{}, err
	}

	var data ProjectData
	if err := json.Unmarshal(file, &data); err != nil {
		fmt.Println("❌ Error parsing JSON in", filePath, ":", err)
		return ProjectData{}, err
	}

	return data, nil
}

// getProjectsPath returns the correct projects folder path
func getProjectsPath() string {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		log.Fatal("❌ Error getting home directory:", err)
	}

	if runtime.GOOS == "windows" {
		return filepath.Join(homeDir, "Documents")
	}

	return filepath.Join(homeDir, "Developer")
}

func writeJSON(filePath string, data interface{}) error {
	file, err := os.Create(filePath)
	if err != nil {
		return err
	}
	defer file.Close()

	encoder := json.NewEncoder(file)
	encoder.SetIndent("", "  ")
	return encoder.Encode(data)
}

func validateProjectOptions(o NewProjectOptions) error {
	if len(o.Dir) == 0 {
		return fmt.Errorf("❌ Project directory cannot be empty")
	}
	if len(o.Name) == 0 {
		return fmt.Errorf("❌ Project name cannot be empty")
	}
	if len(o.Database) == 0 {
		return fmt.Errorf("❌ Database name cannot be empty")
	}
	return nil
}

func checkIfProjectExists(projectPath string) error {
	if _, err := os.Stat(projectPath); err == nil {
		return fmt.Errorf("❌ Project directory already exists: %s", projectPath)
	}
	return nil
}

// func fixPermissions(dest string) error {
// 	err := filepath.Walk(dest, func(path string, info os.FileInfo, err error) error {
// 		if err != nil {
// 			return err
// 		}

// 		// ✅ Ensure executable permissions for binaries in `node_modules/.bin/`
// 		if info.Mode().IsRegular() && filepath.Ext(path) == "" {
// 			if err := os.Chmod(path, 0755); err != nil {
// 				return fmt.Errorf("❌ Failed to set executable permission for: %s", path)
// 			}
// 		}
// 		return nil
// 	})

// 	if err != nil {
// 		return fmt.Errorf("❌ Error fixing permissions: %v", err)
// 	}

// 	fmt.Println("✅ File permissions fixed in:", dest)
// 	return nil
// }

func cloneRepoAndPrepare(repoURL, destDir string) error {
	// Ensure the destination directory does not already exist
	if _, err := os.Stat(destDir); !os.IsNotExist(err) {
		return fmt.Errorf("❌ Destination directory '%s' already exists", destDir)
	}

	// Clone the repository
	fmt.Println("🚀 Cloning repository:", repoURL, "to", destDir)
	cmd := exec.Command("git", "clone", "--depth", "1", repoURL, destDir)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr
	if err := cmd.Run(); err != nil {
		return fmt.Errorf("❌ Failed to clone repository: %v", err)
	}

	// Remove the .git directory
	gitDir := filepath.Join(destDir, ".git")
	if err := os.RemoveAll(gitDir); err != nil {
		return fmt.Errorf("❌ Failed to remove .git directory: %v", err)
	}

	fmt.Println("✅ Repository cloned and .git folder removed successfully!")
	return nil
}

func copyFile(src, dest string) error {
	sourceFile, err := os.Open(src)
	if err != nil {
		return err
	}
	defer sourceFile.Close()

	destFile, err := os.Create(dest)
	if err != nil {
		return err
	}
	defer destFile.Close()

	_, err = io.Copy(destFile, sourceFile)
	return err
}
