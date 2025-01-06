package main

import (
	"encoding/json"
	"fmt"
	"os"
	"path/filepath"
	"regexp"
	"strings"
)

func getApexData(projectDir string) (*ApexData, error) {
	apexFilePath := filepath.Join(projectDir, "apex.json")

	fmt.Println("📖 Checking for apex.json in:", apexFilePath)

	// Read apex.json file
	data, err := os.ReadFile(apexFilePath)
	if err != nil {
		fmt.Println("❌ Error reading apex.json:", err)
		return nil, err
	}

	// Parse JSON into ApexData struct
	var apexData ApexData
	if err := json.Unmarshal(data, &apexData); err != nil {
		fmt.Println("❌ Error parsing apex.json:", err)
		return nil, err
	}

	fmt.Println("✅ Successfully loaded APEX data for project:", projectDir)
	return &apexData, nil
}

func tsType(value json.RawMessage) string {
	// Try to unmarshal into a string (for primitive types)
	var primitiveType string
	if err := json.Unmarshal(value, &primitiveType); err == nil {
		switch primitiveType {
		case "string", "number", "boolean":
			return primitiveType
		default:
			// Assume it's a reference to another schema
			return primitiveType
		}
	}

	// Try to unmarshal into an object that represents an array
	var arrayType struct {
		Type      string `json:"type"`
		ArrayType string `json:"arrayType"`
	}
	if err := json.Unmarshal(value, &arrayType); err == nil && arrayType.Type == "array" {
		return tsType(json.RawMessage(`"`+arrayType.ArrayType+`"`)) + "[]"
	}

	return "any" // Fallback for unknown types
}

// generateTSTypes creates TypeScript interfaces from the APEX schema.
func generateTSTypes(apex *ApexData, projectDir, subDir string) error {
	projectPath := filepath.Join(projectDir, subDir)
	if !folderExists(projectPath) {
		fmt.Println("Skipping TypeScript generation, directory missing:", projectPath)
		return nil
	}

	fmt.Println("Generating TypeScript types in:", projectPath)

	// Generate TypeScript types
	ts := "/* Auto-generated TypeScript Types */\n\n"
	for _, schema := range apex.Schemas {
		ts += fmt.Sprintf("export type %s = {\n", schema.Name)

		// Parse fields from JSON
		var fields map[string]json.RawMessage
		if err := json.Unmarshal(schema.Fields, &fields); err != nil {
			fmt.Println("⚠️ Failed to parse fields for schema:", schema.Name, err)
			continue
		}

		for key, value := range fields {
			ts += fmt.Sprintf("  %s: %s;\n", key, tsType(value))
		}
		ts += "}\n\n"
	}

	// Define TypeScript output path
	tsDir := filepath.Join(projectPath, "src", "api")
	ensureDir(tsDir)

	filePath := filepath.Join(tsDir, "types.ts")
	err := os.WriteFile(filePath, []byte(ts), 0644)
	if err != nil {
		fmt.Println("❌ Failed to write TypeScript types:", err)
	} else {
		fmt.Println("✅ Successfully generated TypeScript types at:", filePath)
	}
	return err
}

func tsMethod(method string) string {
	switch strings.ToUpper(method) {
	case "GET":
		return "get"
	case "POST":
		return "post"
	case "PUT":
		return "put"
	case "DELETE":
		return "delete"
	case "PATCH":
		return "patch"
	default:
		return ""
	}
}

