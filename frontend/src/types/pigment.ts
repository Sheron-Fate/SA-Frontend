export interface Pigment {
  id: number
  name: string
  brief: string
  description?: string
  color?: string
  specs?: string
  image_key?: string
  created_at?: string
}

export interface PigmentsResult {
  pigments: Pigment[]
  count: number
}

export interface SpectrumAnalysis {
  id: string
  name: string
  status: 'draft' | 'created' | 'completed' | 'rejected'
  spectrum?: string
  created_at: string
  formed_at?: string
  completed_at?: string
  creator_id: number
  pigments?: PigmentInAnalysis[]
}

export interface PigmentInAnalysis {
  pigment_id: number
  name: string
  brief: string
  image_key: string
  comment: string
  percent: number
}
