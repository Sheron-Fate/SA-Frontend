package app

import "time"

type Pigment struct {
    ID, Name, Brief, Description, Color, Specs, ImageKey string
    Price                                                float64
    Date                                                 time.Time
}

type SpectrumAnalysisRequest struct {
    ID, Owner  string
    Created    time.Time
    PigmentIDs []string
    Notes      string
    Comments   map[string]string
    Percent    map[string]int
    Spectrum   string
}