// generateTSQueries creates a queries.ts file for react-query hooks using APEX
func generateTSQueries(apex *ApexData, projectDir, subDir string) error {
	projectPath := filepath.Join(projectDir, subDir)
	if !folderExists(projectPath) {
		fmt.Println("Skipping queries.ts generation, directory missing:", projectPath)
		return nil
	}

	fmt.Println("Generating TypeScript queries in:", projectPath)

	// Collect used query schema types
	usedQueryTypes := make(map[string]bool)

	// Start building queries.ts content
	ts := `/**
 * Auto-generated File - BSD
 */

import { UseQueryOptions, queryOptions } from '@tanstack/react-query';
import APEX from './apex';
`

	// Collect function definitions
	var functionDefs []string
	for _, op := range apex.Operations {
		if op.Method != "GET" {
			continue // Skip non-GET requests
		}

		funcName := fmt.Sprintf("create%sQuery", op.Name)
		queryKeyFunc := fmt.Sprintf("get%sQueryKey", op.Name)
		queryKeyType := fmt.Sprintf("%sQueryKey", op.Name)

		paramsDef := ""
		paramsArg := ""
		if op.QuerySchema != "" {
			paramsDef = fmt.Sprintf("params: %s, ", op.QuerySchema)
			paramsArg = "params"
			usedQueryTypes[op.QuerySchema] = true
		}

		// Create query function
		function := fmt.Sprintf(`
export function %s<TData = Awaited<ReturnType<typeof APEX.%s>>, TError = Error>(%sopts: Omit<UseQueryOptions<Awaited<ReturnType<typeof APEX.%s>>, TError, TData, %s>, 'queryKey' | 'queryFn'> = {}) {
  return queryOptions({
    ...opts,
    queryKey: %s(%s),
    queryFn() {
      return APEX.%s(%s);
    },
  });
}

export function %s(%s) {
  return ['%s'%s] as const;
}

export type %s = ReturnType<typeof %s>;`, funcName, op.Name, paramsDef, op.Name, queryKeyType, queryKeyFunc, paramsArg, op.Name, paramsArg, queryKeyFunc, paramsDef, op.Name,
			func() string {
				if paramsArg != "" {
					return ", params"
				}
				return ""
			}(),
			queryKeyType, queryKeyFunc)

		functionDefs = append(functionDefs, function)
	}

	// Add Type Imports **Only for Query Params**
	importTypes := []string{}
	for typ := range usedQueryTypes {
		importTypes = append(importTypes, typ)
	}

	if len(importTypes) > 0 {
		ts += fmt.Sprintf("import { %s } from './types';\n", strings.Join(importTypes, ", "))
	}

	// Add function definitions
	ts += "\n" + strings.Join(functionDefs, "\n") + "\n"

	// Ensure output directory exists
	tsDir := filepath.Join(projectPath, "src", "api")
	ensureDir(tsDir)

	// Write queries.ts file
	filePath := filepath.Join(tsDir, "queries.ts")
	err := os.WriteFile(filePath, []byte(ts), 0644)
	if err != nil {
		fmt.Println("❌ Failed to write TypeScript queries.ts:", err)
	} else {
		fmt.Println("✅ Successfully generated queries.ts at:", filePath)
	}

	return err
}

func generateTSImports(apex *ApexData) string {
	usedSchemas := make(map[string]bool)

	// Collect all used schemas
	for _, op := range apex.Operations {
		if op.QuerySchema != "" {
			usedSchemas[op.QuerySchema] = true
		}
		if op.BodySchema != "" {
			usedSchemas[op.BodySchema] = true
		}
		if op.ResponseSchema != "" {
			usedSchemas[op.ResponseSchema] = true
		}
	}

	// Convert to sorted list for predictable output
	var imports []string
	for schema := range usedSchemas {
		imports = append(imports, schema)
	}
	return strings.Join(imports, ", ")
}

// generateTSMethods collects only **used** HTTP methods
func generateTSMethods(apex *ApexData) string {
	usedMethods := make(map[string]bool)

	for _, op := range apex.Operations {
		method := tsMethod(op.Method)
		if method != "UnknownMethod" {
			usedMethods[method] = true
		}
	}

	// Convert to sorted list for predictable output
	var methods []string
	for method := range usedMethods {
		methods = append(methods, method)
	}
	return strings.Join(methods, ", ")
}

