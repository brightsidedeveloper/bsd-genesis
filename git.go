package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"time"

	git "github.com/go-git/go-git/v5"
	"github.com/go-git/go-git/v5/plumbing"
	"github.com/go-git/go-git/v5/plumbing/object"
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
		return fmt.Errorf("%v", err)
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
		return "", fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return "", fmt.Errorf("%v", err)
	}

	// Get the status of the working directory
	status, err := wt.Status()
	if err != nil {
		return "", fmt.Errorf("%v", err)
	}

	return status.String(), nil
}

func (a *App) GitCommit(dir, message string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	err = wt.AddWithOptions(&git.AddOptions{All: true})
	if err != nil {
		return fmt.Errorf("%v", err)
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
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Changes committed successfully!")
	return nil
}

func (a *App) GetCurrentBranch(dir string) (string, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return "", fmt.Errorf("%v", err)
	}

	// Get HEAD reference
	headRef, err := repo.Head()
	if err != nil {
		return "", fmt.Errorf("%v", err)
	}

	// Extract branch name
	return headRef.Name().Short(), nil
}

func (a *App) GetAllBranches(dir string) ([]string, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	// Get the branch iterator
	branchesIter, err := repo.Branches()
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	var branches []string
	err = branchesIter.ForEach(func(ref *plumbing.Reference) error {
		branches = append(branches, ref.Name().Short())
		return nil
	})
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	return branches, nil
}

func (a *App) SwitchBranch(dir, branchName string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Checkout the branch
	err = wt.Checkout(&git.CheckoutOptions{
		Branch: plumbing.NewBranchReferenceName(branchName),
	})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("Switched to branch:", branchName)
	return nil
}

func (a *App) GetCommitHistory(dir string, limit int) ([]string, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	// Get commit history
	iter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	var commits []string
	count := 0

	// Iterate over commits
	err = iter.ForEach(func(c *object.Commit) error {
		commitStr := fmt.Sprintf("🔹 %s - %s (%s)", c.Hash.String()[:7], c.Message, c.Author.When.Format("2006-01-02 15:04:05"))
		commits = append(commits, commitStr)

		count++
		if limit > 0 && count >= limit {
			return fmt.Errorf("%v", err)
		}
		return nil
	})

	// Ignore stop error
	if err != nil && err.Error() != "stop" {
		return nil, fmt.Errorf("%v", err)
	}

	return commits, nil
}

func (a *App) CreateBranch(dir, newBranchName string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Get current branch reference
	headRef, err := repo.Head()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Create a new branch reference
	newBranchRef := plumbing.NewBranchReferenceName(newBranchName)

	// Check if the branch already exists
	branchesIter, err := repo.Branches()
	if err != nil {
		return fmt.Errorf("%v", err)
	}
	err = branchesIter.ForEach(func(ref *plumbing.Reference) error {
		if ref.Name() == newBranchRef {
			return fmt.Errorf("%v", err)
		}
		return nil
	})
	if err != nil {
		return err
	}

	// Create the new branch
	ref := plumbing.NewHashReference(newBranchRef, headRef.Hash())
	err = repo.Storer.SetReference(ref)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Switch to the new branch
	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}
	err = wt.Checkout(&git.CheckoutOptions{Branch: newBranchRef})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Created and switched to new branch:", newBranchName)
	return nil
}

func (a *App) DeleteCurrentBranch(dir string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Get the current branch
	currentBranch, err := a.GetCurrentBranch(dir)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Get all branches
	branches, err := a.GetAllBranches(dir)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Ensure there's another branch to switch to
	if len(branches) <= 1 {
		return fmt.Errorf(" Cannot delete the only branch in the repository")
	}

	// Find an alternative branch (excluding current)
	var alternativeBranch string
	for _, branch := range branches {
		if branch != currentBranch {
			alternativeBranch = branch
			break
		}
	}

	// Switch to the alternative branch
	if err := a.SwitchBranch(dir, alternativeBranch); err != nil {
		return fmt.Errorf("%v", err)
	}

	// Delete the current branch
	err = repo.Storer.RemoveReference(plumbing.NewBranchReferenceName(currentBranch))
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Deleted branch:", currentBranch)
	fmt.Println("✅ Switched to branch:", alternativeBranch)
	return nil
}

