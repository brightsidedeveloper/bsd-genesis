package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

func (a *App) AddPlanetToProject(dir, planetType string) error {
	// Define valid planets and their repo URLs
	validPlanets := map[string]string{
		"web":     "https://github.com/brightsidedeveloper/bsd-planet-web.git",
		"mobile":  "https://github.com/brightsidedeveloper/bsd-planet-mobile.git",
		"desktop": "https://github.com/brightsidedeveloper/bsd-planet-desktop.git",
	}

	// Validate the planet type
	repoURL, exists := validPlanets[planetType]
	if !exists {
		return fmt.Errorf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
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

	// Clone the planet template from GitHub
	if err := cloneRepoAndPrepare(repoURL, planetDestPath); err != nil {
		return fmt.Errorf("❌ Failed to clone planet template: %v", err)
	}

	fmt.Println("✅ Successfully added", planetType, "planet to project:", dir)
	return nil
}

type ClientApp struct {
	Type   string `json:"type"`   // "web", "mobile", "desktop"
	Exists bool   `json:"exists"` // true if the planet exists
}

func (a *App) GetActivePlanets(dir string) ([]ClientApp, error) {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
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
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
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

func (a *App) DeletePlanet(dir, planetType string) error {
	// ✅ Validate planet type
	validPlanets := map[string]bool{
		"web":     true,
		"mobile":  true,
		"desktop": true,
	}

	if !validPlanets[planetType] {
		return fmt.Errorf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	// ✅ Construct the path to the planet directory
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
	planetPath := filepath.Join(projectPath, "planets", planetType)

	// ✅ Ensure the directory exists
	if _, err := os.Stat(planetPath); os.IsNotExist(err) {
		return fmt.Errorf("❌ Planet '%s' does not exist in project '%s'", planetType, dir)
	}

	// ✅ Remove the planet directory
	if err := os.RemoveAll(planetPath); err != nil {
		return fmt.Errorf("❌ Failed to delete planet: %v", err)
	}

	fmt.Println("✅ Deleted", planetType, "planet for project", dir)
	return nil
}

func (a *App) RunBash(dir, planetType, cmd string) string {
	// ✅ Validate planet type
	validPlanets := map[string]bool{
		"web":     true,
		"mobile":  true,
		"desktop": true,
	}

	if !validPlanets[planetType] {
		return fmt.Sprintf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	// ✅ Construct the path to the planet directory
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
	planetPath := filepath.Join(projectPath, "planets", planetType)

	// ✅ Ensure the directory exists
	if _, err := os.Stat(planetPath); os.IsNotExist(err) {
		return fmt.Sprintf("❌ Planet '%s' does not exist in project '%s'", planetType, dir)
	}

	// ✅ Run the command
	fmt.Println("🚀 Running command in", planetType, "planet for project", dir, ":", cmd)
	output := runCommandInDir(planetPath, "bash", "-c", cmd)

	return output
}

func (a *App) StartDevServer(dir, planetType string) (string, error) {

	// ✅ Validate planet type
	validPlanets := map[string]bool{
		"web":     true,
		"mobile":  true,
		"desktop": true,
	}

	if !validPlanets[planetType] {
		return "", fmt.Errorf("❌ Invalid planet type: %s. Must be 'web', 'mobile', or 'desktop'", planetType)
	}

	// ✅ Construct the path to the planet directory
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir)
	planetPath := filepath.Join(projectPath, "planets", planetType)

	// ✅ Ensure the directory exists
	if _, err := os.Stat(planetPath); os.IsNotExist(err) {
		return "", fmt.Errorf("❌ Planet '%s' does not exist in project '%s'", planetType, dir)
	}

	// ✅ Ensure no previous processes are running before starting
	fmt.Println("🛑 Stopping any existing dev servers for", planetType, "in project", dir)
	_, err := a.StopDevServer(dir, planetType)
	if err != nil {
		fmt.Println("⚠️ Warning: Could not fully stop previous dev server:", err)
	}

	a.mu.Lock()
	defer a.mu.Unlock()

	// ✅ Start `npm run dev`
	fmt.Println("🚀 Starting dev server for", planetType, "planet in project", dir)
	cmd := exec.Command("npm", "run", "dev")
	cmd.Dir = planetPath

	// ✅ Capture output pipes
	stdoutPipe, err := cmd.StdoutPipe()
	if err != nil {
		return "", fmt.Errorf("❌ Failed to capture stdout: %v", err)
	}

	stderrPipe, err := cmd.StderrPipe()
	if err != nil {
		return "", fmt.Errorf("❌ Failed to capture stderr: %v", err)
	}

	// ✅ Start process in background
	if err := cmd.Start(); err != nil {
		return "", fmt.Errorf("❌ Failed to start dev server: %v", err)
	}

	// ✅ Use a WaitGroup to block for a short period before returning
	var wg sync.WaitGroup
	wg.Add(2) // ✅ Wait for both stdout and stderr

	output := ""

	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stdoutPipe)
		for scanner.Scan() {
			line := scanner.Text()
			output += line + "\n"
			fmt.Println(line) // ✅ Stream to UI
		}
	}()

	go func() {
		defer wg.Done()
		scanner := bufio.NewScanner(stderrPipe)
		for scanner.Scan() {
			line := scanner.Text()
			output += line + "\n"
			fmt.Println(line) // ✅ Stream to UI
		}
	}()

	// ✅ Wait for a brief period before returning
	waitTime := 2 * time.Second
	fmt.Println("⏳ Waiting", waitTime, "for logs before returning...")
	time.Sleep(waitTime)

	url := extractLocalURL(output) // ✅ Extract local URL from logs
	openBrowser(url)

	return output, nil
}

func (a *App) StopDevServer(dir, planetType string) (string, error) {
	a.mu.Lock()
	defer a.mu.Unlock()

	fmt.Println("🔍 Searching for running dev servers for:", planetType, "in project", dir)

	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir, "planets", planetType)

	// 🔍 Find all running processes related to this project
	cmd := exec.Command("ps", "aux")
	output, err := cmd.Output()
	if err != nil {
		return "", fmt.Errorf("❌ Failed to fetch process list: %v", err)
	}

	lines := strings.Split(string(output), "\n")
	processKilled := false

	for _, line := range lines {
		// Check if the process is running in the planet directory
		if strings.Contains(line, projectPath) {
			fields := strings.Fields(line)
			if len(fields) > 1 {
				pid := fields[1] // Extract PID
				fmt.Println("🔪 Killing process:", pid)
				exec.Command("kill", "-9", pid).Run() // Force kill
				processKilled = true
			}
		}
	}

	// ✅ If no process was killed, return a warning
	if !processKilled {
		fmt.Println("⚠️ No running dev servers found for:", planetType, "in project", dir)
		return "", nil
	}

	fmt.Println("✅ All dev server processes stopped for:", planetType, "in project", dir)
	return fmt.Sprintf("✅ Dev server stopped for '%s' in project '%s'", planetType, dir), nil
}

type DevServerStatus struct {
	Web     bool `json:"web"`
	Mobile  bool `json:"mobile"`
	Desktop bool `json:"desktop"`
}

func (a *App) GetDevServersStatus(dir string) DevServerStatus {
	projectPath := filepath.Join(getSolarDir(a.ProjectsDir), dir, "planets")

	return DevServerStatus{
		Web:     isDevServerRunning(filepath.Join(projectPath, "web")),
		Mobile:  isDevServerRunning(filepath.Join(projectPath, "mobile")),
		Desktop: isDevServerRunning(filepath.Join(projectPath, "desktop")),
	}
}
