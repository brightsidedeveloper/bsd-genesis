package main

import "path/filepath"

// getSQLHistoryFilePath returns the full path to sql-editor.json
func (a *App) getSQLHistoryFilePath(dir string) string {
	return filepath.Join(a.ProjectsDir, dir, "sql-editor.json")
}