func (a *App) DiscardChanges(dir string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Reset all changes (like `git reset --hard`)
	err = wt.Reset(&git.ResetOptions{Mode: git.HardReset})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Remove untracked files (like `git clean -fd`)
	err = wt.Clean(&git.CleanOptions{Dir: true})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ All uncommitted changes discarded!")
	return nil
}

func (a *App) StashChanges(dir, message string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	if err := wt.AddWithOptions(&git.AddOptions{All: true}); err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ All changes staged!")

	// Commit the current state to stash
	commit, err := wt.Commit(fmt.Sprintf("Stash: %s", message), &git.CommitOptions{
		Author: &object.Signature{
			Name:  "Genesis",
			Email: "tim@brightsidedeveloper.com",
			When:  time.Now(),
		},
		All: true,
	})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Changes stashed with message:", message)
	fmt.Println("🔹 Stash commit:", commit.String())
	return nil
}

type GitStashItem struct {
	Index   int    `json:"index"`
	Hash    string `json:"hash"`
	Message string `json:"message"`
}

func (a *App) GetAllStashes(dir string) ([]GitStashItem, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	// Get commit history
	iter, err := repo.Log(&git.LogOptions{})
	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	var stashes []GitStashItem
	index := 0

	// Iterate over commits and find stash commits
	err = iter.ForEach(func(c *object.Commit) error {
		if len(c.Message) > 6 && c.Message[:6] == "Stash:" { // Identify stash commits
			stashes = append(stashes, GitStashItem{
				Index:   index,
				Hash:    c.Hash.String(),
				Message: c.Message,
			})
			index++
		}
		return nil
	})

	if err != nil {
		return nil, fmt.Errorf("%v", err)
	}

	return stashes, nil
}

// ApplyStash applies a stash but keeps it in the stash list
func (a *App) ApplyStash(dir string, stashIndex int) error {
	stashes, err := a.GetAllStashes(dir)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	if stashIndex < 0 || stashIndex >= len(stashes) {
		return fmt.Errorf(" Invalid stash index: %d", stashIndex)
	}

	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	wt, err := repo.Worktree()
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Apply the stash commit (reset but do not remove from stash list)
	err = wt.Reset(&git.ResetOptions{
		Commit: plumbing.NewHash(stashes[stashIndex].Hash),
		Mode:   git.HardReset,
	})
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Applied stash:", stashes[stashIndex].Message)
	return nil
}

// DeleteStash removes a stash commit from history.
func (a *App) DeleteStash(dir string, stashIndex int) error {
	stashes, err := a.GetAllStashes(dir)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	if stashIndex < 0 || stashIndex >= len(stashes) {
		return fmt.Errorf(" Invalid stash index: %d", stashIndex)
	}

	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Open the repository
	repo, err := git.PlainOpen(projectPath)
	if err != nil {
		return fmt.Errorf("%v", err)
	}

	// Get stash commit hash
	stashHash := stashes[stashIndex].Hash

	// Perform a soft reset to remove the stash commit from history
	err = repo.Storer.RemoveReference(plumbing.ReferenceName(fmt.Sprintf("refs/stash/%s", stashHash)))
	if err != nil {
		return fmt.Errorf(" Failed to delete stash: %v", err)
	}

	fmt.Println("✅ Deleted stash:", stashes[stashIndex].Message)
	return nil
}

func (a *App) MergeBranch(dir, targetBranch, sourceBranch string) error {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)

	// Ensure we are in the project directory

	if err := a.SwitchBranch(dir, targetBranch); err != nil {
		return fmt.Errorf("%v", err)
	}

	fmt.Println("✅ Switched to target branch:", targetBranch)

	// Execute `git merge sourceBranch`
	mergeCmd := exec.Command("git", "-C", projectPath, "merge", sourceBranch)
	mergeCmd.Stdout = os.Stdout
	mergeCmd.Stderr = os.Stderr
	err := mergeCmd.Run()
	if err != nil {
		// If there is a conflict, open VS Code
		fmt.Println(" Merge conflict detected! Opening VS Code for manual resolution...")
		a.OpenProjectInVSCode(dir)
		return fmt.Errorf("merge conflict. Resolve conflicts manually in VS Code")
	}

	fmt.Println("✅ Successfully merged", sourceBranch, "into", targetBranch)
	return nil
}
