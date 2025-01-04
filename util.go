package main

import (
	"encoding/json"
	"os"
	"path/filepath"
)

func ensureDir(dir string) error {
	if _, err := os.Stat(dir); os.IsNotExist(err) {
		return os.MkdirAll(dir, os.ModePerm)
	}
	return nil
}

func getProjectMetadata(dir string) ([]ProjectInfo, error) {
	var projects []ProjectInfo

	entries, err := os.ReadDir(dir)
	if err != nil {
		return nil, err
	}

	for _, entry := range entries {
		if entry.IsDir() {
			projectPath := filepath.Join(dir, entry.Name(), "project.json")

			// Read and parse project.json
			data, err := readProjectJSON(projectPath)
			if err != nil {
				continue
			}

			// Add to project list
			projects = append(projects, ProjectInfo{
				Dir:     entry.Name(),
				Project: data,
			})
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
		return nil, err
	}

	return data, nil
}