// generateTSAPIClient creates an API client for frontend consumption
func generateTSAPIClient(apex *ApexData, projectDir, subDir, port string) error {
	projectPath := filepath.Join(projectDir, subDir)
	if !folderExists(projectPath) {
		fmt.Println("Skipping API client generation, directory missing:", projectPath)
		return nil
	}

	fmt.Println("Generating TypeScript API client in:", projectPath)

	// Get the dynamic port from .env file
	baseURL := fmt.Sprintf("http://localhost:%s", port)

	// Generate only the imports that are **used**
	tsImports := generateTSMethods(apex)
	if tsImports != "" {
		tsImports = "import { " + tsImports + " } from './request';\n"
	}

	tsTypes := generateTSImports(apex)
	if tsTypes != "" {
		tsTypes = "import { " + tsTypes + " } from './types';\n"
	}

	// TypeScript API Client header
	ts := "/* Auto-generated API Client */\n\n" + tsImports + tsTypes + "\n"

	for _, op := range apex.Operations {
		funcName := op.Name
		endpoint := op.Endpoint
		method := tsMethod(op.Method)
		responseType := op.ResponseSchema

		// Determine parameter type
		var paramsDef, paramsArg string
		if op.QuerySchema != "" {
			paramsDef = fmt.Sprintf("params: %s", op.QuerySchema)
			paramsArg = "params"
		} else if op.BodySchema != "" {
			paramsDef = fmt.Sprintf("body: %s", op.BodySchema)
			paramsArg = "body"
		} else {
			paramsDef = ""
			paramsArg = ""
		}

		// Generate API client function
		ts += fmt.Sprintf("async function %s(%s): Promise<%s> {\n", funcName, paramsDef, responseType)
		ts += fmt.Sprintf("  return %s<%s>('%s'%s);\n", method, responseType, endpoint,
			func() string {
				if paramsArg != "" {
					return ", " + paramsArg
				}
				return ""
			}(),
		)
		ts += "}\n\n"
	}

	ts += "export default class APEX {\n"
	for _, op := range apex.Operations {
		ts += fmt.Sprintf("  static %s = %s;\n", op.Name, op.Name)
	}
	ts += "}\n"

	// Ensure output directory exists
	tsDir := filepath.Join(projectPath, "src", "api")
	ensureDir(tsDir)

	// Write API client to file
	filePath := filepath.Join(tsDir, "apex.ts")
	err := os.WriteFile(filePath, []byte(ts), 0644)
	if err != nil {
		fmt.Println("❌ Failed to write TypeScript API client:", err)
	} else {
		fmt.Println("✅ Successfully generated TypeScript API client at:", filePath)
	}

	// ✅ Copy `request.ts` and update BASE_URL
	err = updateBaseURL(filepath.Join(tsDir, "request.ts"), baseURL)
	if err != nil {
		fmt.Println("❌ Failed to copy and update request.ts:", err)
	} else {
		fmt.Println("✅ Successfully updated request.ts with BASE_URL:", baseURL)
	}

	return err
}

func updateBaseURL(filePath, baseURL string) error {
	// Read the existing file content
	input, err := os.ReadFile(filePath)
	if err != nil {
		return fmt.Errorf("failed to read file: %w", err)
	}

	// Define regex pattern to match BASE_URL assignment
	re := regexp.MustCompile(`const BASE_URL\s*=\s*['"].*?['"]`)

	// Generate the new BASE_URL assignment
	newBaseURL := fmt.Sprintf(`const BASE_URL = '%s'`, baseURL)

	// Replace any existing BASE_URL assignment
	updatedContent := re.ReplaceAllString(string(input), newBaseURL)

	// Write the updated content back to the file
	err = os.WriteFile(filePath, []byte(updatedContent), 0644)
	if err != nil {
		return fmt.Errorf("failed to write updated file: %w", err)
	}

	fmt.Println("✅ Successfully updated BASE_URL in:", filePath)
	return nil
}

func capitalize(s string) string {
	if len(s) == 0 {
		return s
	}
	return strings.ToUpper(s[:1]) + s[1:]
}

func generateGoStructs(apex *ApexData, projectDir, subDir string) error {
	apiDir := filepath.Join(projectDir, subDir, fmt.Sprintf("%s-star/genesis", subDir), "api")

	goCode := "package api\n\n"

	// Convert schemas to a map for quick lookup
	allSchemas := make(map[string]Schema)
	for _, schema := range apex.Schemas {
		allSchemas[schema.Name] = schema
	}

	for _, schema := range apex.Schemas {
		goCode += fmt.Sprintf("type %s struct {\n", schema.Name)
		var fields map[string]json.RawMessage
		json.Unmarshal(schema.Fields, &fields)

		for key, value := range fields {
			goCode += fmt.Sprintf("  %s %s `json:\"%s\"`\n", capitalize(key), goType(value, allSchemas), key)
		}
		goCode += "}\n\n"
	}
	ensureDir(apiDir)
	filePath := filepath.Join(apiDir, "types.go")
	return os.WriteFile(filePath, []byte(goCode), 0644)
}

