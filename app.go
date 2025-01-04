package main

import (
	"context"
)

type App struct {
	ctx         context.Context
	ProjectsDir string
}

func NewApp() *App {
	return &App{
		ProjectsDir: "projects",
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
		return nil
	}

	projects, err := getProjectMetadata(a.ProjectsDir)
	if err != nil {
		return nil
	}

	return projects
}
