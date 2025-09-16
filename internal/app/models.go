package app

import "time"

type Service struct {
	ID, Name, Brief, Description, Color, Specs, ImageKey string
	Price                                                float64
	Date                                                 time.Time
}

type Application struct {
	ID, Owner  string
	Created    time.Time
	ServiceIDs []string
	Notes      string
}
