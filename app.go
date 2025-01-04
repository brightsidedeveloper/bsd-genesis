package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
)

type App struct {
	ctx         context.Context
	ProjectsDir string
}

func NewApp() *App {
	projectsPath := getProjectsPath()
	return &App{
		ProjectsDir: projectsPath,
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

type ProjectData map[string]interface{}
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
	Dir      string `json:"dir"`
	Name     string `json:"name"`
	Database string `json:"database"`
}

func (a *App) CreateProject(o NewProjectOptions) error {
	if len(o.Dir) == 0 {
		return fmt.Errorf("❌ Project directory cannot be empty")
	}

	projectPath := filepath.Join(a.ProjectsDir, o.Dir)

	// Ensure the directory does not already exist
	if _, err := os.Stat(projectPath); err == nil {
		return fmt.Errorf("❌ Project directory already exists: %s", projectPath)
	}

	// Create project directory
	if err := ensureDir(projectPath); err != nil {
		return fmt.Errorf("❌ Failed to create project directory: %v", err)
	}

	if len(o.Name) == 0 {
		return fmt.Errorf("❌ Project name cannot be empty")
	}

	if len(o.Database) == 0 {
		return fmt.Errorf("❌ Database name cannot be empty")
	}

	// Create the project.json file
	projectData := ProjectData{
		"name":     o.Name,
		"database": o.Database, // Default database, can be changed as needed
	}

	projectFilePath := filepath.Join(projectPath, "project.json")
	if err := writeProjectJSON(projectFilePath, projectData); err != nil {
		return fmt.Errorf("❌ Failed to write project.json: %v", err)
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
