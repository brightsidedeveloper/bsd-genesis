Genesis - The Foundation of the Brightside Universe

Genesis is the core framework for managing and deploying services in the Brightside Universe. It provides a structured and scalable way to define, generate, and manage APIs, infrastructure, and deployments. Whether you’re building a small service or orchestrating a federation of Kubernetes clusters, Genesis ensures clarity, maintainability, and automation at every step.

🌌 Overview

Genesis is designed to be the Terraform for Go-based services, making it easy to define applications, APIs, and deployments with a declarative, JSON-based approach. It eliminates the friction of manually writing repetitive API clients, backend handlers, and infrastructure configurations by auto-generating everything from a single source of truth.

Genesis is the backbone of Apex (Application Exchange)—a client-first API management system that lets you define, generate, and deploy APIs seamlessly.

🚀 Key Features

1️⃣ APEX - Declarative API Management

Define APIs in a structured JSON format and generate:
✅ Go backend handlers
✅ Frontend API clients
✅ TanStack Query hooks for seamless data fetching
✅ TypeScript interfaces for type safety

APEX is structured into three core components:
	•	Schemas: Define objects and data structures in a reusable way.
	•	Endpoints: Specify routes, methods, and security rules.
	•	Operations: Combine schemas and endpoints into fully functioning API interactions.

Genesis eliminates the need for OpenAPI/Swagger and provides a cleaner, more structured API definition format.

2️⃣ Infrastructure & Federation

Genesis simplifies infrastructure management by allowing you to define clusters and services in a declarative JSON format.
✅ Multi-cluster federation (Built for Kubernetes)
✅ Automatic deployment of Go-based services
✅ Service discovery & gRPC-based communication

3️⃣ Modular & Scalable

Genesis supports an opinionated yet flexible structure:
	•	Galaxies 🌌 → Kubernetes clusters
	•	Solar Systems ☀️ → Go-based services running inside containers
	•	Planets 🪐 → Client applications (Web, Mobile, Desktop)
	•	Wormholes 🌀 → Secure gRPC communication channels

🛠 Usage & Workflow
	1.	Define your application
	•	Create a project.json file to describe your project.
	•	Add an apex.json file to define APIs, endpoints, and schemas.
	2.	Generate API clients & backend handlers
	•	Genesis will automatically generate Go handlers, TypeScript clients, and TanStack Query hooks based on your APEX definitions.
	3.	Deploy services
	•	Define a Galaxy (Kubernetes cluster) and deploy your Solar Systems (Go services).
	4.	Manage and iterate
	•	Modify your APEX definitions, and Genesis will keep everything in sync.

📂 File Structure

/super-cluster         # Federation of Kubernetes clusters  
  /galaxy-one          # A Kubernetes cluster  
    /solar-system-one  # A Go-based service  
      ├── Dockerfile   
      ├── main.go      
      ├── apex.json    # API definitions  
      ├── project.json # Service metadata  
  /galaxy-two  

🌍 The Future of Brightside Universe

Genesis is just the beginning. Future features will include:
🔹 Query execution within APEX for direct database interactions
🔹 Dynamic service discovery & load balancing
🔹 Advanced authentication strategies
🔹 Custom Terraform-like deployment definitions

Genesis is the foundation of the Brightside Universe—built for automation, scalability, and developer happiness.

📜 License

TBD

🤝 Contributing

Genesis is still evolving. Contributions, ideas, and feedback are welcome! Stay tuned for more updates.

Genesis: Build. Automate. Scale. 🚀