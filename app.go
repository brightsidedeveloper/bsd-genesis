package main

import (
	"context"
	"database/sql"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
)

type App struct {
	ctx         context.Context
	mu          sync.Mutex
	ProjectsDir string
	db          *sql.DB
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

func (a *App) OpenBrowser(url string) {
	openBrowser(url)
}
