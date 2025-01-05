package main

import (
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
)

func (a *App) AddPlanetToProject(dir, planetType string) error {
	// Validate input
	validPlanets := map[string]string{
		"web":     "bsd-planet-web",
		"mobile":  "bsd-planet-mobile",
		"desktop": "bsd-planet-desktop",
	}

	// Check if the planet type is valid
	planetTemplate, exists := validPlanets[planetType]
	if !exists {
		return fmt.Errorf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	projectPath := filepath.Join(a.ProjectsDir, dir)
	planetsPath := filepath.Join(projectPath, "planets")
	planetDestPath := filepath.Join(planetsPath, planetType)

	// Ensure the planets directory exists
	if err := ensureDir(planetsPath); err != nil {
		return fmt.Errorf("❌ Failed to create planets directory: %v", err)
	}

	// Check if the planet already exists
	if _, err := os.Stat(planetDestPath); err == nil {
		return fmt.Errorf("❌ Planet '%s' already exists in project '%s'", planetType, dir)
	}

	// Define the source template path
	templatePath := filepath.Join("universe", planetTemplate)

	// Copy the planet template to the project's planets folder
	if err := copyTemplate(templatePath, planetDestPath); err != nil {
		return fmt.Errorf("❌ Failed to copy planet template: %v", err)
	}

	fmt.Println("✅ Successfully added", planetType, "planet to project:", dir)
	return nil
}

type ClientApp struct {
	Type   string `json:"type"`   // "web", "mobile", "desktop"
	Exists bool   `json:"exists"` // true if the planet exists
}

func (a *App) GetActivePlanets(dir string) ([]ClientApp, error) {
	projectPath := filepath.Join(a.ProjectsDir, dir)
	planetsPath := filepath.Join(projectPath, "planets")

	// ✅ Ensure the planets directory exists
	if _, err := os.Stat(planetsPath); os.IsNotExist(err) {
		fmt.Println("⚠️ Planets directory does not exist in project:", dir)
		// Return the structure with all planets as `exists: false`
		return []ClientApp{
			{Type: "web", Exists: false},
			{Type: "mobile", Exists: false},
			{Type: "desktop", Exists: false},
		}, nil
	}

	// ✅ Read the contents of the planets directory
	entries, err := os.ReadDir(planetsPath)
	if err != nil {
		return nil, fmt.Errorf("❌ Error reading planets directory: %v", err)
	}

	// ✅ Initialize the struct slice with default `false`
	activePlanets := []ClientApp{
		{Type: "web", Exists: false},
		{Type: "mobile", Exists: false},
		{Type: "desktop", Exists: false},
	}

	// ✅ Loop through the entries and mark active planets
	for _, entry := range entries {
		if entry.IsDir() {
			for i, planet := range activePlanets {
				if planet.Type == entry.Name() { // Match against "web", "mobile", "desktop"
					activePlanets[i].Exists = true
				}
			}
		}
	}

	fmt.Println("✅ Active planets for project", dir, ":", activePlanets)
	return activePlanets, nil
}

// ✅ Opens a planet directory in VS Code
func (a *App) OpenPlanetInVSCode(dir, planetType string) error {
	// Define valid planet types
	validPlanets := map[string]bool{
		"web":     true,
		"mobile":  true,
		"desktop": true,
	}

	// ✅ Validate input
	if !validPlanets[planetType] {
		return fmt.Errorf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	// ✅ Construct the path to the planet directory
	projectPath := filepath.Join(a.ProjectsDir, dir)
	planetPath := filepath.Join(projectPath, "planets", planetType)

	// ✅ Ensure the directory exists before opening
	if _, err := os.Stat(planetPath); os.IsNotExist(err) {
		return fmt.Errorf("❌ Planet '%s' does not exist in project '%s'", planetType, dir)
	}

	// ✅ Open the planet in VS Code
	fmt.Println("🚀 Opening", planetType, "planet for project", dir, "in VS Code...")
	cmd := exec.Command("code", planetPath)
	cmd.Stdout = os.Stdout
	cmd.Stderr = os.Stderr

	// ✅ Run the command to open VS Code
	if err := cmd.Start(); err != nil {
		return fmt.Errorf("❌ Failed to open VS Code: %v", err)
	}

	fmt.Println("✅ VS Code opened successfully for", planetType, "planet in project", dir)
	return nil
}
