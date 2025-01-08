package main

import (
	"fmt"
	"os"
	"path/filepath"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing/object"
	_ "github.com/go-git/go-git/v5/plumbing/object"
)

func (a *App) InitGitRepo(dir string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Check if .git exists
	if _, err := os.Stat(filepath.Join(projectPath, ".git")); err == nil {
		fmt.Println("✅ Git repository already initialized")
		return nil
	}

	_, err := git.PlainInit(projectPath, false)
	if err != nil {
		return fmt.Errorf("❌ Failed to initialize Git repository: %v", err)
	}

	fmt.Println("🚀 Git repository initialized at:", projectPath)
	return nil
}

// GetGitStatus retrieves the current Git status
func (a *App) GetGitStatus(dir string) (string, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return "", fmt.Errorf("❌ Not a Git repository")
	}

	wt, err := repo.Worktree()
	if err != nil {
		return "", fmt.Errorf("❌ Failed to get worktree: %v", err)
	}

	// Get the status of the working directory
	status, err := wt.Status()
	if err != nil {
		return "", fmt.Errorf("❌ Failed to get status: %v", err)
	}

	return status.String(), nil
}

func (a *App) GitCommit(dir, message string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("❌ Not a Git repository")
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("❌ Failed to get worktree: %v", err)
	}

	err = wt.AddWithOptions(&git.AddOptions{All: true})
	if err != nil {
		return fmt.Errorf("❌ Failed to stage changes: %v", err)
	}

	fmt.Println("✅ All changes staged!")

	_, err = wt.Commit(message, &git.CommitOptions{
		Author: &object.Signature{
			Name:  "Genesis",
			Email: "tim@brightsidedeveloper.com",
			When:  time.Now(),
		},
	})
	if err != nil {
		return fmt.Errorf("❌ Commit failed: %v", err)
	}

	fmt.Println("✅ Changes committed successfully!")
	return nil
}