func goType(value json.RawMessage, allSchemas map[string]Schema) string {
	// Try to unmarshal into a string (primitive type or reference)
	var strType string
	if err := json.Unmarshal(value, &strType); err == nil {
		switch strType {
		case "string":
			return "string"
		case "number":
			return "float64"
		case "boolean":
			return "bool"
		default:
			// Assume it's a reference to another schema
			if _, exists := allSchemas[strType]; exists {
				return strType
			}
			return "interface{}" // Fallback for unknown types
		}
	}

	// Try to unmarshal into an array type
	var arrayType struct {
		Type      string `json:"type"`
		ArrayType string `json:"arrayType"`
	}
	if err := json.Unmarshal(value, &arrayType); err == nil && arrayType.Type == "array" {
		return "[]" + goType(json.RawMessage(`"`+arrayType.ArrayType+`"`), allSchemas)
	}

	return "interface{}" // Fallback if type is unknown
}

func goMethod(method string) string {
	switch strings.ToUpper(method) {
	case "GET":
		return "Get"
	case "POST":
		return "Post"
	case "PUT":
		return "Put"
	case "DELETE":
		return "Delete"
	case "PATCH":
		return "Patch"
	default:
		return ""
	}
}

func generateGoRoutes(apex *ApexData, projectDir, subDir string) error {
	goDir := filepath.Join(projectDir, subDir, fmt.Sprintf("%s-star/genesis/routes/", subDir))
	if !folderExists(goDir) {
		return nil
	}

	fmt.Println("Generating Go routes in:", goDir)

	// Group routes by API namespace (e.g., v1, users)
	routeGroups := make(map[string][]string)
	securedGroups := make(map[string][]string)

	for _, op := range apex.Operations {
		method := goMethod(op.Method)
		routePath := op.Endpoint
		handlerName := op.Name

		// Extract group name from the endpoint (e.g., "/api/v1/user" → "v1")
		parts := strings.Split(strings.TrimPrefix(routePath, "/api/"), "/")
		groupName := "root"
		if len(parts) > 0 {
			groupName = parts[0]
		}

		// Determine if the route is secured
		isSecured := false
		for _, ep := range apex.Endpoints {
			if ep.Path == routePath {
				for _, securedMethod := range ep.Secured {
					if securedMethod == op.Method {
						isSecured = true
						break
					}
				}
			}
		}

		// Append to secured or unsecured route lists
		routeDefinition := fmt.Sprintf("  r.%s(\"%s\", h.%s)", method, routePath, handlerName)
		if isSecured {
			securedGroups[groupName] = append(securedGroups[groupName], routeDefinition)
		} else {
			routeGroups[groupName] = append(routeGroups[groupName], routeDefinition)
		}
	}

	// Generate grouped route functions
	goCode := "package routes\n\nimport (\n  \"github.com/go-chi/chi/v5\"\n  \"solar-system/genesis/handler\"\n)\n\n"

	routeFuncNames := []string{}

	for group, routes := range routeGroups {
		funcName := fmt.Sprintf("add%sRoutes", capitalize(group))
		routeFuncNames = append(routeFuncNames, funcName)

		goCode += fmt.Sprintf("func %s(r chi.Router, h *handler.Handler) {\n", funcName)
		for _, route := range routes {
			goCode += route + "\n"
		}
		if secured, ok := securedGroups[group]; ok {
			goCode += "  r.Group(func(r chi.Router) {\n    r.Use(h.AuthMiddleware)\n"
			for _, route := range secured {
				goCode += "    " + route + "\n"
			}
			goCode += "  })\n"
		}
		goCode += "}\n\n"
	}

	// Generate MountRoutes function that mounts all grouped routes
	goCode += "func MountRoutes(r *chi.Mux, h *handler.Handler) {\n"
	for _, funcName := range routeFuncNames {
		goCode += fmt.Sprintf("  %s(r, h)\n", funcName)
	}
	goCode += "}\n"

	// Write to routes.go
	filePath := filepath.Join(goDir, "routes.go")
	err := os.WriteFile(filePath, []byte(goCode), 0644)
	if err != nil {
		fmt.Println("❌ Failed to write Go routes:", err)
	} else {
		fmt.Println("✅ Successfully generated routes.go at:", filePath)
	}
	return err
}

