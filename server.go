package main

import (
	"bufio"
	"fmt"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

func (a *App) StartServer(dir string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	projectPath := filepath.Join(filepath.Join(a.ProjectsDir, dir), dir+"-star")
	composeFile := filepath.Join(projectPath, "docker-compose.yaml")
	mainFile := filepath.Join(projectPath, "main.go")

	// Validate project directory
	if _, err := os.Stat(projectPath); os.IsNotExist(err) {
		return fmt.Errorf("❌ Project directory does not exist: %s", projectPath)
	}

	// Ensure main.go exists
	if _, err := os.Stat(mainFile); os.IsNotExist(err) {
		return fmt.Errorf("❌ main.go file is missing in project: %s", projectPath)
	}

	// Ensure Go dependencies are installed
	if err := setupGoModule(projectPath); err != nil {
		return fmt.Errorf("❌ Failed to setup Go module: %v", err)
	}

	// Start Docker Compose
	fmt.Println("🚀 Starting Docker Compose for:", dir)
	if err := runCommand("docker-compose", "-f", composeFile, "up", "-d"); err != nil {
		return fmt.Errorf("❌ Failed to start Docker Compose: %v", err)
	}

	fmt.Println("✅ Docker Compose started! Now launching Go application...")

	// ✅ Set the working directory for the Go process
	goProcess := exec.Command("go", "run", "main.go")
	goProcess.Dir = projectPath // ✅ Correctly sets the working directory
	goProcess.Stdout = os.Stdout
	goProcess.Stderr = os.Stderr

	// Start process
	if err := goProcess.Start(); err != nil {
		return fmt.Errorf("❌ Failed to start Go application: %v", err)
	}

	fmt.Println("✅ Go application is now running for:", dir)
	return nil
}

func (a *App) StopServer(dir string) error {
	a.mu.Lock()
	defer a.mu.Unlock()
	fmt.Println("🛑 Stopping server for:", dir)

	projectPath := filepath.Join(filepath.Join(a.ProjectsDir, dir), dir+"-star")
	composeFile := filepath.Join(projectPath, "docker-compose.yaml")

	// ✅ Kill orphaned Go processes
	fmt.Println("🔍 Searching for orphaned Go processes related to:", dir)

	// ✅ Loop to ensure the process is fully stopped
	timeout := 10 * time.Second             // Max wait time
	checkInterval := 500 * time.Millisecond // Check every 500ms
	deadline := time.Now().Add(timeout)

	for {
		// 🔍 Search for the running process
		cmd := exec.Command("ps", "aux")
		output, err := cmd.Output()
		if err != nil {
			fmt.Println("⚠️ Error running ps aux:", err)
			break
		}

		// ✅ Parse process list
		lines := strings.Split(string(output), "\n")
		processFound := false
		for _, line := range lines {
			if strings.Contains(line, projectPath) || strings.Contains(line, "exe/main") {
				processFound = true
				fields := strings.Fields(line)
				if len(fields) > 1 {
					pid := fields[1]
					fmt.Println("🔪 Killing orphaned Go process:", pid)
					exec.Command("kill", "-9", pid).Run()
				}
			}
		}

		// ✅ If no process found, break the loop
		if !processFound {
			fmt.Println("✅ All orphaned Go processes stopped.")
			break
		}

		// ❌ If timeout is reached, return an error
		if time.Now().After(deadline) {
			return fmt.Errorf("❌ Timeout: Process for %s did not stop in time", dir)
		}

		time.Sleep(checkInterval) // ✅ Wait and check again
	}

	// ✅ Stop Docker Compose
	fmt.Println("🛑 Stopping Docker Compose for:", dir)
	if err := runCommand("docker-compose", "-f", composeFile, "down"); err != nil {
		return fmt.Errorf("❌ Failed to stop Docker Compose: %v", err)
	}

	fmt.Println("✅ Docker Compose stopped for:", dir)
	return nil
}

func (a *App) RestartServer(dir string) error {
	fmt.Println("🔄 Restarting server for:", dir)

	// ✅ Step 1: Ensure the server is fully stopped before restarting
	if err := a.StopServer(dir); err != nil {
		fmt.Println("⚠️ Warning: StopServer returned an error:", err)
		return fmt.Errorf("❌ Failed to stop server: %v", err)
	}

	// ✅ Step 2: Start the new server
	if err := a.StartServer(dir); err != nil {
		return fmt.Errorf("❌ Failed to start server: %v", err)
	}

	fmt.Println("✅ Server restarted successfully for:", dir)
	return nil
}

func (a *App) GetPort(dir string) string {
	a.mu.Lock()
	defer a.mu.Unlock()

	projectPath := filepath.Join(filepath.Join(a.ProjectsDir, dir), dir+"-star")
	envFilePath := filepath.Join(projectPath, ".env")

	// ✅ Ensure .env file exists
	if _, err := os.Stat(envFilePath); os.IsNotExist(err) {
		fmt.Println("⚠️ .env file not found, returning default port 8080")
		return "8080"
	}

	file, err := os.Open(envFilePath)
	if err != nil {
		fmt.Printf("❌ Failed to open .env file: %v\n", err)
		return "8080"
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text()) // ✅ Trim whitespace to avoid issues
		if strings.HasPrefix(line, "PORT=") {
			fmt.Println("✅ Found PORT= in .env file:", line)
			return strings.TrimSpace(strings.TrimPrefix(line, "PORT="))
		}
	}

	fmt.Println("⚠️ PORT= not found in .env, returning default 8080")
	return "8080"
}

