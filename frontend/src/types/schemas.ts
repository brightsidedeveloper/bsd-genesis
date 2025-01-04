import { z } from 'zod'

export const ProjectJSONSchema = z.object({
  name: z.string(),
  description: z.string().optional(),

  database: z.literal('postgres'),
})

export type ProjectJSONType = z.infer<typeof ProjectJSONSchema>

export const GetProjectsSchema = z
  .array(
    z.object({
      dir: z.string(),
      project: ProjectJSONSchema,
    })
  )
  .default([])

export type GetProjectsType = z.infer<typeof GetProjectsSchema>

export const CreateProjectSchema = z.object({
  dir: z.string(),
  name: z.string(),
  database: z.literal('postgres'),
})

export type CreateProjectType = z.infer<typeof CreateProjectSchema>
