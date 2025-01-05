import Go from '@/Go'
import isEqual from 'lodash.isequal'
import { z } from 'zod'
import { create } from 'zustand'

// ✅ Endpoint Schema
export const EndpointSchema = z.object({
  path: z.string(),
  methods: z.array(z.string()),
  secure: z.boolean(),
})

// ✅ Schema Definition (Supports Nested Fields)
export const SchemaFieldSchema = z.union([
  z.string(), // Basic Type (e.g., "string", "number", "boolean")
  z.object({ type: z.string(), required: z.boolean().optional() }), // Object field
  z.array(z.string()), // Array of basic types
  z.array(z.object({ type: z.string(), required: z.boolean().optional() })), // Array of objects
])

export const SchemaSchema = z.object({
  name: z.string(),
  fields: z.record(SchemaFieldSchema), // Key-value pair where keys are field names
})

// ✅ Operation Schema
export const OperationSchema = z
  .object({
    endpoint: z.string(),
    method: z.enum(['GET', 'POST', 'PUT', 'DELETE', 'PATCH']), // Ensure valid HTTP methods
    querySchema: z.string().optional(),
    bodySchema: z.string().optional(),
    responseSchema: z.string(), // Required field
  })
  .refine(
    (data) => {
      if (data.method === 'GET') {
        return !data.bodySchema // GET should not have a body
      }
      return true
    },
    {
      message: 'GET requests cannot have a bodySchema.',
      path: ['bodySchema'],
    }
  )
  .refine(
    (data) => {
      if (['POST', 'PUT', 'DELETE'].includes(data.method)) {
        return !data.querySchema // POST, PUT, DELETE should not have query parameters
      }
      return true
    },
    {
      message: 'POST, PUT, and DELETE requests cannot have a querySchema.',
      path: ['querySchema'],
    }
  )

// ✅ Apex Schema (Full Structure)
export const ApexSchema = z.object({
  endpoints: z.array(EndpointSchema),
  schemas: z.array(SchemaSchema),
  operations: z.array(OperationSchema),
})

// ✅ Infer TypeScript Types from Zod
export type Endpoint = z.infer<typeof EndpointSchema>
export type Schema = z.infer<typeof SchemaSchema>
export type Operation = z.infer<typeof OperationSchema>
export type ApexData = z.infer<typeof ApexSchema>

// Zustand Store
interface ApexStore {
  apex: ApexData
  originalApex: ApexData
  isDirty: boolean
  reset: () => void
  clear: () => void
  loadApex: (dir: string) => Promise<void>
  addEndpoint: (endpoint: Endpoint) => void
  updateEndpoint: (index: number, updated: Endpoint) => void
  deleteEndpoint: (index: number) => void
  addSchema: (schema: Schema) => void
  updateSchema: (index: number, updated: Schema) => void
  deleteSchema: (index: number) => void
  addOperation: (operation: Operation) => void
  updateOperation: (index: number, updated: Operation) => void
  deleteOperation: (index: number) => void
  saveApex: (dir: string) => Promise<void>
}

export const useApexStore = create<ApexStore>()((set, get) => ({
  apex: { endpoints: [], schemas: [], operations: [] },
  originalApex: { endpoints: [], schemas: [], operations: [] },

  // Check if APEX data is dirty (changed)
  get isDirty() {
    return !isEqual(get().apex, get().originalApex)
  },

  reset: () => set({ apex: get().originalApex }),
  clear: () => set({ apex: { endpoints: [], schemas: [], operations: [] } }),
  // Load apex.json from backend
  loadApex: async (dir) => {
    try {
      const rawApex = await Go.apex.get(dir)
      const apex = ApexSchema.parse(rawApex)
      set({ apex, originalApex: apex })
    } catch (error) {
      console.error('❌ Error loading APEX data:', error)
    }
  },

  // CRUD Functions for Endpoints
  addEndpoint: (endpoint) => set((state) => ({ apex: { ...state.apex, endpoints: [...state.apex.endpoints, endpoint] } })),
  updateEndpoint: (index, updated) =>
    set((state) => {
      const endpoints = [...state.apex.endpoints]
      endpoints[index] = updated
      return { apex: { ...state.apex, endpoints } }
    }),
  deleteEndpoint: (index) =>
    set((state) => {
      const endpoints = [...state.apex.endpoints]
      endpoints.splice(index, 1)
      return { apex: { ...state.apex, endpoints } }
    }),

  // CRUD Functions for Schemas
  addSchema: (schema) => set((state) => ({ apex: { ...state.apex, schemas: [...state.apex.schemas, schema] } })),
  updateSchema: (index, updated) =>
    set((state) => {
      const schemas = [...state.apex.schemas]
      schemas[index] = updated
      return { apex: { ...state.apex, schemas } }
    }),
  deleteSchema: (index) =>
    set((state) => {
      const schemas = [...state.apex.schemas]
      schemas.splice(index, 1)
      return { apex: { ...state.apex, schemas } }
    }),

  // CRUD Functions for Operations
  addOperation: (operation) => set((state) => ({ apex: { ...state.apex, operations: [...state.apex.operations, operation] } })),
  updateOperation: (index, updated) =>
    set((state) => {
      const operations = [...state.apex.operations]
      operations[index] = updated
      return { apex: { ...state.apex, operations } }
    }),
  deleteOperation: (index) =>
    set((state) => {
      const operations = [...state.apex.operations]
      operations.splice(index, 1)
      return { apex: { ...state.apex, operations } }
    }),

  // Save changes to apex.json
  saveApex: async (dir) => {
    // TODO
    console.log('Saving APEX data...', dir)
  },
}))
