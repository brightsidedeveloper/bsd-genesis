package main

import (
	"fmt"
	"os"
	"path/filepath"
)

type ProjectData struct {
	Name        string `json:"name"`
	Database    string `json:"database"`
	Description string `json:"description"`
}
type ProjectInfo struct {
	Dir     string      `json:"dir"`
	Project ProjectData `json:"project"`
}

func (a *App) GetProjects() []ProjectInfo {
	if err := ensureDir(a.ProjectsDir); err != nil {
		fmt.Println("❌ Error ensuring projects directory:", err)
		return nil
	}

	fmt.Println("🔍 Scanning projects from:", a.ProjectsDir)

	projects, err := getProjectMetadata(a.ProjectsDir)

	if err != nil {
		fmt.Println("❌ Error getting project metadata:", err)
		return nil
	}

	fmt.Println("✅ Projects found:", len(projects))

	return projects
}

type NewProjectOptions struct {
	Dir         string `json:"dir"`
	Name        string `json:"name"`
	Database    string `json:"database"`
	Description string `json:"description"`
}

func (a *App) CreateProject(o NewProjectOptions) error {
	// Validate input parameters
	if err := validateProjectOptions(o); err != nil {
		return err
	}

	projectPath := filepath.Join(a.ProjectsDir, o.Dir)

	// Ensure the project directory does not already exist
	if err := checkIfProjectExists(projectPath); err != nil {
		return err
	}

	// Copy project template to new directory
	templatePath := filepath.Join("universe", "bsd-solar-system") // Change path if needed
	if err := copyTemplate(templatePath, filepath.Join(projectPath, "star")); err != nil {
		return fmt.Errorf("❌ Failed to copy template: %v", err)
	}

	// Create and write project.json with correct metadata
	projectFilePath := filepath.Join(projectPath, "project.json")
	projectData := ProjectData{
		Name:        o.Name,
		Database:    o.Database,
		Description: o.Description,
	}

	if err := writeJSON(projectFilePath, projectData); err != nil {
		return fmt.Errorf("❌ Failed to write project.json: %v", err)
	}

	apexFilePath := filepath.Join(projectPath, "apex.json")
	apexData := ApexData{
		Endpoints:  []Endpoint{},
		Schemas:    []Schema{},
		Operations: []Operation{},
	}

	if err := writeJSON(apexFilePath, apexData); err != nil {
		return fmt.Errorf("❌ Failed to write apex.json: %v", err)
	}

	fmt.Println("✅ Project successfully created at:", projectPath)
	return nil
}

func (a *App) DeleteProject(dir string) error {
	if len(dir) == 0 {
		return fmt.Errorf("❌ Project directory cannot be empty")
	}

	projectPath := filepath.Join(a.ProjectsDir, dir)

	// Ensure the directory exists
	if _, err := os.Stat(projectPath); os.IsNotExist(err) {
		return fmt.Errorf("❌ Project directory does not exist: %s", projectPath)
	}

	// Remove the project directory
	if err := os.RemoveAll(projectPath); err != nil {
		return fmt.Errorf("❌ Failed to remove project directory: %v", err)
	}

	fmt.Println("✅ Project successfully deleted:", projectPath)
	return nil
}
