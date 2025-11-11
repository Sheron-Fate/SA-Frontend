import type { Pigment, SpectrumAnalysis } from '../types/pigment'

export const PIGMENTS_MOCK: Pigment[] = [
  {
    id: 1,
    name: "Ультрамарин",
    brief: "Синий пигмент природного происхождения",
    description: "Ультрамарин - это синий пигмент, получаемый из минерала лазурита. Используется в живописи с древних времен.",
    color: "blue",
    specs: "Химическая формула: Na8-10Al6Si6O24S2-4",
    image_key: "ultramarine.jpg",
    created_at: "2024-01-15T10:30:00Z"
  },
  {
    id: 2,
    name: "Киноварь",
    brief: "Красный пигмент на основе ртути",
    description: "Киноварь - ярко-красный пигмент, получаемый из сульфида ртути. Один из самых древних красных пигментов.",
    color: "red",
    specs: "Химическая формула: HgS",
    image_key: "",
    created_at: "2024-01-16T14:20:00Z"
  },
  {
    id: 3,
    name: "Охра",
    brief: "Желто-коричневый природный пигмент",
    description: "Охра - природный пигмент желто-коричневого цвета, состоящий из оксида железа и глины.",
    color: "yellow",
    specs: "Состав: Fe2O3 + глина",
    image_key: "ochre.jpg",
    created_at: "2024-01-17T09:15:00Z"
  },
  {
    id: 4,
    name: "Уголь",
    brief: "Черный пигмент из обожженной древесины",
    description: "Уголь - черный пигмент, получаемый путем обжига древесины. Используется для создания теней и контуров.",
    color: "black",
    specs: "Состав: углерод (C)",
    image_key: "",
    created_at: "2024-01-18T16:45:00Z"
  },
  {
    id: 5,
    name: "Белая глина",
    brief: "Белый пигмент природного происхождения",
    description: "Белая глина - природный белый пигмент, состоящий из каолинита. Используется для осветления других цветов.",
    color: "white",
    specs: "Состав: Al2Si2O5(OH)4",
    image_key: "white_clay.jpg",
    created_at: "2024-01-19T11:30:00Z"
  }
]

export const SPECTRUM_ANALYSIS_MOCK: SpectrumAnalysis[] = [
  {
    id: "550e8400-e29b-41d4-a716-446655440001",
    name: "Анализ фрагмента иконы XV века",
    status: "completed",
    spectrum: "400-700nm спектр с пиками на 450nm и 650nm",
    created_at: "2024-01-20T10:00:00Z",
    formed_at: "2024-01-20T10:30:00Z",
    completed_at: "2024-01-20T15:45:00Z",
    creator_id: 1,
    pigments: [
      {
        pigment_id: 1,
        name: "Ультрамарин",
        brief: "Синий пигмент природного происхождения",
        image_key: "ultramarine.jpg",
        comment: "Основной синий пигмент",
        percent: 45.2
      },
      {
        pigment_id: 2,
        name: "Киноварь",
        brief: "Красный пигмент на основе ртути",
        image_key: "",
        comment: "Красные детали",
        percent: 23.8
      }
    ]
  }
]