func generateGoHandlers(apex *ApexData, projectDir, subDir string) error {
	handlerDir := filepath.Join(projectDir, subDir, fmt.Sprintf("%s-star/genesis/handler/", subDir))
	if !folderExists(handlerDir) {
		fmt.Println("Creating handler directory:", handlerDir)
		if err := os.MkdirAll(handlerDir, os.ModePerm); err != nil {
			fmt.Println("❌ Failed to create handler directory:", err)
			return err
		}
	}

	fmt.Println("Generating Go handlers in:", handlerDir)

	// Organize handlers into groups based on API namespace
	handlerGroups := make(map[string][]string)

	for _, op := range apex.Operations {
		// Extract API namespace for grouping (e.g., "v1" from "/api/v1/users")
		parts := strings.Split(strings.TrimPrefix(op.Endpoint, "/api/"), "/")
		groupName := "root"
		if len(parts) > 0 {
			groupName = parts[0]
		}

		// Generate handler function
		handlerFunc := fmt.Sprintf(`
// %s handles %s requests to %s
func (h *Handler) %s(w http.ResponseWriter, r *http.Request) {
`, op.Name, op.Method, op.Endpoint, op.Name)

		// Secure routes
		for _, ep := range apex.Endpoints {
			if ep.Path == op.Endpoint {
				for _, securedMethod := range ep.Secured {
					if securedMethod == op.Method {
						handlerFunc += `
  userID, ok := GetUserID(r.Context())
  if !ok {
    http.Error(w, "Unauthorized", http.StatusUnauthorized)
    return
  }
`
					}
				}
			}
		}

		// Query Parameters Handling
		if op.QuerySchema != "" {
			handlerFunc += fmt.Sprintf("\n  params := api.%s{}\n  query := r.URL.Query()\n", op.QuerySchema)
			for _, schema := range apex.Schemas {
				if schema.Name == op.QuerySchema {
					var fields map[string]string
					json.Unmarshal(schema.Fields, &fields)
					for field := range fields {
						handlerFunc += fmt.Sprintf("  params.%s = query.Get(\"%s\")\n", capitalize(field), field)
					}
				}
			}
		}

		// Response Handling
		responseSchema := op.ResponseSchema
		if responseSchema == "" {
			responseSchema = "interface{}" // Fallback if no response schema exists
		}

		handlerFunc += fmt.Sprintf(`
  // TODO: Implement Query Logic

  response := api.%s{}
  h.JSON.Success(w, response)
}
`, responseSchema)

		// Store function in appropriate group
		handlerGroups[groupName] = append(handlerGroups[groupName], handlerFunc)
	}

	// Write each grouped handler to its own file
	for groupName, handlers := range handlerGroups {
		fileName := fmt.Sprintf("%s.go", groupName)
		filePath := filepath.Join(handlerDir, fileName)

		// Overwrite the file completely with new handlers
		handlerCode := fmt.Sprintf("package handler\n\nimport (\n  \"net/http\"\n  \"solar-system/genesis/api\"\n)\n\n%s", strings.Join(handlers, "\n"))

		err := os.WriteFile(filePath, []byte(handlerCode), 0644)
		if err != nil {
			fmt.Println("❌ Failed to write handler file:", filePath, err)
			return err
		}
		fmt.Println("✅ Successfully wrote handler file:", filePath)
	}

	return nil
}

// fileExists checks if a file exists at the given path.
func fileExists(path string) bool {
	info, err := os.Stat(path)
	if os.IsNotExist(err) {
		return false
	}
	return !info.IsDir()
}

func folderExists(path string) bool {
	_, err := os.Stat(path)
	return !os.IsNotExist(err)
}
