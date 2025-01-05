package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"os"
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
		return nil, err
	}

	var data ProjectData
	if err := json.Unmarshal(file, &data); err != nil {
		fmt.Println("❌ Error parsing JSON in", filePath, ":", err)
		return nil, err
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
		return filepath.Join(homeDir, "Documents", "genesis", "projects")
	}

	return filepath.Join(homeDir, "Developer", "genesis", "projects")
}

func writeProjectJSON(filePath string, data ProjectData) error {
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

func fixPermissions(dest string) error {
	err := filepath.Walk(dest, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// ✅ Ensure executable permissions for binaries in `node_modules/.bin/`
		if info.Mode().IsRegular() && filepath.Ext(path) == "" {
			if err := os.Chmod(path, 0755); err != nil {
				return fmt.Errorf("❌ Failed to set executable permission for: %s", path)
			}
		}
		return nil
	})

	if err != nil {
		return fmt.Errorf("❌ Error fixing permissions: %v", err)
	}

	fmt.Println("✅ File permissions fixed in:", dest)
	return nil
}

func copyTemplate(srcDir, destDir string) error {
	if err := ensureDir(destDir); err != nil {
		return err
	}

	err := filepath.Walk(srcDir, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}

		// ✅ Skip `.git` and `node_modules/`
		base := filepath.Base(path)
		if info.IsDir() && (base == ".git" || base == "node_modules") {
			fmt.Println("🚫 Skipping directory:", path)
			return filepath.SkipDir
		}

		relPath, err := filepath.Rel(srcDir, path)
		if err != nil {
			return err
		}
		destPath := filepath.Join(destDir, relPath)

		if info.IsDir() {
			return ensureDir(destPath)
		}
		return copyFile(path, destPath)
	})

	if err != nil {
		return fmt.Errorf("❌ Error copying template: %v", err)
	}

	fmt.Println("✅ Template copied successfully!")
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