func (a *App) UpdatePort(dir, newPort string) error {
	a.mu.Lock()
	defer a.mu.Unlock()

	projectPath := filepath.Join(filepath.Join(a.ProjectsDir, dir), dir+"-star")
	envFilePath := filepath.Join(projectPath, ".env")

	// ✅ Ensure .env file exists before modifying
	if _, err := os.Stat(envFilePath); os.IsNotExist(err) {
		fmt.Println("⚠️ .env file not found, creating a new one with PORT=" + newPort)
		return os.WriteFile(envFilePath, []byte("PORT="+newPort+"\n"), 0644)
	}

	file, err := os.Open(envFilePath)
	if err != nil {
		return fmt.Errorf("❌ Failed to open .env file: %v", err)
	}
	defer file.Close()

	var updatedLines []string
	scanner := bufio.NewScanner(file)
	portUpdated := false

	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text()) // ✅ Trim whitespace
		if strings.HasPrefix(line, "PORT=") {
			updatedLines = append(updatedLines, "PORT="+newPort)
			portUpdated = true
		} else {
			updatedLines = append(updatedLines, line)
		}
	}

	if err := scanner.Err(); err != nil {
		return fmt.Errorf("❌ Failed to read .env file: %v", err)
	}

	// ✅ If no PORT= entry was found, add it at the end
	if !portUpdated {
		fmt.Println("⚠️ PORT= not found, adding PORT=" + newPort)
		updatedLines = append(updatedLines, "PORT="+newPort)
	}

	// ✅ Write the updated lines back to the `.env` file
	err = os.WriteFile(envFilePath, []byte(strings.Join(updatedLines, "\n")+"\n"), 0644)
	if err != nil {
		return fmt.Errorf("❌ Failed to write .env file: %v", err)
	}

	fmt.Println("✅ PORT updated to:", newPort)
	return nil
}

// ✅ ServerStatus struct to return DB & Server status
type ServerStatus struct {
	DB     string `json:"db"`     // "running" | "stopped"
	Server string `json:"server"` // "running" | "stopped"
}

// ✅ Function to Check Server & DB Status
func (a *App) GetServerStatus(dir string) ServerStatus {
	projectPath := filepath.Join(filepath.Join(a.ProjectsDir, dir), dir+"-star")
	composeFile := filepath.Join(projectPath, "docker-compose.yaml")

	status := ServerStatus{
		DB:     "stopped",
		Server: "stopped",
	}

	// ✅ Step 1: Check if the Go application is running
	cmd := exec.Command("pgrep", "-fl", "go")
	output, err := cmd.Output()
	if err == nil {
		lines := strings.Split(string(output), "\n")
		for _, line := range lines {
			if strings.Contains(line, projectPath) || strings.Contains(line, "exe/main") {
				status.Server = "running"
				break
			}
		}
	}

	// ✅ Step 2: Check if Docker DB service is running
	cmd = exec.Command("docker-compose", "-f", composeFile, "ps", "--services", "--filter", "status=running")
	output, err = cmd.Output()
	if err == nil {
		runningServices := strings.TrimSpace(string(output))
		if strings.Contains(runningServices, "db") { // Assuming your DB service is named "db"
			status.DB = "running"
		}
	}

	return status
}
