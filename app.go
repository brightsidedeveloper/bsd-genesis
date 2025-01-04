package main

import (
	"context"
	"sync"
)

type App struct {
	ctx         context.Context
	mu          sync.Mutex
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
