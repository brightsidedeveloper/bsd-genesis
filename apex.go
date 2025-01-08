package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
)

// ApexData represents the entire apex.json file structure
type ApexData struct {
	Endpoints  []Endpoint  `json:"endpoints"`
	Schemas    []Schema    `json:"schemas"`
	Operations []Operation `json:"operations"`
}

// Endpoint represents an API route with methods and security settings
type Endpoint struct {
	Path    string   `json:"path"`
	Methods []string `json:"methods"`
	Secured []string `json:"secured"`
}

// Schema represents an object with fields, supporting nested objects and arrays
type Schema struct {
	Name     string          `json:"name"`
	Type     string          `json:"type"`
	Fields   json.RawMessage `json:"fields"` // Raw JSON to support nested structures
	Required []string        `json:"required,omitempty"`
}

// Operation links an endpoint with schemas for queries, bodies, and responses
type Operation struct {
	Name           string `json:"name"`
	Endpoint       string `json:"endpoint"`
	Method         string `json:"method"`
	QuerySchema    string `json:"querySchema,omitempty"`
	BodySchema     string `json:"bodySchema,omitempty"`
	ResponseSchema string `json:"responseSchema,omitempty"`
}

func (a *App) GetApex(dir string) (*ApexData, error) {
	// Load apex.json file
	data, err := getApexData(filepath.Join(getSolarDir(a.ProjectsDir), dir))
	if err != nil {
		return nil, err
	}

	return data, nil
}

func (a *App) SaveApex(dir string, apexData ApexData) error {
	// Define the file path
	apexFilePath := filepath.Join(getSolarDir(a.ProjectsDir), dir, "apex.json")

	// Marshal ApexData into formatted JSON
	jsonData, err := json.MarshalIndent(apexData, "", "  ")
	if err != nil {
		return fmt.Errorf("failed to marshal apex.json: %w", err)
	}

	// Write JSON to the file
	if err := os.WriteFile(apexFilePath, jsonData, 0644); err != nil {
		return fmt.Errorf("failed to write apex.json: %w", err)
	}

	fmt.Println("✅ Successfully saved apex.json at:", apexFilePath)
	return nil
}

func (a *App) GenerateCode(dir string) error {
	a.mu.Lock()
	apex, err := a.GetApex(dir)
	if err != nil {
		return err
	}

	projectDir := getSolarDir(a.ProjectsDir)
	a.mu.Unlock()
	port := a.GetPort(dir)
	a.mu.Lock()
	defer a.mu.Unlock()
	// Generate TypeScript for Web, Desktop, and Native
	for _, platform := range []string{"web", "desktop", "mobile"} {
		generateTSTypes(apex, projectDir, filepath.Join(dir, "planets", platform))
		generateTSAPIClient(apex, projectDir, filepath.Join(dir, "planets", platform), port)
		generateTSQueries(apex, projectDir, filepath.Join(dir, "planets", platform))
	}

	// Generate Go structs, routes, and handlers
	generateGoStructs(apex, projectDir, dir)
	generateGoRoutes(apex, projectDir, dir)
	generateGoHandlers(apex, projectDir, dir)

	return nil
}
