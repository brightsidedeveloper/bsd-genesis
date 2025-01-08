package main

import (
	"context"
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"sync"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/joho/godotenv"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx         context.Context
	mu          sync.Mutex
	ProjectsDir string
	db          *sql.DB
	env         map[string]string
}

func NewApp() *App {
	app := &App{
		env: make(map[string]string),
	}

	if err := app.LoadEnv(); err != nil {
		log.Println("⚠️ Failed to load environment variables:", err)
	}

	app.ProjectsDir = app.GetEnvVariable("GENESIS_PATH")

	return app
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx
}

func (a *App) OpenBrowser(url string) {
	openBrowser(url)
}

func GetEnvPath() string {
	homeDir, _ := os.UserHomeDir()
	return filepath.Join(homeDir, ".wails-genesis")
}

func (a *App) LoadEnv() error {
	envPath := GetEnvPath()

	// Attempt to read existing .env file
	env, err := godotenv.Read(envPath)
	if err != nil {
		if os.IsNotExist(err) {
			log.Println("⚠️ No .env file found. Creating one with system defaults...")

			// Generate default path
			defaultGenesisPath := getProjectsPath()

			// Ensure the directory exists
			if err := ensureDir(defaultGenesisPath); err != nil {
				return fmt.Errorf("❌ Failed to create GENESIS_PATH directory: %w", err)
			}

			// Save default path to .env
			defaultEnv := map[string]string{"GENESIS_PATH": defaultGenesisPath}
			if err := godotenv.Write(defaultEnv, envPath); err != nil {
				return fmt.Errorf("❌ Failed to create default .env file: %w", err)
			}

			log.Println("✅ Created .env with GENESIS_PATH =", defaultGenesisPath)

			// Load newly created .env file
			env = defaultEnv
		} else {
			return fmt.Errorf("❌ Failed to read .env file: %w", err)
		}
	}

	// Store in-memory cache
	a.mu.Lock()
	a.env = env
	a.mu.Unlock()

	log.Println("✅ Loaded environment variables successfully.")
	return nil
}

// GetEnvVariable retrieves a value from the in-memory environment.
func (a *App) GetEnvVariable(key string) string {
	a.mu.Lock()
	defer a.mu.Unlock()

	value, exists := a.env[key]
	if !exists {
		log.Println("⚠️ Environment variable not found:", key)
	}
	return value
}

// SaveEnvVariable sets a key-value pair in the `.env` file and updates memory.
func (a *App) SaveEnvVariable(key, value string) error {
	envPath := GetEnvPath()

	a.mu.Lock()
	defer a.mu.Unlock()

	// Load existing values first
	existingEnv, err := godotenv.Read(envPath)
	if err != nil && !os.IsNotExist(err) {
		return fmt.Errorf("❌ Failed to read existing .env file: %w", err)
	}

	// Update the key-value pair
	existingEnv[key] = value

	// Save updated .env file
	if err := godotenv.Write(existingEnv, envPath); err != nil {
		return fmt.Errorf("❌ Failed to write .env file: %w", err)
	}

	// Update in-memory cache
	a.env[key] = value

	log.Println("✅ Saved env variable:", key, "=", value)
	return nil
}

func (a *App) PickGenesisPath() string {
	path, err := runtime.OpenDirectoryDialog(a.ctx, runtime.OpenDialogOptions{})
	if err != nil || path == "" {
		log.Println("⚠️ User canceled directory selection or an error occurred")
		return ""
	}

	// Save new path to .env
	if err := a.SaveEnvVariable("GENESIS_PATH", path); err != nil {
		log.Println("❌ Failed to save GENESIS_PATH:", err)
		return ""
	}

	a.ProjectsDir = path

	log.Println("✅ GENESIS_PATH updated to:", path)
	return path
}
