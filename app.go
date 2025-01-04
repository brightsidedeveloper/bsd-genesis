package main

import (
	"context"
	"fmt"
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
